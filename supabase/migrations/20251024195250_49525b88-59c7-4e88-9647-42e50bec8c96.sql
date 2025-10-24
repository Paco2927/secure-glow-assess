-- Agregar columna para configuración de ajuste de imagen de fondo
ALTER TABLE public.theme_settings 
ADD COLUMN IF NOT EXISTS background_fit text DEFAULT 'cover';