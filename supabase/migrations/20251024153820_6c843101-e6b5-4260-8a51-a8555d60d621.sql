-- Drop existing policies
DROP POLICY IF EXISTS "Users can create assessment results" ON assessment_results;
DROP POLICY IF EXISTS "Users can update their assessment results" ON assessment_results;
DROP POLICY IF EXISTS "Admins and moderators can update all assessment results" ON assessment_results;

-- Create new INSERT policy that includes organization members
CREATE POLICY "Users and org members can create assessment results"
ON assessment_results
FOR INSERT
TO authenticated
WITH CHECK (
  -- User is the owner of the assessment
  EXISTS (
    SELECT 1 FROM assessments
    WHERE assessments.id = assessment_results.assessment_id
    AND assessments.user_id = auth.uid()
  )
  OR
  -- User is a global admin or moderator
  has_role(auth.uid(), 'admin'::app_role)
  OR
  has_role(auth.uid(), 'moderator'::app_role)
  OR
  -- User is a member of the organization that owns the assessment
  EXISTS (
    SELECT 1 FROM assessments
    JOIN organization_members ON organization_members.organization_id = assessments.organization_id
    WHERE assessments.id = assessment_results.assessment_id
    AND organization_members.user_id = auth.uid()
    AND organization_members.status = 'accepted'
  )
);

-- Create new UPDATE policy that includes organization members
CREATE POLICY "Users and org members can update assessment results"
ON assessment_results
FOR UPDATE
TO authenticated
USING (
  -- User is the owner of the assessment
  EXISTS (
    SELECT 1 FROM assessments
    WHERE assessments.id = assessment_results.assessment_id
    AND assessments.user_id = auth.uid()
  )
  OR
  -- User is a global admin or moderator
  has_role(auth.uid(), 'admin'::app_role)
  OR
  has_role(auth.uid(), 'moderator'::app_role)
  OR
  -- User is a member of the organization that owns the assessment
  EXISTS (
    SELECT 1 FROM assessments
    JOIN organization_members ON organization_members.organization_id = assessments.organization_id
    WHERE assessments.id = assessment_results.assessment_id
    AND organization_members.user_id = auth.uid()
    AND organization_members.status = 'accepted'
  )
);