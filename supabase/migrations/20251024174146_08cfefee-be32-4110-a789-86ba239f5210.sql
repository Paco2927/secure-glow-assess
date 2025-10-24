-- Update all existing moderator roles to auditor
UPDATE public.user_roles 
SET role = 'auditor'::app_role 
WHERE role = 'moderator'::app_role;