-- Make evidencias bucket private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'evidencias';

-- Add RLS policies for evidencias bucket
CREATE POLICY "Users can upload evidence for their assessments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'evidencias' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text 
    FROM assessments 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can view evidence for their assessments"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'evidencias' AND
  (
    (storage.foldername(name))[1] IN (
      SELECT id::text 
      FROM assessments 
      WHERE user_id = auth.uid()
    )
    OR
    (storage.foldername(name))[1] IN (
      SELECT a.id::text
      FROM assessments a
      JOIN organization_members om ON a.organization_id = om.organization_id
      WHERE om.user_id = auth.uid() AND om.status = 'accepted'
    )
    OR
    has_role(auth.uid(), 'admin'::app_role)
    OR
    has_role(auth.uid(), 'moderator'::app_role)
  )
);

CREATE POLICY "Users can update evidence for their assessments"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'evidencias' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text 
    FROM assessments 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete evidence for their assessments"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'evidencias' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text 
    FROM assessments 
    WHERE user_id = auth.uid()
  )
);