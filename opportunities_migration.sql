-- ============================================
-- OPPORTUNITIES TABLE MIGRATION
-- Enhanced for org posting and student filtering
-- ============================================

CREATE TABLE IF NOT EXISTS opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),

  -- Basic Info
  opportunity_name TEXT NOT NULL,
  brief_description TEXT NOT NULL,

  -- Category (one primary category for student browsing)
  category TEXT NOT NULL CHECK (category IN (
    'stem_innovation',
    'arts_design',
    'humanities_social_sciences',
    'civic_engagement_leadership',
    'health_sports_sustainability',
    'business_entrepreneurship',
    'trades_technical'
  )),

  -- Type of Enrichment Opportunity
  opportunity_type TEXT NOT NULL CHECK (opportunity_type IN (
    'program',
    'summer_opportunity',
    'internship',
    'mentorship',
    'volunteering'
  )),

  -- Duration (specific calendar dates)
  start_date DATE,
  end_date DATE,

  -- Location
  location_type TEXT NOT NULL CHECK (location_type IN ('online', 'in_person', 'hybrid')),
  location_address TEXT,  -- Physical address if applicable
  location_state TEXT,    -- US State for filtering (dropdown on form)

  -- Requirements (structured for student filtering)
  min_gpa DECIMAL(3,2) CHECK (min_gpa >= 0 AND min_gpa <= 5.0),
  min_age INTEGER CHECK (min_age >= 0 AND min_age <= 100),
  max_age INTEGER CHECK (max_age >= 0 AND max_age <= 100),
  grade_levels TEXT[],  -- Array like ['K', '1', '2', ..., '12'] or null for all
  requirements_other TEXT,  -- Free text for additional requirements

  -- Cost
  cost DECIMAL(10,2) NOT NULL DEFAULT 0,  -- 0 = free
  has_stipend BOOLEAN DEFAULT FALSE,

  -- Application Info
  application_deadline DATE NOT NULL,
  application_url TEXT NOT NULL,  -- Formal application link or website URL
  contact_info TEXT NOT NULL,     -- Where students can direct questions

  -- Status & Management
  is_active BOOLEAN DEFAULT TRUE,
  deleted_by UUID REFERENCES auth.users(id),
  deleted_at TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR FAST FILTERING
-- ============================================

CREATE INDEX idx_opportunities_organization ON opportunities(organization_id);
CREATE INDEX idx_opportunities_category ON opportunities(category);
CREATE INDEX idx_opportunities_type ON opportunities(opportunity_type);
CREATE INDEX idx_opportunities_location_type ON opportunities(location_type);
CREATE INDEX idx_opportunities_location_state ON opportunities(location_state);
CREATE INDEX idx_opportunities_deadline ON opportunities(application_deadline);
CREATE INDEX idx_opportunities_cost ON opportunities(cost);
CREATE INDEX idx_opportunities_active ON opportunities(is_active);
CREATE INDEX idx_opportunities_created_by ON opportunities(created_by);
CREATE INDEX idx_opportunities_grade_levels ON opportunities USING GIN(grade_levels);

-- ============================================
-- TRIGGERS
-- ============================================

CREATE TRIGGER update_opportunities_updated_at
  BEFORE UPDATE ON opportunities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;

-- Students can view all active opportunities
CREATE POLICY "Students can view active opportunities"
  ON opportunities FOR SELECT
  USING (is_active = TRUE);

-- Organizations can view their own opportunities (active or inactive)
CREATE POLICY "Organizations can view own opportunities"
  ON opportunities FOR SELECT
  USING (
    created_by = auth.uid()
  );

-- Approved organizations can insert opportunities
CREATE POLICY "Approved organizations can insert opportunities"
  ON opportunities FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organizations
      WHERE organizations.user_id = auth.uid()
      AND organizations.approved = TRUE
      AND organizations.verification_status = 'approved'
    )
  );

-- Organizations can update their own opportunities
CREATE POLICY "Organizations can update own opportunities"
  ON opportunities FOR UPDATE
  USING (created_by = auth.uid());

-- Organizations can delete their own opportunities (soft delete)
CREATE POLICY "Organizations can delete own opportunities"
  ON opportunities FOR DELETE
  USING (created_by = auth.uid());

-- Admins can view all opportunities (active or inactive)
CREATE POLICY "Admins can view all opportunities"
  ON opportunities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Admins can update any opportunity (for moderation)
CREATE POLICY "Admins can update any opportunity"
  ON opportunities FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Admins can delete any opportunity
CREATE POLICY "Admins can delete any opportunity"
  ON opportunities FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- ============================================
-- HELPFUL VIEWS
-- ============================================

-- Active opportunities with organization info
CREATE OR REPLACE VIEW active_opportunities_view AS
SELECT
  o.*,
  org.org_name,
  org.org_type,
  org.website_url,
  org.official_email_domain,
  EXTRACT(DAY FROM o.application_deadline - CURRENT_DATE) as days_until_deadline
FROM opportunities o
JOIN organizations org ON o.organization_id = org.id
WHERE o.is_active = TRUE
  AND o.application_deadline >= CURRENT_DATE
ORDER BY o.application_deadline ASC;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

-- Summary:
-- ✅ opportunities table with structured filtering fields
-- ✅ All indexes for performance (category, type, location, cost, grade_levels)
-- ✅ RLS policies (students view active, orgs manage own, admins moderate)
-- ✅ Triggers for updated_at
-- ✅ Helpful views for active opportunities

-- Next Steps:
-- 1. Run this migration in Supabase SQL Editor
-- 2. Create POST /api/opportunities endpoint
-- 3. Build frontend form for org posting
-- 4. Test end-to-end flow