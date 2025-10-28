-- Update trigger function to set creator's organization_role based on app role
CREATE OR REPLACE FUNCTION public.handle_new_organization()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Insert the organization creator as a member with role depending on app role
  INSERT INTO public.organization_members (
    organization_id,
    user_id,
    organization_role,
    status
  )
  VALUES (
    NEW.id,
    NEW.user_id,
    CASE 
      WHEN public.has_role(NEW.user_id, 'auditor'::app_role) THEN 'auditor'
      WHEN public.has_role(NEW.user_id, 'moderator'::app_role) THEN 'moderator'
      ELSE 'admin'
    END,
    'accepted'
  );
  RETURN NEW;
END;
$$;