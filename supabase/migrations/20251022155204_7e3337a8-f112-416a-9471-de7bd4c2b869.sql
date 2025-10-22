-- Actualizar el bucket evidencias para que sea público
UPDATE storage.buckets 
SET public = true 
WHERE id = 'evidencias';

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Usuarios autenticados pueden subir evidencias" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios pueden ver evidencias" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios pueden actualizar evidencias" ON storage.objects;

-- Política para permitir a usuarios autenticados subir evidencias
CREATE POLICY "Usuarios autenticados pueden subir evidencias"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'evidencias');

-- Política para permitir a todos ver evidencias (bucket público)
CREATE POLICY "Usuarios pueden ver evidencias"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'evidencias');

-- Política para permitir a usuarios autenticados actualizar evidencias
CREATE POLICY "Usuarios pueden actualizar evidencias"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'evidencias');