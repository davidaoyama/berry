-- ============================================
-- BERRY COMPLETE DATABASE MIGRATION
-- Run this on a fresh Supabase database
-- ============================================

-- ============================================
-- 1. CREATE ORGANIZATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS organizations (
  id SERIAL PRIMARY KEY,

  -- Basic Info
  org_name TEXT NOT NULL,
  org_type TEXT NOT NULL,
  business_id TEXT NOT NULL,

  -- Contact Info (Legacy)
  org_email TEXT NOT NULL UNIQUE,
  org_phone TEXT NOT NULL,
  org_description TEXT,

  -- New Required Fields
  website_url TEXT,
  official_email_domain TEXT,
  business_address TEXT,
  linkedin_url TEXT,

  contact_name TEXT,
  contact_role TEXT,
  contact_email TEXT,

  -- Verification & Documents
  verification_docs JSONB DEFAULT '{}',
  goals_description TEXT,

  -- Link to auth.users (CRITICAL!)
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Status & Approval
  verification_status TEXT DEFAULT 'pending' CHECK (
    verification_status IN ('pending', 'email_verified', 'approved', 'rejected')
  ),
  approved BOOLEAN DEFAULT FALSE,
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES auth.users(id),

  -- Admin Notes
  admin_notes TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add email domain validation constraint
ALTER TABLE organizations
  ADD CONSTRAINT valid_email_domain
  CHECK (official_email_domain ~* '^[a-z0-9.-]+\.[a-z]{2,}$');

-- Create indexes for organizations
CREATE INDEX idx_organizations_verification_status ON organizations(verification_status);
CREATE INDEX idx_organizations_approved ON organizations(approved);
CREATE INDEX idx_organizations_official_domain ON organizations(official_email_domain);
CREATE INDEX idx_organizations_user_id ON organizations(user_id);
CREATE INDEX idx_organizations_org_email ON organizations(org_email);
CREATE INDEX idx_organizations_contact_email ON organizations(contact_email);

-- Enable Row Level Security
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Organizations can view their own data (by user_id or email)
CREATE POLICY "Organizations can view own data"
  ON organizations FOR SELECT
  USING (
    user_id = auth.uid()
    OR org_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    OR contact_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Organizations can update their own data
CREATE POLICY "Organizations can update own data"
  ON organizations FOR UPDATE
  USING (
    user_id = auth.uid()
    OR org_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    OR contact_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Admins can view all organizations
CREATE POLICY "Admins can view all organizations"
  ON organizations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Admins can update organizations (for approval)
CREATE POLICY "Admins can update organizations"
  ON organizations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Public can insert new organizations (during registration)
CREATE POLICY "Public can insert organizations"
  ON organizations FOR INSERT
  WITH CHECK (true);

-- ============================================
-- 2. CREATE STUDENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  school TEXT NOT NULL,
  grade_level TEXT NOT NULL CHECK (grade_level IN (
    'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'
  )),
  gpa DECIMAL(3, 2) CHECK (gpa >= 0 AND gpa <= 5.0),
  age_verified BOOLEAN NOT NULL DEFAULT FALSE,
  onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for students
CREATE INDEX idx_students_email ON students(email);
CREATE INDEX idx_students_grade_level ON students(grade_level);
CREATE INDEX idx_students_school ON students(school);
CREATE INDEX idx_students_onboarding_completed ON students(onboarding_completed);

-- Enable Row Level Security
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Students can view their own profile
CREATE POLICY "Students can view own profile"
  ON students FOR SELECT
  USING (auth.uid() = id);

-- Students can update their own profile
CREATE POLICY "Students can update own profile"
  ON students FOR UPDATE
  USING (auth.uid() = id);

-- Students can insert their own profile (during onboarding)
CREATE POLICY "Students can create own profile"
  ON students FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Admins can view all students
CREATE POLICY "Admins can view all students"
  ON students FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- ============================================
-- 3. CREATE STUDENT INTERESTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS student_interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN (
    'stem_innovation',
    'arts_design',
    'humanities_social_sciences',
    'civic_engagement_leadership',
    'business_entrepreneurship',
    'trades_technical',
    'health_wellness_environment'
  )),
  is_priority BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, category)
);

-- Create indexes for student_interests
CREATE INDEX idx_student_interests_student_id ON student_interests(student_id);
CREATE INDEX idx_student_interests_category ON student_interests(category);
CREATE INDEX idx_student_interests_priority ON student_interests(is_priority);

-- Enable Row Level Security
ALTER TABLE student_interests ENABLE ROW LEVEL SECURITY;

-- Students can view their own interests
CREATE POLICY "Students can view own interests"
  ON student_interests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = student_interests.student_id
      AND students.id = auth.uid()
    )
  );

-- Students can insert their own interests
CREATE POLICY "Students can insert own interests"
  ON student_interests FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = student_interests.student_id
      AND students.id = auth.uid()
    )
  );

-- Students can update their own interests
CREATE POLICY "Students can update own interests"
  ON student_interests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = student_interests.student_id
      AND students.id = auth.uid()
    )
  );

-- Students can delete their own interests
CREATE POLICY "Students can delete own interests"
  ON student_interests FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = student_interests.student_id
      AND students.id = auth.uid()
    )
  );

-- ============================================
-- 4. CREATE STUDENT OPPORTUNITY PREFERENCES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS student_opportunity_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  preference_type TEXT NOT NULL CHECK (preference_type IN (
    'programs',
    'summer_programs',
    'internships',
    'mentorships',
    'volunteering',
    'other'
  )),
  other_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, preference_type)
);

-- Create indexes
CREATE INDEX idx_student_opportunity_prefs_student_id ON student_opportunity_preferences(student_id);

-- Enable Row Level Security
ALTER TABLE student_opportunity_preferences ENABLE ROW LEVEL SECURITY;

-- Students can manage their own preferences
CREATE POLICY "Students can manage own preferences"
  ON student_opportunity_preferences FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = student_opportunity_preferences.student_id
      AND students.id = auth.uid()
    )
  );

-- ============================================
-- 5. CREATE TRIGGER FUNCTIONS FOR UPDATED_AT
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for students table
CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON students
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for organizations table
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. CREATE HELPFUL VIEWS
-- ============================================

-- View: Complete student profiles with interest counts
CREATE OR REPLACE VIEW student_profiles_summary AS
SELECT
  s.*,
  COUNT(DISTINCT si.id) as total_interests,
  COUNT(DISTINCT CASE WHEN si.is_priority THEN si.id END) as priority_interests,
  COUNT(DISTINCT sop.id) as opportunity_preferences,
  EXTRACT(YEAR FROM AGE(s.date_of_birth)) as age
FROM students s
LEFT JOIN student_interests si ON s.id = si.student_id
LEFT JOIN student_opportunity_preferences sop ON s.id = sop.student_id
GROUP BY s.id;

-- View: Organizations pending approval (email verified)
CREATE OR REPLACE VIEW organizations_pending_approval AS
SELECT
  o.*,
  EXTRACT(DAY FROM NOW() - o.created_at) as days_pending
FROM organizations o
WHERE o.verification_status = 'email_verified'
  AND o.approved = FALSE
ORDER BY o.created_at ASC;

-- View: Organizations awaiting email verification
CREATE OR REPLACE VIEW organizations_awaiting_email AS
SELECT
  o.*,
  EXTRACT(DAY FROM NOW() - o.created_at) as days_pending
FROM organizations o
WHERE o.verification_status = 'pending'
ORDER BY o.created_at ASC;

-- ============================================
-- 7. FUTURE TABLES (Optional - for Phase 2)
-- ============================================

-- Uncomment when ready to implement opportunities system:

/*
CREATE TABLE IF NOT EXISTS opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),

  -- Basic Info
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  opportunity_type TEXT NOT NULL CHECK (opportunity_type IN (
    'internship', 'program', 'summer_program', 'scholarship',
    'mentorship', 'volunteering', 'research', 'other'
  )),
  category TEXT CHECK (category IN (
    'stem_innovation',
    'arts_design',
    'humanities_social_sciences',
    'civic_engagement_leadership',
    'business_entrepreneurship',
    'trades_technical',
    'health_wellness_environment'
  )),

  -- Location & Dates
  location_type TEXT CHECK (location_type IN ('in_person', 'remote', 'hybrid')),
  location_address TEXT,
  start_date DATE,
  end_date DATE,
  application_deadline DATE NOT NULL,

  -- Eligibility
  eligibility_criteria JSONB DEFAULT '{}',
  -- Example: { "min_gpa": 3.0, "grade_levels": ["10", "11", "12"], "schools": [], "age_range": [16, 18] }

  -- Application
  application_url TEXT,
  application_email TEXT,
  external_link TEXT,

  -- Status
  is_active BOOLEAN DEFAULT TRUE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_opportunities_organization ON opportunities(organization_id);
CREATE INDEX idx_opportunities_category ON opportunities(category);
CREATE INDEX idx_opportunities_type ON opportunities(opportunity_type);
CREATE INDEX idx_opportunities_active ON opportunities(is_active);
CREATE INDEX idx_opportunities_deadline ON opportunities(application_deadline);

-- Trigger for opportunities
CREATE TRIGGER update_opportunities_updated_at
  BEFORE UPDATE ON opportunities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
*/

/*
CREATE TABLE IF NOT EXISTS opportunity_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'saved' CHECK (status IN ('saved', 'applied', 'accepted', 'rejected')),
  applied_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(opportunity_id, student_id)
);

CREATE INDEX idx_opportunity_applications_opportunity ON opportunity_applications(opportunity_id);
CREATE INDEX idx_opportunity_applications_student ON opportunity_applications(student_id);
CREATE INDEX idx_opportunity_applications_status ON opportunity_applications(status);
*/

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

-- Summary of what was created:
-- ✅ organizations table (with user_id, verification_status, all new fields)
-- ✅ students table (linked to auth.users.id)
-- ✅ student_interests table (7 categories, priority support)
-- ✅ student_opportunity_preferences table (what students seek)
-- ✅ All RLS policies for security
-- ✅ All indexes for performance
-- ✅ Triggers for updated_at timestamps
-- ✅ Helpful views for common queries
-- 🔮 Future tables commented out (opportunities, applications)

-- Next steps:
-- 1. Run this migration in Supabase SQL Editor
-- 2. Create an admin account in Supabase Auth Dashboard
-- 3. Test student signup flow
-- 4. Test organization registration flow
-- 5. Test admin approval flow