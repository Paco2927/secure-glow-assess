-- Fix improvement_plans RLS policies to restrict access by organization membership

-- Drop existing weak policies
DROP POLICY IF EXISTS "Users can view improvement plans" ON improvement_plans;
DROP POLICY IF EXISTS "Users can create improvement plans" ON improvement_plans;
DROP POLICY IF EXISTS "Users can update improvement plans" ON improvement_plans;

-- Create organization-scoped policies
CREATE POLICY "Users can view org improvement plans"
ON improvement_plans FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id 
    FROM organization_members 
    WHERE user_id = auth.uid() AND status = 'accepted'
  ) OR
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'moderator'::app_role)
);

CREATE POLICY "Users can create org improvement plans"
ON improvement_plans FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id 
    FROM organization_members 
    WHERE user_id = auth.uid() AND status = 'accepted'
  ) OR
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'moderator'::app_role)
);

CREATE POLICY "Users can update org improvement plans"
ON improvement_plans FOR UPDATE
USING (
  organization_id IN (
    SELECT organization_id 
    FROM organization_members 
    WHERE user_id = auth.uid() AND status = 'accepted'
  ) OR
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'moderator'::app_role)
);