-- Add column for multiple evidence files
ALTER TABLE assessment_results ADD COLUMN IF NOT EXISTS proof_images JSONB DEFAULT '[]'::jsonb;

-- Add comment explaining the structure
COMMENT ON COLUMN assessment_results.proof_images IS 'Array of evidence objects with structure: [{url: string, fileName: string, uploadedAt: timestamp}]';