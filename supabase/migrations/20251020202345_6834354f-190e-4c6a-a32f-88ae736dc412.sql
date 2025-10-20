-- Consolidate assessments SELECT policies
DROP POLICY IF EXISTS "Users can view their assessments" ON public.assessments;
DROP POLICY IF EXISTS "Organization members can view their org assessments" ON public.assessments;
DROP POLICY IF EXISTS "Admins and moderators can view all assessments" ON public.assessments;

CREATE POLICY "Users can view assessments"
ON public.assessments
FOR SELECT
TO authenticated
USING (
  -- Admins and moderators can view all
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'moderator'::app_role)
  -- Or user is the assessment creator
  OR user_id = auth.uid()
  -- Or user is an accepted member of the organization
  OR organization_id IN (
    SELECT organization_id 
    FROM public.organization_members 
    WHERE user_id = auth.uid() 
    AND status = 'accepted'
  )
);

-- Consolidate assessment_results SELECT policies
DROP POLICY IF EXISTS "Users can view their assessment results" ON public.assessment_results;
DROP POLICY IF EXISTS "Organization members can view their org assessment results" ON public.assessment_results;
DROP POLICY IF EXISTS "Admins and moderators can view all assessment results" ON public.assessment_results;

CREATE POLICY "Users can view assessment results"
ON public.assessment_results
FOR SELECT
TO authenticated
USING (
  -- Admins and moderators can view all
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'moderator'::app_role)
  -- Or assessment belongs to the user
  OR assessment_id IN (
    SELECT id FROM public.assessments WHERE user_id = auth.uid()
  )
  -- Or assessment belongs to an organization where user is an accepted member
  OR assessment_id IN (
    SELECT id FROM public.assessments
    WHERE organization_id IN (
      SELECT organization_id 
      FROM public.organization_members 
      WHERE user_id = auth.uid() 
      AND status = 'accepted'
    )
  )
);