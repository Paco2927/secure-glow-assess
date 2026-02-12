-- Force update all theme colors to blue
UPDATE public.theme_settings 
SET colors = jsonb_build_object(
  'primary', '215 80% 45%',
  'primary-foreground', '0 0% 100%',
  'secondary', '210 60% 55%',
  'secondary-foreground', '0 0% 100%',
  'accent', '215 80% 45%',
  'accent-foreground', '0 0% 100%',
  'destructive', '0 84.2% 60.2%',
  'destructive-foreground', '0 0% 100%',
  'muted', '210 20% 96%',
  'muted-foreground', '215 16% 47%',
  'background', '0 0% 100%',
  'foreground', '240 10% 15%'
)
WHERE is_active = true;