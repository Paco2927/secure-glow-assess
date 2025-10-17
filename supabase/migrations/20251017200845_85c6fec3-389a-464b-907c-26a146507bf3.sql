-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Users can view their organizations" ON public.organizations;

-- Create a security definer function to check organization membership
-- This prevents recursion by using SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.is_organization_member(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members
    WHERE user_id = _user_id
      AND organization_id = _org_id
      AND status = 'accepted'
  )
$$;

-- Create new policy that uses the security definer function
CREATE POLICY "Users can view organizations they own or are members of"
ON public.organizations
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() 
  OR public.is_organization_member(auth.uid(), id)
  OR has_role(auth.uid(), 'admin'::app_role)
);