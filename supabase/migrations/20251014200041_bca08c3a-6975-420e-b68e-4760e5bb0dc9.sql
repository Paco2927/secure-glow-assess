-- Add DELETE policy for assessments
CREATE POLICY "Users can delete their assessments"
ON public.assessments
FOR DELETE
USING (auth.uid() = user_id);

-- Add DELETE policy for assessment_results
CREATE POLICY "Users can delete their assessment results"
ON public.assessment_results
FOR DELETE
USING (EXISTS (
  SELECT 1
  FROM public.assessments
  WHERE assessments.id = assessment_results.assessment_id
    AND assessments.user_id = auth.uid()
));