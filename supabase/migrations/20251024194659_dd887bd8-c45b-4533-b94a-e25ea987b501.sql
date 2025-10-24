-- Agregar columna para favicon en theme_settings
ALTER TABLE public.theme_settings 
ADD COLUMN IF NOT EXISTS favicon_url text;