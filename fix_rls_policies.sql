-- ============================================
-- FIX RLS POLICIES FOR OPPORTUNITIES
-- The issue is that the policies are checking auth.users table
-- which may not be accessible to the organization user
-- ============================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Students can view active opportunities" ON opportunities;
DROP POLICY IF EXISTS "Organizations can view own opportunities" ON opportunities;
DROP POLICY IF EXISTS "Approved organizations can insert opportunities" ON opportunities;
DROP POLICY IF EXISTS "Organizations can update own opportunities" ON opportunities;
DROP POLICY IF EXISTS "Organizations can delete own opportunities" ON opportunities;
DROP POLICY IF EXISTS "Admins can view all opportunities" ON opportunities;
DROP POLICY IF EXISTS "Admins can update any opportunity" ON opportunities;
DROP POLICY IF EXISTS "Admins can delete any opportunity" ON opportunities;

-- ============================================
-- SIMPLIFIED RLS POLICIES
-- ============================================

-- Organizations can view their own opportunities (using created_by)
CREATE POLICY "Organizations can view own opportunities"
  ON opportunities FOR SELECT
  USING (created_by = auth.uid());

-- Approved organizations can insert opportunities
CREATE POLICY "Approved organizations can insert opportunities"
  ON opportunities FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organizations
      WHERE organizations.user_id = auth.uid()
      AND organizations.approved = TRUE
    )
  );

-- Organizations can update their own opportunities
CREATE POLICY "Organizations can update own opportunities"
  ON opportunities FOR UPDATE
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Organizations can delete their own opportunities
CREATE POLICY "Organizations can delete own opportunities"
  ON opportunities FOR DELETE
  USING (created_by = auth.uid());

-- Students can view all active opportunities (no auth check needed for viewing)
CREATE POLICY "Students can view active opportunities"
  ON opportunities FOR SELECT
  USING (is_active = TRUE);

-- ============================================
-- Optional: Admin policies (only if you have admins)
-- ============================================

-- If you have admin users with role='admin' in user_metadata, uncomment these:

/*
CREATE POLICY "Admins can view all opportunities"
  ON opportunities FOR SELECT
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Admins can update any opportunity"
  ON opportunities FOR UPDATE
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Admins can delete any opportunity"
  ON opportunities FOR DELETE
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );
*/

-- ============================================
-- VERIFY POLICIES
-- ============================================

SELECT 'RLS policies updated successfully!' as message;

-- Show all policies on opportunities table
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'opportunities';