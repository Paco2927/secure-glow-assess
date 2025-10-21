-- Update assessments delete policy to only allow admins and moderators
DROP POLICY IF EXISTS "Users can delete their assessments" ON public.assessments;

CREATE POLICY "Only admins and moderators can delete assessments"
ON public.assessments
FOR DELETE
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'moderator'::app_role)
);