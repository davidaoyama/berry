-- ============================================
-- CHECK ORGANIZATION APPROVAL STATUS
-- ============================================

-- First, let's see what your organization status looks like
SELECT
  id,
  org_name,
  user_id,
  approved,
  verification_status,
  created_at
FROM organizations
ORDER BY created_at DESC
LIMIT 5;

-- ============================================
-- FIX: Update verification_status to 'approved' if approved = true
-- ============================================

-- This will set verification_status to 'approved' for any org that has approved = true
UPDATE organizations
SET verification_status = 'approved'
WHERE approved = true
  AND verification_status != 'approved';

-- Check results
SELECT
  id,
  org_name,
  approved,
  verification_status,
  '✓ Ready to post opportunities' as status
FROM organizations
WHERE approved = true;

-- ============================================
-- ALTERNATIVE: Simplify the RLS policy
-- ============================================

-- Drop the existing policy
DROP POLICY IF EXISTS "Approved organizations can insert opportunities" ON opportunities;

-- Create a simpler policy that only checks the 'approved' column
CREATE POLICY "Approved organizations can insert opportunities"
  ON opportunities FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organizations
      WHERE organizations.user_id = auth.uid()
      AND organizations.approved = TRUE
    )
  );

SELECT 'RLS policy updated! Organizations with approved=true can now post opportunities.' as message;