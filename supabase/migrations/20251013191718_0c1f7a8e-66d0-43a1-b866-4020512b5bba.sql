-- First, delete any profiles without DNI (test accounts)
DELETE FROM public.profiles WHERE dni IS NULL;

-- Make DNI unique and required in profiles table
ALTER TABLE public.profiles 
  ALTER COLUMN dni SET NOT NULL,
  ADD CONSTRAINT profiles_dni_unique UNIQUE (dni);

-- Add index for efficient DNI lookups
CREATE INDEX idx_profiles_dni ON public.profiles(dni);

-- Update handle_new_user function to extract and save DNI
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, name, email, dni)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', 'Usuario'),
    new.email,
    new.raw_user_meta_data->>'dni'
  );
  RETURN new;
END;
$function$;