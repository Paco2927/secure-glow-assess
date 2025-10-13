-- First, make DNI optional
ALTER TABLE public.profiles 
  ALTER COLUMN dni DROP NOT NULL;

-- Drop the existing unique constraint and index
ALTER TABLE public.profiles 
  DROP CONSTRAINT IF EXISTS profiles_dni_unique;

DROP INDEX IF EXISTS idx_profiles_dni;
DROP INDEX IF EXISTS profiles_dni_unique_idx;

-- Create a unique partial index that only applies to non-NULL DNI values
CREATE UNIQUE INDEX profiles_dni_unique_idx ON public.profiles(dni) WHERE dni IS NOT NULL;

-- Now restore missing profiles for existing auth users
INSERT INTO public.profiles (id, name, email, dni)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'name', 'Usuario') as name,
  au.email,
  NULL as dni
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = au.id
);