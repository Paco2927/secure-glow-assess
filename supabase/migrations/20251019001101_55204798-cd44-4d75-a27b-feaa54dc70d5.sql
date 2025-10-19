-- Fix RLS policy role inconsistency for assessment_results
-- Drop the existing UPDATE policy and recreate it with 'public' role instead of 'authenticated'
DROP POLICY IF EXISTS "Users can update their assessment results" ON public.assessment_results;

CREATE POLICY "Users can update their assessment results"
ON public.assessment_results
FOR UPDATE
TO public  -- Changed from 'authenticated' to 'public' for consistency
USING (
  EXISTS (
    SELECT 1 FROM assessments
    WHERE assessments.id = assessment_results.assessment_id
    AND assessments.user_id = auth.uid()
  )
);