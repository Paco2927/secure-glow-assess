-- Create organization-logos bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('organization-logos', 'organization-logos', true);

-- Policy for INSERT - authenticated users can upload organization logos
CREATE POLICY "Usuarios autenticados pueden subir logos de organizaciones"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'organization-logos');

-- Policy for UPDATE - authenticated users can update logos
CREATE POLICY "Usuarios autenticados pueden actualizar logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'organization-logos');

-- Policy for SELECT - logos are publicly accessible
CREATE POLICY "Logos son públicamente accesibles"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'organization-logos');

-- Policy for DELETE - authenticated users can delete logos
CREATE POLICY "Usuarios autenticados pueden eliminar logos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'organization-logos');