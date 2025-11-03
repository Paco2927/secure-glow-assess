-- Enable RLS on theme_settings if not already enabled
ALTER TABLE public.theme_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Allow public read access to active theme" ON public.theme_settings;

-- Create policy to allow anyone (including anonymous users) to read active theme settings
CREATE POLICY "Allow public read access to active theme"
ON public.theme_settings
FOR SELECT
TO public
USING (is_active = true);