-- Allow admins and moderators to view all assessment results
CREATE POLICY "Admins and moderators can view all assessment results"
ON public.assessment_results
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'moderator'::app_role)
);

-- Allow admins and moderators to update all assessment results
CREATE POLICY "Admins and moderators can update all assessment results"
ON public.assessment_results
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'moderator'::app_role)
);

-- Allow admins and moderators to view all assessments
CREATE POLICY "Admins and moderators can view all assessments"
ON public.assessments
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'moderator'::app_role)
);