-- Create enums for risk management
CREATE TYPE public.risk_level AS ENUM ('low', 'medium', 'high', 'extreme');
CREATE TYPE public.treatment_status AS ENUM ('open', 'in_progress', 'closed', 'accepted');
CREATE TYPE public.likelihood_level AS ENUM ('rare', 'unlikely', 'possible', 'likely', 'almost_certain');
CREATE TYPE public.impact_level AS ENUM ('negligible', 'minor', 'moderate', 'major', 'critical');

-- Risks table
CREATE TABLE public.risks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  asset TEXT NOT NULL,
  owner TEXT NOT NULL,
  threat TEXT NOT NULL,
  vulnerability TEXT NOT NULL,
  control_reference TEXT,
  risk_description TEXT NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Risk assessments table (stores current and historical assessments)
CREATE TABLE public.risk_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  risk_id UUID NOT NULL REFERENCES public.risks(id) ON DELETE CASCADE,
  likelihood INTEGER NOT NULL CHECK (likelihood >= 1 AND likelihood <= 5),
  impact INTEGER NOT NULL CHECK (impact >= 1 AND impact <= 5),
  risk_score INTEGER NOT NULL,
  risk_level risk_level NOT NULL,
  existing_controls TEXT,
  residual_risk TEXT,
  assessment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  assessed_by UUID NOT NULL,
  is_current BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Risk treatments table
CREATE TABLE public.risk_treatments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  risk_id UUID NOT NULL REFERENCES public.risks(id) ON DELETE CASCADE,
  treatment_plan TEXT NOT NULL,
  responsible_person TEXT NOT NULL,
  target_date DATE,
  status treatment_status NOT NULL DEFAULT 'open',
  review_date DATE,
  notes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Risk audit log table
CREATE TABLE public.risk_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  risk_id UUID NOT NULL REFERENCES public.risks(id) ON DELETE CASCADE,
  changed_by UUID NOT NULL,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  action TEXT NOT NULL,
  field_changed TEXT,
  old_value TEXT,
  new_value TEXT,
  description TEXT
);

-- Risk matrix configuration table
CREATE TABLE public.risk_matrix_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  name TEXT NOT NULL DEFAULT 'Default Matrix',
  likelihood_scale INTEGER NOT NULL DEFAULT 5 CHECK (likelihood_scale IN (4, 5)),
  impact_scale INTEGER NOT NULL DEFAULT 5 CHECK (impact_scale IN (4, 5)),
  scoring_formula TEXT NOT NULL DEFAULT 'likelihood * impact',
  color_zones JSONB NOT NULL DEFAULT '{"low": {"max": 6, "color": "#22c55e"}, "medium": {"max": 12, "color": "#eab308"}, "high": {"max": 20, "color": "#f97316"}, "extreme": {"max": 25, "color": "#ef4444"}}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.risks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_treatments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_matrix_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies for risks
CREATE POLICY "Users can view organization risks"
  ON public.risks FOR SELECT
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'moderator'::app_role) OR
    is_organization_member(auth.uid(), organization_id)
  );

CREATE POLICY "Admins and moderators can create risks"
  ON public.risks FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'moderator'::app_role) OR
    is_organization_member(auth.uid(), organization_id)
  );

CREATE POLICY "Admins and moderators can update risks"
  ON public.risks FOR UPDATE
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'moderator'::app_role) OR
    is_organization_member(auth.uid(), organization_id)
  );

CREATE POLICY "Admins and moderators can delete risks"
  ON public.risks FOR DELETE
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'moderator'::app_role)
  );

-- RLS Policies for risk_assessments
CREATE POLICY "Users can view organization risk assessments"
  ON public.risk_assessments FOR SELECT
  USING (
    risk_id IN (
      SELECT id FROM public.risks
      WHERE has_role(auth.uid(), 'admin'::app_role) OR
            has_role(auth.uid(), 'moderator'::app_role) OR
            is_organization_member(auth.uid(), organization_id)
    )
  );

CREATE POLICY "Admins and moderators can create assessments"
  ON public.risk_assessments FOR INSERT
  WITH CHECK (
    risk_id IN (
      SELECT id FROM public.risks
      WHERE has_role(auth.uid(), 'admin'::app_role) OR
            has_role(auth.uid(), 'moderator'::app_role) OR
            is_organization_member(auth.uid(), organization_id)
    )
  );

CREATE POLICY "Admins and moderators can update assessments"
  ON public.risk_assessments FOR UPDATE
  USING (
    risk_id IN (
      SELECT id FROM public.risks
      WHERE has_role(auth.uid(), 'admin'::app_role) OR
            has_role(auth.uid(), 'moderator'::app_role) OR
            is_organization_member(auth.uid(), organization_id)
    )
  );

-- RLS Policies for risk_treatments
CREATE POLICY "Users can view organization risk treatments"
  ON public.risk_treatments FOR SELECT
  USING (
    risk_id IN (
      SELECT id FROM public.risks
      WHERE has_role(auth.uid(), 'admin'::app_role) OR
            has_role(auth.uid(), 'moderator'::app_role) OR
            is_organization_member(auth.uid(), organization_id)
    )
  );

CREATE POLICY "Admins and moderators can create treatments"
  ON public.risk_treatments FOR INSERT
  WITH CHECK (
    risk_id IN (
      SELECT id FROM public.risks
      WHERE has_role(auth.uid(), 'admin'::app_role) OR
            has_role(auth.uid(), 'moderator'::app_role) OR
            is_organization_member(auth.uid(), organization_id)
    )
  );

CREATE POLICY "Admins and moderators can update treatments"
  ON public.risk_treatments FOR UPDATE
  USING (
    risk_id IN (
      SELECT id FROM public.risks
      WHERE has_role(auth.uid(), 'admin'::app_role) OR
            has_role(auth.uid(), 'moderator'::app_role) OR
            is_organization_member(auth.uid(), organization_id)
    )
  );

-- RLS Policies for risk_audit_log
CREATE POLICY "Users can view organization risk audit logs"
  ON public.risk_audit_log FOR SELECT
  USING (
    risk_id IN (
      SELECT id FROM public.risks
      WHERE has_role(auth.uid(), 'admin'::app_role) OR
            has_role(auth.uid(), 'moderator'::app_role) OR
            is_organization_member(auth.uid(), organization_id)
    )
  );

CREATE POLICY "System can insert audit logs"
  ON public.risk_audit_log FOR INSERT
  WITH CHECK (true);

-- RLS Policies for risk_matrix_config
CREATE POLICY "Users can view matrix configs"
  ON public.risk_matrix_config FOR SELECT
  USING (
    organization_id IS NULL OR
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'moderator'::app_role) OR
    is_organization_member(auth.uid(), organization_id)
  );

CREATE POLICY "Admins can manage matrix configs"
  ON public.risk_matrix_config FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create triggers for updated_at
CREATE TRIGGER update_risks_updated_at
  BEFORE UPDATE ON public.risks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_risk_treatments_updated_at
  BEFORE UPDATE ON public.risk_treatments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_risk_matrix_config_updated_at
  BEFORE UPDATE ON public.risk_matrix_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default matrix configuration
INSERT INTO public.risk_matrix_config (name, organization_id) 
VALUES ('Default ISO 27001 Matrix', NULL);