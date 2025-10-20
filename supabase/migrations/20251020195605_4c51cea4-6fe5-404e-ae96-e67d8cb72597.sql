-- Add RLS policies for organization members to view assessments and results

-- Policy for organization members to view assessments from their organizations
CREATE POLICY "Organization members can view their org assessments"
ON public.assessments
FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id 
    FROM public.organization_members 
    WHERE user_id = auth.uid() 
    AND status = 'accepted'
  )
);

-- Policy for organization members to view assessment results from their organizations
CREATE POLICY "Organization members can view their org assessment results"
ON public.assessment_results
FOR SELECT
USING (
  assessment_id IN (
    SELECT id FROM assessments
    WHERE organization_id IN (
      SELECT organization_id 
      FROM public.organization_members 
      WHERE user_id = auth.uid() 
      AND status = 'accepted'
    )
  )
);