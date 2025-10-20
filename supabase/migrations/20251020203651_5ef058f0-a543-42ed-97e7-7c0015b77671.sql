-- Drop and recreate the view without SECURITY DEFINER to fix the security issue
DROP VIEW IF EXISTS public.accessible_assessments;

-- Recreate the view with proper security (SECURITY INVOKER is the default and safe option)
CREATE OR REPLACE VIEW public.accessible_assessments 
WITH (security_invoker = true)
AS
SELECT 
  a.*,
  CASE 
    WHEN a.user_id = auth.uid() THEN 'owner'
    WHEN public.has_role(auth.uid(), 'admin'::app_role) 
         OR public.has_role(auth.uid(), 'moderator'::app_role) THEN 'admin'
    WHEN public.is_organization_member(auth.uid(), a.organization_id) THEN 'organization_member'
    ELSE 'none'
  END as access_type
FROM public.assessments a;

COMMENT ON VIEW public.accessible_assessments IS 
'Provides a unified view of all assessments accessible to the current user with their access type.
Access types: owner (created the assessment), admin (admin/moderator role), organization_member (member of org), none (no access).
Uses SECURITY INVOKER to enforce RLS policies of the querying user.';