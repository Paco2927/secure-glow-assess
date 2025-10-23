-- Allow all authenticated users to view active theme settings
-- This is needed so all users can see the customized logo and background images
DROP POLICY IF EXISTS "Anyone can view active theme settings" ON public.theme_settings;

CREATE POLICY "Anyone can view active theme settings"
ON public.theme_settings
FOR SELECT
TO authenticated
USING (is_active = true);

-- Keep admin-only policies for modifying theme settings
-- (existing policies for INSERT, UPDATE, DELETE remain unchanged)