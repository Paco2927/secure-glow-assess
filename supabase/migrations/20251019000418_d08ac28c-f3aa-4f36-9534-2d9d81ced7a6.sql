-- Add UPDATE policy for assessment_results to allow upsert operations
CREATE POLICY "Users can update their assessment results"
ON public.assessment_results
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM assessments
    WHERE assessments.id = assessment_results.assessment_id
    AND assessments.user_id = auth.uid()
  )
);