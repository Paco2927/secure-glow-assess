-- Remove moderator access from administrative tables

-- Contact Settings: Solo admins
DROP POLICY IF EXISTS "Admins can insert contact settings" ON public.contact_settings;
DROP POLICY IF EXISTS "Admins can update contact settings" ON public.contact_settings;
DROP POLICY IF EXISTS "Admins can delete contact settings" ON public.contact_settings;

CREATE POLICY "Only admins can insert contact settings" 
ON public.contact_settings 
FOR INSERT 
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update contact settings" 
ON public.contact_settings 
FOR UPDATE 
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete contact settings" 
ON public.contact_settings 
FOR DELETE 
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Theme Settings: Solo admins (ya están bien, solo verificamos)
DROP POLICY IF EXISTS "Admins can insert theme settings" ON public.theme_settings;
DROP POLICY IF EXISTS "Admins can update theme settings" ON public.theme_settings;
DROP POLICY IF EXISTS "Admins can delete theme settings" ON public.theme_settings;
DROP POLICY IF EXISTS "Admins can view theme settings" ON public.theme_settings;

CREATE POLICY "Only admins can insert theme settings" 
ON public.theme_settings 
FOR INSERT 
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update theme settings" 
ON public.theme_settings 
FOR UPDATE 
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete theme settings" 
ON public.theme_settings 
FOR DELETE 
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can view all theme settings" 
ON public.theme_settings 
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- User Roles: Solo admins (ya están bien)
-- Domains: Moderators pueden ver y gestionar, mantenemos como está
-- Controls: Moderators pueden ver y gestionar, mantenemos como está
-- Improvement Plan Templates: Moderators pueden ver y gestionar, mantenemos como está

-- Organizations: Solo admins y moderators pueden crear
DROP POLICY IF EXISTS "Admins and moderators can create organizations" ON public.organizations;

CREATE POLICY "Only admins can create organizations" 
ON public.organizations 
FOR INSERT 
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'));