-- Add assessment_id to risks table to link risks to specific assessments
ALTER TABLE public.risks ADD COLUMN assessment_id UUID REFERENCES public.assessments(id) ON DELETE CASCADE;

-- Update RLS policies to include assessment-based access
DROP POLICY IF EXISTS "Users can view organization risks" ON public.risks;
CREATE POLICY "Users can view organization risks"
  ON public.risks FOR SELECT
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'moderator'::app_role) OR
    is_organization_member(auth.uid(), organization_id) OR
    assessment_id IN (
      SELECT id FROM assessments 
      WHERE user_id = auth.uid()
    )
  );

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_risks_assessment_id ON public.risks(assessment_id);