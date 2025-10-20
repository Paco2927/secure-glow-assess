-- Add performance index for organization membership queries
CREATE INDEX IF NOT EXISTS idx_organization_members_user_status 
ON public.organization_members(user_id, status) 
WHERE status = 'accepted';

-- Add index for assessment organization queries
CREATE INDEX IF NOT EXISTS idx_assessments_organization_user 
ON public.assessments(organization_id, user_id);

-- Add comments to document RLS policy behavior for assessments
COMMENT ON POLICY "Users can view assessments" ON public.assessments IS 
'Allows users to view assessments if they are:
1. Admin or moderator (full access)
2. The assessment creator (user_id matches)
3. A member of the organization the assessment belongs to (via organization_members with accepted status)
Note: This policy does NOT check the user role (user/admin/moderator) for organization members - only membership status matters.';

-- Add comments to document RLS policy behavior for assessment_results
COMMENT ON POLICY "Users can view assessment results" ON public.assessment_results IS 
'Allows users to view assessment results if they are:
1. Admin or moderator (full access)
2. Owner of the assessment (via assessments.user_id)
3. Member of the organization that owns the assessment (via organization_members with accepted status)
Note: Regular organization members with role "user" CAN view results of their organization assessments.';

-- Create a helpful view for users to see all assessments they have access to
CREATE OR REPLACE VIEW public.accessible_assessments AS
SELECT 
  a.*,
  CASE 
    WHEN a.user_id = auth.uid() THEN 'owner'
    WHEN EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'moderator')
    ) THEN 'admin'
    WHEN EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.user_id = auth.uid() 
      AND om.organization_id = a.organization_id
      AND om.status = 'accepted'
    ) THEN 'organization_member'
    ELSE 'none'
  END as access_type
FROM public.assessments a;

COMMENT ON VIEW public.accessible_assessments IS 
'Provides a unified view of all assessments accessible to the current user with their access type.
Access types: owner (created the assessment), admin (admin/moderator role), organization_member (member of org), none (no access).';

-- Add index for faster role checks
CREATE INDEX IF NOT EXISTS idx_user_roles_user_role 
ON public.user_roles(user_id, role);