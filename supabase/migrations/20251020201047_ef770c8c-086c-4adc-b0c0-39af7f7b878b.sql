-- Drop existing policies with incorrect role configuration
DROP POLICY IF EXISTS "Organization members can view their org assessments" ON public.assessments;
DROP POLICY IF EXISTS "Organization members can view their org assessment results" ON public.assessment_results;

-- Recreate policies with correct 'authenticated' role
CREATE POLICY "Organization members can view their org assessments"
ON public.assessments
FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id 
    FROM public.organization_members 
    WHERE user_id = auth.uid() 
    AND status = 'accepted'
  )
);

CREATE POLICY "Organization members can view their org assessment results"
ON public.assessment_results
FOR SELECT
TO authenticated
USING (
  assessment_id IN (
    SELECT id FROM public.assessments
    WHERE organization_id IN (
      SELECT organization_id 
      FROM public.organization_members 
      WHERE user_id = auth.uid() 
      AND status = 'accepted'
    )
  )
);