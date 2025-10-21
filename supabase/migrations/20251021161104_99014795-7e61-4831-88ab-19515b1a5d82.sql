-- Create table for theme customization settings
CREATE TABLE public.theme_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  colors jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.theme_settings ENABLE ROW LEVEL SECURITY;

-- Policies: Only admins can manage theme settings
CREATE POLICY "Admins can view theme settings"
ON public.theme_settings FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert theme settings"
ON public.theme_settings FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update theme settings"
ON public.theme_settings FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete theme settings"
ON public.theme_settings FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_theme_settings_updated_at
BEFORE UPDATE ON public.theme_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default theme
INSERT INTO public.theme_settings (name, is_active, colors) 
VALUES ('default', true, '{
  "primary": "222.2 47.4% 11.2%",
  "primary-foreground": "210 40% 98%",
  "secondary": "210 40% 96.1%",
  "secondary-foreground": "222.2 47.4% 11.2%",
  "accent": "210 40% 96.1%",
  "accent-foreground": "222.2 47.4% 11.2%",
  "destructive": "0 84.2% 60.2%",
  "destructive-foreground": "210 40% 98%"
}'::jsonb);