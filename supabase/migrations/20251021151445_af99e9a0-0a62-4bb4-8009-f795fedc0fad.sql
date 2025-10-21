-- Create table for contact settings
CREATE TABLE IF NOT EXISTS public.contact_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  destination_email text NOT NULL,
  company_phone text,
  company_location text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contact_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can view contact settings
CREATE POLICY "Anyone can view contact settings"
  ON public.contact_settings
  FOR SELECT
  USING (true);

-- Only admins can insert contact settings
CREATE POLICY "Admins can insert contact settings"
  ON public.contact_settings
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can update contact settings
CREATE POLICY "Admins can update contact settings"
  ON public.contact_settings
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can delete contact settings
CREATE POLICY "Admins can delete contact settings"
  ON public.contact_settings
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default contact settings
INSERT INTO public.contact_settings (destination_email, company_phone, company_location)
VALUES ('info@techsecureai.com', '+(506) 62979402', 'San José, Costa Rica')
ON CONFLICT DO NOTHING;

-- Create trigger for updated_at
CREATE TRIGGER update_contact_settings_updated_at
  BEFORE UPDATE ON public.contact_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();