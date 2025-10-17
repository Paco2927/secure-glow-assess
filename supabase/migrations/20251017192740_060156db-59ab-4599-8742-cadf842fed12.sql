-- Add status field to assessments table
CREATE TYPE assessment_status AS ENUM ('pending', 'completed');

ALTER TABLE assessments 
ADD COLUMN status assessment_status NOT NULL DEFAULT 'pending';

-- Create organization_members table
CREATE TABLE organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  organization_role text, -- Manual role like "gerente de administración"
  invited_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'accepted' CHECK (status IN ('pending', 'accepted', 'rejected')),
  invited_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

-- Enable RLS on organization_members
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- RLS policies for organization_members
-- Users can view members of organizations they belong to
CREATE POLICY "Users can view organization members"
ON organization_members FOR SELECT
USING (
  auth.uid() IN (
    SELECT user_id FROM organization_members 
    WHERE organization_id = organization_members.organization_id
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Organization owners (who created the org) and admins can insert members
CREATE POLICY "Organization owners and admins can add members"
ON organization_members FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM organizations 
    WHERE id = organization_id 
    AND user_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Organization owners and admins can update members
CREATE POLICY "Organization owners and admins can update members"
ON organization_members FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM organizations 
    WHERE id = organization_id 
    AND user_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Organization owners and admins can delete members
CREATE POLICY "Organization owners and admins can delete members"
ON organization_members FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM organizations 
    WHERE id = organization_id 
    AND user_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Update organizations RLS policies - only admins can create organizations
DROP POLICY IF EXISTS "Users can create their own organizations" ON organizations;

CREATE POLICY "Only admins can create organizations"
ON organizations FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Users can view organizations they own or are members of
DROP POLICY IF EXISTS "Users can view their own organizations" ON organizations;

CREATE POLICY "Users can view their organizations"
ON organizations FOR SELECT
USING (
  user_id = auth.uid() 
  OR auth.uid() IN (
    SELECT user_id FROM organization_members 
    WHERE organization_id = organizations.id
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);