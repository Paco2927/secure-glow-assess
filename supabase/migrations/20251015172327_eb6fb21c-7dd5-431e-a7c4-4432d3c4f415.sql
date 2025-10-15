-- Add user_id column to organizations table
ALTER TABLE public.organizations 
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update existing organizations to have a user_id (set to null for now)
-- New organizations will require user_id

-- Drop existing RLS policies
DROP POLICY IF EXISTS "Users can create organizations" ON public.organizations;
DROP POLICY IF EXISTS "Users can update organizations" ON public.organizations;
DROP POLICY IF EXISTS "Users can view all organizations" ON public.organizations;

-- Create new RLS policies that are user-specific
CREATE POLICY "Users can create their own organizations"
ON public.organizations
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own organizations"
ON public.organizations
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own organizations"
ON public.organizations
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own organizations"
ON public.organizations
FOR DELETE
USING (auth.uid() = user_id);