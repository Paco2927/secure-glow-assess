-- Drop existing policy for viewing assessments
DROP POLICY IF EXISTS "Users can view assessments" ON public.assessments;

-- Create updated policy that restricts moderators to their organizations only
CREATE POLICY "Users can view assessments"
ON public.assessments
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  (user_id = auth.uid()) OR
  (organization_id IN (
    SELECT organization_members.organization_id
    FROM organization_members
    WHERE organization_members.user_id = auth.uid()
      AND organization_members.status = 'accepted'
  ))
);

-- Drop existing policy for viewing assessment results
DROP POLICY IF EXISTS "Users can view assessment results" ON public.assessment_results;

-- Create updated policy for assessment results that restricts moderators
CREATE POLICY "Users can view assessment results"
ON public.assessment_results
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  (assessment_id IN (
    SELECT assessments.id
    FROM assessments
    WHERE assessments.user_id = auth.uid()
  )) OR
  (assessment_id IN (
    SELECT assessments.id
    FROM assessments
    WHERE assessments.organization_id IN (
      SELECT organization_members.organization_id
      FROM organization_members
      WHERE organization_members.user_id = auth.uid()
        AND organization_members.status = 'accepted'
    )
  ))
);