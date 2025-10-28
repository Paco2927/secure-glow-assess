-- Update policy for editing organizations
-- Auditores pueden actualizar sus propias organizaciones
DROP POLICY IF EXISTS "Users can update their own organizations" ON public.organizations;

CREATE POLICY "Users and auditors can update their own organizations" 
ON public.organizations
FOR UPDATE 
USING (
  auth.uid() = user_id OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Update policy for deleting organizations
-- Auditores pueden eliminar sus propias organizaciones
DROP POLICY IF EXISTS "Users can delete their own organizations" ON public.organizations;

CREATE POLICY "Users and auditors can delete their own organizations" 
ON public.organizations
FOR DELETE 
USING (
  auth.uid() = user_id OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Update policies for organization_members
-- Permitir que auditores que son dueños de la organización puedan gestionar miembros

DROP POLICY IF EXISTS "Organization owners, admins and moderators can add members" ON public.organization_members;

CREATE POLICY "Organization owners, admins, moderators and auditors can add members" 
ON public.organization_members
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM organizations 
    WHERE organizations.id = organization_members.organization_id 
    AND organizations.user_id = auth.uid()
  ) OR 
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'moderator'::app_role)
);

DROP POLICY IF EXISTS "Organization owners, admins and moderators can update members" ON public.organization_members;

CREATE POLICY "Organization owners, admins, moderators and auditors can update members" 
ON public.organization_members
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 
    FROM organizations 
    WHERE organizations.id = organization_members.organization_id 
    AND organizations.user_id = auth.uid()
  ) OR 
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'moderator'::app_role)
);

DROP POLICY IF EXISTS "Organization owners, admins and moderators can delete members" ON public.organization_members;

CREATE POLICY "Organization owners, admins, moderators and auditors can delete members" 
ON public.organization_members
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 
    FROM organizations 
    WHERE organizations.id = organization_members.organization_id 
    AND organizations.user_id = auth.uid()
  ) OR 
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'moderator'::app_role)
);