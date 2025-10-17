-- Create function to automatically add organization creator as admin member
CREATE OR REPLACE FUNCTION public.handle_new_organization()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert the organization creator as an admin member
  INSERT INTO public.organization_members (
    organization_id,
    user_id,
    organization_role,
    status
  )
  VALUES (
    NEW.id,
    NEW.user_id,
    'admin',
    'accepted'
  );
  RETURN NEW;
END;
$$;

-- Create trigger to execute function after organization insert
CREATE TRIGGER on_organization_created
  AFTER INSERT ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_organization();