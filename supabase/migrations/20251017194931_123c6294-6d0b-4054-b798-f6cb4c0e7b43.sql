-- Fix infinite recursion in organization_members RLS policies
-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view organization members" ON organization_members;

-- Create a new policy that doesn't cause recursion
-- Members can be viewed by organization owners or admins
CREATE POLICY "Organization owners and admins can view members"
ON organization_members
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM organizations 
    WHERE organizations.id = organization_members.organization_id 
    AND organizations.user_id = auth.uid()
  ) 
  OR has_role(auth.uid(), 'admin'::app_role)
);