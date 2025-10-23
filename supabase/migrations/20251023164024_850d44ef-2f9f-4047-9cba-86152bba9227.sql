-- Drop and recreate policy to allow moderators to create organizations
DROP POLICY IF EXISTS "Only admins can create organizations" ON public.organizations;

CREATE POLICY "Admins and moderators can create organizations"
ON public.organizations
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'moderator'::app_role)
);

-- Drop and recreate policy to allow moderators to add members
DROP POLICY IF EXISTS "Organization owners and admins can add members" ON public.organization_members;

CREATE POLICY "Organization owners, admins and moderators can add members"
ON public.organization_members
FOR INSERT
WITH CHECK (
  (EXISTS (
    SELECT 1
    FROM organizations
    WHERE organizations.id = organization_members.organization_id
      AND organizations.user_id = auth.uid()
  )) OR 
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'moderator'::app_role)
);

-- Drop and recreate policy to allow moderators to update members
DROP POLICY IF EXISTS "Organization owners and admins can update members" ON public.organization_members;

CREATE POLICY "Organization owners, admins and moderators can update members"
ON public.organization_members
FOR UPDATE
USING (
  (EXISTS (
    SELECT 1
    FROM organizations
    WHERE organizations.id = organization_members.organization_id
      AND organizations.user_id = auth.uid()
  )) OR 
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'moderator'::app_role)
);

-- Drop and recreate policy to allow moderators to delete members
DROP POLICY IF EXISTS "Organization owners and admins can delete members" ON public.organization_members;

CREATE POLICY "Organization owners, admins and moderators can delete members"
ON public.organization_members
FOR DELETE
USING (
  (EXISTS (
    SELECT 1
    FROM organizations
    WHERE organizations.id = organization_members.organization_id
      AND organizations.user_id = auth.uid()
  )) OR 
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'moderator'::app_role)
);