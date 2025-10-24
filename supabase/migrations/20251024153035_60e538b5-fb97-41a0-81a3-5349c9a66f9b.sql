-- Política para permitir que moderadores y admins de organizaciones puedan subir evidencias
-- Primero eliminamos políticas existentes si las hay para evitar conflictos
DROP POLICY IF EXISTS "Users can upload evidence for their organization" ON storage.objects;
DROP POLICY IF EXISTS "Users can update evidence for their organization" ON storage.objects;
DROP POLICY IF EXISTS "Users can view evidence for their organization" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete evidence for their organization" ON storage.objects;

-- Política para insertar (subir) evidencias
-- Permite a usuarios autenticados subir evidencias para evaluaciones de sus organizaciones
-- o si son admin/moderador globales
CREATE POLICY "Users can upload evidence for their organization"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'evidencias' AND
  (
    -- Admins y moderadores globales pueden subir evidencias
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'moderator'::app_role) OR
    -- Usuarios que son miembros de la organización de la evaluación pueden subir
    EXISTS (
      SELECT 1
      FROM assessments a
      JOIN organization_members om ON om.organization_id = a.organization_id
      WHERE om.user_id = auth.uid()
      AND om.status = 'accepted'
      AND (storage.foldername(name))[1] = a.id::text
    )
  )
);

-- Política para actualizar evidencias
CREATE POLICY "Users can update evidence for their organization"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'evidencias' AND
  (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'moderator'::app_role) OR
    EXISTS (
      SELECT 1
      FROM assessments a
      JOIN organization_members om ON om.organization_id = a.organization_id
      WHERE om.user_id = auth.uid()
      AND om.status = 'accepted'
      AND (storage.foldername(name))[1] = a.id::text
    )
  )
);

-- Política para ver evidencias
CREATE POLICY "Users can view evidence for their organization"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'evidencias' AND
  (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'moderator'::app_role) OR
    EXISTS (
      SELECT 1
      FROM assessments a
      JOIN organization_members om ON om.organization_id = a.organization_id
      WHERE om.user_id = auth.uid()
      AND om.status = 'accepted'
      AND (storage.foldername(name))[1] = a.id::text
    )
  )
);

-- Política para eliminar evidencias (solo admins y moderadores)
CREATE POLICY "Users can delete evidence for their organization"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'evidencias' AND
  (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'moderator'::app_role)
  )
);