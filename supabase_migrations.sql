-- ============================================
-- BERRY DATABASE MIGRATION
-- Separate Student & Organization Tables
-- ============================================

-- ============================================
-- 1. STUDENTS TABLE
-- Stores all student profile information
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

-- Enable Row Level Security
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Students can read and update their own profile
CREATE POLICY "Students can view own profile"
  ON students FOR SELECT
  USING (auth.uid() = id);

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

-- Index for faster lookups
CREATE INDEX idx_students_email ON students(email);
CREATE INDEX idx_students_grade_level ON students(grade_level);
CREATE INDEX idx_students_school ON students(school);

-- ============================================
-- 2. STUDENT INTERESTS TABLE
-- Stores student interest categories and priorities
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

-- Enable Row Level Security
ALTER TABLE student_interests ENABLE ROW LEVEL SECURITY;

-- Students can manage their own interests
CREATE POLICY "Students can view own interests"
  ON student_interests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = student_interests.student_id
      AND students.id = auth.uid()
    )
  );

CREATE POLICY "Students can insert own interests"
  ON student_interests FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = student_interests.student_id
      AND students.id = auth.uid()
    )
  );

CREATE POLICY "Students can update own interests"
  ON student_interests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = student_interests.student_id
      AND students.id = auth.uid()
    )
  );

CREATE POLICY "Students can delete own interests"
  ON student_interests FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = student_interests.student_id
      AND students.id = auth.uid()
    )
  );

-- Index for faster lookups
CREATE INDEX idx_student_interests_student_id ON student_interests(student_id);
CREATE INDEX idx_student_interests_category ON student_interests(category);
CREATE INDEX idx_student_interests_priority ON student_interests(is_priority);

-- ============================================
-- 3. UPDATE ORGANIZATIONS TABLE
-- Add new required fields for verification
-- ============================================

-- Add new columns to existing organizations table
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS website_url TEXT,
  ADD COLUMN IF NOT EXISTS official_email_domain TEXT,
  ADD COLUMN IF NOT EXISTS business_address TEXT,
  ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
  ADD COLUMN IF NOT EXISTS contact_name TEXT,
  ADD COLUMN IF NOT EXISTS contact_role TEXT,
  ADD COLUMN IF NOT EXISTS contact_email TEXT,
  ADD COLUMN IF NOT EXISTS verification_docs JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS goals_description TEXT,
  ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending'
    CHECK (verification_status IN ('pending', 'email_verified', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS admin_notes TEXT,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add constraints for new fields
ALTER TABLE organizations
  ADD CONSTRAINT valid_email_domain CHECK (official_email_domain ~* '^[a-z0-9.-]+\.[a-z]{2,}$');

-- Update existing records to have verification_status
UPDATE organizations
SET verification_status = CASE
  WHEN approved = TRUE THEN 'approved'
  ELSE 'pending'
END
WHERE verification_status IS NULL;

-- Create index for verification status
CREATE INDEX IF NOT EXISTS idx_organizations_verification_status ON organizations(verification_status);
CREATE INDEX IF NOT EXISTS idx_organizations_official_domain ON organizations(official_email_domain);

-- Enable Row Level Security (if not already enabled)
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to recreate them)
DROP POLICY IF EXISTS "Organizations can view own data" ON organizations;
DROP POLICY IF EXISTS "Admins can view all organizations" ON organizations;
DROP POLICY IF EXISTS "Public can insert organizations" ON organizations;

-- Organizations can view their own data
CREATE POLICY "Organizations can view own data"
  ON organizations FOR SELECT
  USING (
    org_email = (
      SELECT email FROM auth.users WHERE auth.users.id = auth.uid()
    )
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

-- Public can insert new organizations (during registration)
CREATE POLICY "Public can insert organizations"
  ON organizations FOR INSERT
  WITH CHECK (true);

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

-- ============================================
-- 4. CREATE OPPORTUNITY SEEKING PREFERENCES TABLE
-- What students are looking for
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

-- Create index
CREATE INDEX idx_student_opportunity_prefs_student_id ON student_opportunity_preferences(student_id);

-- ============================================
-- 5. TRIGGER FUNCTIONS FOR UPDATED_AT
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
DROP TRIGGER IF EXISTS update_students_updated_at ON students;
CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON students
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for organizations table
DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. HELPFUL VIEWS FOR QUERIES
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

-- View: Organizations ready for approval
CREATE OR REPLACE VIEW organizations_pending_approval AS
SELECT
  o.*,
  EXTRACT(DAY FROM NOW() - o.created_at) as days_pending
FROM organizations o
WHERE o.verification_status = 'pending'
ORDER BY o.created_at ASC;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

-- Summary of changes:
-- 1. Created students table with profile data
-- 2. Created student_interests table for interest tracking
-- 3. Created student_opportunity_preferences table
-- 4. Expanded organizations table with verification fields
-- 5. Added RLS policies for all tables
-- 6. Created helpful views for common queries
-- 7. Added triggers for updated_at timestamps
