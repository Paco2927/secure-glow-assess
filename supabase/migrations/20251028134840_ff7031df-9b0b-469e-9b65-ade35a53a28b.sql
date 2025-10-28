-- Drop the existing policy
DROP POLICY IF EXISTS "Only admins can create organizations" ON public.organizations;

-- Create new policy allowing both admins and auditors to create organizations
CREATE POLICY "Admins and auditors can create organizations" 
ON public.organizations
FOR INSERT 
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'auditor'::app_role)
);