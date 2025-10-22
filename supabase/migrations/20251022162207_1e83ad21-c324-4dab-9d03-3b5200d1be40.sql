-- Add logo_url column to organizations table
ALTER TABLE public.organizations 
ADD COLUMN logo_url text;

-- Create index for faster queries
CREATE INDEX idx_organizations_logo_url ON public.organizations(logo_url);

COMMENT ON COLUMN public.organizations.logo_url IS 'URL del logo de la organización almacenado en Supabase Storage';