-- Add unique constraint on assessment_id and control_id to support upsert operations
-- This allows updating existing results when users continue a pending assessment

ALTER TABLE public.assessment_results 
DROP CONSTRAINT IF EXISTS assessment_results_assessment_id_control_id_key;

ALTER TABLE public.assessment_results 
ADD CONSTRAINT assessment_results_assessment_id_control_id_key 
UNIQUE (assessment_id, control_id);