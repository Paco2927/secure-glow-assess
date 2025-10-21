-- Drop the existing restrictive SELECT policy on organization_members
DROP POLICY IF EXISTS "Organization owners and admins can view members" ON public.organization_members;

-- Create new policy that allows organization members to view each other
CREATE POLICY "Organization members can view other members"
ON public.organization_members
FOR SELECT
USING (
  -- Organization owners can see all members
  EXISTS (
    SELECT 1 FROM public.organizations
    WHERE organizations.id = organization_members.organization_id
    AND organizations.user_id = auth.uid()
  )
  -- OR admins can see all members
  OR has_role(auth.uid(), 'admin'::app_role)
  -- OR organization members can see other members of their organization
  OR is_organization_member(auth.uid(), organization_members.organization_id)
);