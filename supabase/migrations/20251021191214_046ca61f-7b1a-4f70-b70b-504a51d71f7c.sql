-- 1. Add profile visibility for organization members
CREATE POLICY "Organization members can view each other's profiles"
ON profiles FOR SELECT
USING (
  id IN (
    SELECT om.user_id 
    FROM organization_members om
    WHERE om.organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid() AND status = 'accepted'
    )
    AND om.status = 'accepted'
  )
);

-- 2. Create contact submissions log table for rate limiting
CREATE TABLE contact_submissions_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address text NOT NULL,
  email text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on contact_submissions_log
ALTER TABLE contact_submissions_log ENABLE ROW LEVEL SECURITY;

-- Only the system (edge function) can insert logs
CREATE POLICY "System can insert contact logs"
ON contact_submissions_log FOR INSERT
WITH CHECK (true);

-- Admins can view logs for monitoring
CREATE POLICY "Admins can view contact logs"
ON contact_submissions_log FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Create index for efficient rate limit queries
CREATE INDEX idx_contact_submissions_ip_created 
ON contact_submissions_log(ip_address, created_at DESC);

-- 3. Update handle_new_user function with input validation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_name text;
  v_dni text;
BEGIN
  -- Validate and sanitize name
  v_name := COALESCE(TRIM(new.raw_user_meta_data->>'name'), 'Usuario');
  IF LENGTH(v_name) > 100 THEN
    v_name := SUBSTRING(v_name, 1, 100);
  END IF;
  IF LENGTH(v_name) < 1 THEN
    v_name := 'Usuario';
  END IF;
  
  -- Validate and sanitize DNI
  v_dni := TRIM(COALESCE(new.raw_user_meta_data->>'dni', ''));
  IF LENGTH(v_dni) > 20 THEN
    v_dni := SUBSTRING(v_dni, 1, 20);
  END IF;
  
  -- Insert profile with validated data
  INSERT INTO public.profiles (id, name, email, dni)
  VALUES (new.id, v_name, new.email, v_dni);
  
  -- Insert default 'user' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'user'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN new;
END;
$function$;

-- 4. Add table constraints for defense in depth
ALTER TABLE profiles 
  ADD CONSTRAINT name_length_check CHECK (LENGTH(name) BETWEEN 1 AND 100),
  ADD CONSTRAINT dni_length_check CHECK (dni IS NULL OR LENGTH(dni) <= 20);