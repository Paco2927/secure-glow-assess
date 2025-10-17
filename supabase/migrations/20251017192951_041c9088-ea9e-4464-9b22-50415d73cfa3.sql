-- Create organization_members table only if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'organization_members') THEN
        CREATE TABLE organization_members (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
          user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
          organization_role text,
          invited_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
          status text NOT NULL DEFAULT 'accepted' CHECK (status IN ('pending', 'accepted', 'rejected')),
          invited_at timestamp with time zone DEFAULT now(),
          created_at timestamp with time zone DEFAULT now(),
          UNIQUE(organization_id, user_id)
        );

        ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view organization members" ON organization_members;
DROP POLICY IF EXISTS "Organization owners and admins can add members" ON organization_members;
DROP POLICY IF EXISTS "Organization owners and admins can update members" ON organization_members;
DROP POLICY IF EXISTS "Organization owners and admins can delete members" ON organization_members;
DROP POLICY IF EXISTS "Users can create their own organizations" ON organizations;
DROP POLICY IF EXISTS "Only admins can create organizations" ON organizations;
DROP POLICY IF EXISTS "Users can view their own organizations" ON organizations;
DROP POLICY IF EXISTS "Users can view their organizations" ON organizations;

-- RLS policies for organization_members
CREATE POLICY "Users can view organization members"
ON organization_members FOR SELECT
USING (
  auth.uid() IN (
    SELECT user_id FROM organization_members 
    WHERE organization_id = organization_members.organization_id
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);

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

-- Update organizations RLS policies
CREATE POLICY "Only admins can create organizations"
ON organizations FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

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