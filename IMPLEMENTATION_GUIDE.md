# BERRY Implementation Guide

## Overview

This document provides complete instructions for implementing the new separated student and organization signup flows for the BERRY application.

## What Changed

### Previous State
- **All users** (students and organizations) were being saved into a single flow
- Limited information collected during signup
- No differentiation between student and organization onboarding

### New State
- **Students** have a streamlined email-only signup → complete profile in onboarding
- **Organizations** fill out comprehensive multi-step verification form
- Separate database tables for students, organizations, and student interests
- Progressive onboarding for students with interest selection

---

## Database Migration

### Step 1: Run the SQL Migration

Execute the SQL migration file to create new tables:

```bash
# Location: /supabase_migrations.sql
```

This migration creates:

1. **`students` table** - Student profiles with:
   - Basic info (name, DOB, school, grade, GPA)
   - Age verification status
   - Onboarding completion tracking

2. **`student_interests` table** - Student interest categories:
   - 7 predefined categories (STEM, Arts, etc.)
   - Priority interest tracking (3-5 required)

3. **`student_opportunity_preferences` table** - What students are looking for:
   - Programs, internships, mentorships, etc.

4. **Updated `organizations` table** - Enhanced with:
   - Website, official email domain, business address
   - Contact person information
   - Verification documents (JSONB)
   - Goals description
   - Verification status workflow

### Step 2: Verify Tables Created

In Supabase dashboard, confirm these tables exist:
- `students`
- `student_interests`
- `student_opportunity_preferences`
- `organizations` (with new columns)

### Step 3: Check Row Level Security

The migration automatically sets up RLS policies:
- Students can only view/edit their own data
- Organizations can only view their own data
- Admins can view all data

---

## Application Structure

### New File Structure

```
src/app/
├── (public)/
│   ├── auth/page.tsx              # Updated: Email-only signup for students
│   └── org/page.tsx                # Updated: Multi-step org registration
│
├── (protected)/
│   ├── onboarding/
│   │   ├── profile/page.tsx        # NEW: Student profile collection
│   │   └── interests/page.tsx      # NEW: Student interest selection
│   └── dashboard/
│       ├── student/page.tsx        # Existing
│       ├── org/page.tsx            # Existing
│       └── admin/page.tsx          # Existing
│
├── api/
│   ├── org-registration/route.ts   # Updated: Handle new org fields
│   ├── student-profile/route.ts    # NEW: Student profile CRUD
│   └── student-interests/route.ts  # NEW: Student interests CRUD
│
├── auth/
│   └── verify/page.tsx             # Updated: Routes to onboarding
│
└── lib/
    └── supabaseClient.ts           # Existing
```

---

## User Flows

### Student Signup & Onboarding Flow

```
1. Visit /auth?mode=signup
   └─> Select "Student"
   └─> Enter LAUSD/USC email only (no name required)
   └─> Click magic link in email

2. Email Verification (/auth/verify)
   └─> Domain validation (must be lausd.net or usc.edu)
   └─> Check if profile exists
   └─> Route to /onboarding/profile

3. Profile Collection (/onboarding/profile)
   └─> Age verification checkbox (13+)
   └─> First name, last name
   └─> Date of birth
   └─> School attending
   └─> Grade level (K-12)
   └─> GPA (optional)
   └─> Save to students table

4. Interest Selection (/onboarding/interests)
   └─> Select opportunity types (programs, internships, etc.)
   └─> Select 5+ interest categories
   └─> Mark 3-5 as priority interests
   └─> Save to student_interests table
   └─> Mark onboarding_completed = true
   └─> Redirect to /dashboard/student
```

### Organization Signup Flow

```
1. Visit /org (or /auth?mode=signup → select "Organization")

2. Step 1: Basic Company Information
   └─> Organization name (legal name)
   └─> Type (university, nonprofit, business, other)
   └─> Website URL
   └─> Official email domain
   └─> Phone number
   └─> Business address
   └─> LinkedIn (optional)

3. Step 2: Verification & Contact
   └─> Contact name and role
   └─> Official email (must match domain from Step 1)
   └─> Business ID / Org ID

   Type-Specific Requirements:
   ├─> Universities: IPEDS/NCES ID or .edu domain
   ├─> Businesses: EIN + Business License Number
   ├─> Nonprofits: EIN + 501(c)(3) confirmation
   └─> Other: Valid Business ID

4. Step 3: Goals & Mission
   └─> Description of goals with students (min 50 chars)

5. Submission
   └─> Save to organizations table
   └─> verification_status = 'pending'
   └─> approved = false
   └─> Email confirmation sent
   └─> Wait for admin approval (2-3 business days)

6. After Approval
   └─> Admin sets approved = true
   └─> Organization can sign in via /org/login
   └─> Access /dashboard/org
```

---

## API Endpoints

### Student Profile API

**POST /api/student-profile**
```typescript
{
  userId: string,          // From auth.users.id
  email: string,
  firstName: string,
  lastName: string,
  dateOfBirth: string,     // YYYY-MM-DD
  school: string,
  gradeLevel: string,      // K-12
  gpa?: number,            // 0.0-5.0
  ageVerified: boolean
}
```

**GET /api/student-profile?userId={id}**
```typescript
Response: {
  exists: boolean,
  profile?: StudentProfile,
  onboardingCompleted?: boolean
}
```

**PATCH /api/student-profile**
```typescript
{
  userId: string,
  [field]: value           // Any updatable field
}
```

### Student Interests API

**POST /api/student-interests**
```typescript
{
  userId: string,
  interests: Array<{
    category: string,      // stem_innovation, arts_design, etc.
    isPriority: boolean
  }>,
  opportunityPreferences: Array<{
    preferenceType: string,  // programs, internships, etc.
    otherDescription?: string
  }>
}
```

**GET /api/student-interests?userId={id}**
```typescript
Response: {
  interests: StudentInterest[],
  opportunityPreferences: OpportunityPreference[]
}
```

### Organization Registration API

**POST /api/org-registration**
```typescript
{
  // Step 1
  organizationName: string,
  organizationType: 'university' | 'business' | 'nonprofit' | 'other',
  website: string,
  officialEmailDomain: string,
  phoneNumber: string,
  businessAddress: string,
  linkedinUrl?: string,

  // Step 2
  contactName: string,
  contactRole: string,
  contactEmail: string,    // Must match officialEmailDomain
  businessId: string,

  // Type-specific
  ein?: string,
  ipeds?: string,
  businessLicense?: string,
  nonprofit501c3?: string,

  // Step 3
  goalsDescription: string  // Min 50 chars
}
```

**GET /api/org-registration?email={email}**
```typescript
Response: {
  id: number,
  name: string,
  verificationStatus: 'pending' | 'email_verified' | 'approved' | 'rejected',
  approved: boolean,
  submittedAt: string
}
```

---

## Configuration

### Environment Variables

No new environment variables required! The existing Supabase configuration works:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_ALLOWED_DOMAINS=usc.edu,lausd.net
```

### Domain Restrictions

Students can only sign up with emails from:
- `usc.edu` (for testing)
- `lausd.net` (production LAUSD students)

To add more domains, update:
```env
NEXT_PUBLIC_ALLOWED_DOMAINS=usc.edu,lausd.net,newdomain.edu
```

---

## Testing Checklist

### Student Flow Testing

- [ ] Visit `/auth?mode=signup`
- [ ] Select "Student" role
- [ ] Enter USC/LAUSD email
- [ ] Receive and click magic link
- [ ] Verify redirect to `/onboarding/profile`
- [ ] Fill out profile form
- [ ] Verify redirect to `/onboarding/interests`
- [ ] Select 5+ interests, mark 3-5 as priority
- [ ] Verify redirect to `/dashboard/student`
- [ ] Confirm data in `students` table
- [ ] Confirm data in `student_interests` table

### Organization Flow Testing

- [ ] Visit `/org`
- [ ] Complete Step 1 (Company Info)
- [ ] Complete Step 2 (Verification - select org type)
- [ ] Complete Step 3 (Goals)
- [ ] Submit form
- [ ] Verify success message
- [ ] Check `organizations` table for new record
- [ ] Verify `verification_status` = 'pending'
- [ ] Verify `approved` = false
- [ ] Test admin approval in `/dashboard/admin`

### Edge Cases to Test

- [ ] Student with non-LAUSD/USC email (should be rejected)
- [ ] Organization with mismatched contact email domain
- [ ] Student under 13 years old
- [ ] Organization without required type-specific documents
- [ ] Duplicate email addresses
- [ ] Duplicate business IDs

---

## Common Issues & Solutions

### Issue: Students going directly to dashboard instead of onboarding

**Solution:** Check the `checkStudentOnboarding` function in `/auth/verify/page.tsx`. It should:
1. Call `/api/student-profile?userId={id}`
2. If no profile exists → route to `/onboarding/profile`
3. If profile exists but !onboardingCompleted → route to `/onboarding/interests`
4. If onboardingCompleted → route to `/dashboard/student`

### Issue: Organization can't sign up (type-specific validation fails)

**Solution:** Check the organization registration form validation in `/org/page.tsx`:
- Universities: Need IPEDS ID OR .edu domain
- Businesses: Need both EIN AND Business License
- Nonprofits: Need both EIN AND 501(c)(3) reference

### Issue: RLS policies blocking data access

**Solution:** Verify in Supabase dashboard:
1. Check that policies exist for students/organizations tables
2. Ensure `auth.uid()` matches the user's ID
3. Check user metadata has correct `role` field

### Issue: Onboarding pages are publicly accessible

**Solution:** These pages are in `(protected)` route group. Verify:
1. Middleware at `/middleware.ts` is protecting `/onboarding/*`
2. User has valid session before accessing

---

## Data Model Summary

### students table
```sql
- id (UUID, FK to auth.users)
- email
- first_name, last_name
- date_of_birth
- school
- grade_level (K-12)
- gpa (0.0-5.0)
- age_verified (boolean)
- onboarding_completed (boolean)
- created_at, updated_at
```

### student_interests table
```sql
- id (UUID)
- student_id (FK to students)
- category (enum: 7 categories)
- is_priority (boolean)
- created_at
```

### student_opportunity_preferences table
```sql
- id (UUID)
- student_id (FK to students)
- preference_type (enum: programs, internships, etc.)
- other_description (text, nullable)
- created_at
```

### organizations table (enhanced)
```sql
Existing columns:
- id, org_name, org_type, org_email, org_phone
- org_description, business_id, approved, created_at

New columns:
- website_url
- official_email_domain
- business_address
- linkedin_url
- contact_name, contact_role, contact_email
- verification_docs (JSONB)
- goals_description
- verification_status (enum)
- admin_notes, approved_at, approved_by
- updated_at
```

---

## Next Steps (Future Features)

### Not Yet Implemented

1. **Opportunities Management**
   - Organizations can post opportunities
   - Students can browse and filter
   - Save/like functionality

2. **Applications System**
   - Students apply to opportunities
   - Organizations review applications
   - Status tracking

3. **Email Notifications**
   - Welcome emails
   - Approval notifications
   - Application updates

4. **Admin Features**
   - User management
   - System analytics
   - Advanced organization verification

5. **Student Dashboard Enhancements**
   - Personalized feed based on interests
   - Saved opportunities display
   - Application tracking

---

## Support & Questions

For implementation questions:
1. Check this guide first
2. Review the code comments in key files
3. Test with the provided testing checklist
4. Verify database schema matches migration

Key files for reference:
- Student onboarding: `/onboarding/profile/page.tsx`, `/onboarding/interests/page.tsx`
- Organization registration: `/org/page.tsx`
- Auth routing: `/auth/verify/page.tsx`
- API routes: `/api/student-profile/route.ts`, `/api/student-interests/route.ts`
- Database migration: `/supabase_migrations.sql`

---

**Implementation Complete!** ✅

All files have been created and updated. Follow the steps above to deploy and test the new signup flows.