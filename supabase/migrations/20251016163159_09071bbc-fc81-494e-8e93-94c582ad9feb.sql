-- Create table for improvement plan templates
CREATE TABLE public.improvement_plan_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  control_id UUID NOT NULL REFERENCES public.controls(id) ON DELETE CASCADE,
  maturity_level_id UUID NOT NULL REFERENCES public.maturity_levels(id) ON DELETE CASCADE,
  template_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(control_id, maturity_level_id)
);

-- Enable RLS
ALTER TABLE public.improvement_plan_templates ENABLE ROW LEVEL SECURITY;

-- Anyone can view templates
CREATE POLICY "Anyone can view improvement plan templates"
ON public.improvement_plan_templates
FOR SELECT
USING (true);

-- Admins and moderators can insert templates
CREATE POLICY "Admins and moderators can insert improvement plan templates"
ON public.improvement_plan_templates
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

-- Admins and moderators can update templates
CREATE POLICY "Admins and moderators can update improvement plan templates"
ON public.improvement_plan_templates
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

-- Admins and moderators can delete templates
CREATE POLICY "Admins and moderators can delete improvement plan templates"
ON public.improvement_plan_templates
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_improvement_plan_templates_updated_at
BEFORE UPDATE ON public.improvement_plan_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();