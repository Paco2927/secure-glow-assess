-- Create enum for maturity level names
CREATE TYPE maturity_level_name AS ENUM ('Inicial', 'Repetible', 'Definido', 'Gestionado', 'Optimizado');

-- Create enum for improvement plan status
CREATE TYPE plan_status AS ENUM ('Pendiente', 'En Progreso', 'Completado');

-- Create organizations table
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  sector TEXT,
  country TEXT,
  contact_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create domains table
CREATE TABLE public.domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  standard TEXT NOT NULL CHECK (standard IN ('ISO27001', 'NIST'))
);

-- Create controls table
CREATE TABLE public.controls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id UUID REFERENCES public.domains(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT
);

-- Create maturity_levels table
CREATE TABLE public.maturity_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level INTEGER NOT NULL CHECK (level >= 1 AND level <= 5),
  name maturity_level_name NOT NULL,
  description TEXT,
  UNIQUE(level)
);

-- Create assessments table
CREATE TABLE public.assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  assessor_name TEXT,
  assessment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  standard TEXT NOT NULL CHECK (standard IN ('ISO27001', 'NIST')),
  comments TEXT
);

-- Create assessment_results table
CREATE TABLE public.assessment_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID REFERENCES public.assessments(id) ON DELETE CASCADE,
  control_id UUID REFERENCES public.controls(id) ON DELETE CASCADE,
  maturity_level_id UUID REFERENCES public.maturity_levels(id),
  evidence TEXT,
  improvement_action TEXT
);

-- Create improvement_plans table
CREATE TABLE public.improvement_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  control_id UUID REFERENCES public.controls(id),
  action_description TEXT NOT NULL,
  responsible TEXT,
  target_date DATE,
  status plan_status DEFAULT 'Pendiente'
);

-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  dni TEXT UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maturity_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.improvement_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- RLS Policies for organizations
CREATE POLICY "Users can view all organizations"
  ON public.organizations FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create organizations"
  ON public.organizations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update organizations"
  ON public.organizations FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- RLS Policies for domains (public read)
CREATE POLICY "Anyone can view domains"
  ON public.domains FOR SELECT
  USING (true);

-- RLS Policies for controls (public read)
CREATE POLICY "Anyone can view controls"
  ON public.controls FOR SELECT
  USING (true);

-- RLS Policies for maturity_levels (public read)
CREATE POLICY "Anyone can view maturity levels"
  ON public.maturity_levels FOR SELECT
  USING (true);

-- RLS Policies for assessments
CREATE POLICY "Users can view their assessments"
  ON public.assessments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create assessments"
  ON public.assessments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their assessments"
  ON public.assessments FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for assessment_results
CREATE POLICY "Users can view their assessment results"
  ON public.assessment_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.assessments
      WHERE assessments.id = assessment_results.assessment_id
      AND assessments.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create assessment results"
  ON public.assessment_results FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.assessments
      WHERE assessments.id = assessment_results.assessment_id
      AND assessments.user_id = auth.uid()
    )
  );

-- RLS Policies for improvement_plans
CREATE POLICY "Users can view improvement plans"
  ON public.improvement_plans FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create improvement plans"
  ON public.improvement_plans FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update improvement plans"
  ON public.improvement_plans FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', 'Usuario'),
    new.email
  );
  RETURN new;
END;
$$;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert default maturity levels
INSERT INTO public.maturity_levels (level, name, description) VALUES
  (1, 'Inicial', 'Procesos ad-hoc y caóticos. No hay documentación formal.'),
  (2, 'Repetible', 'Procesos básicos establecidos. Se repiten pero no están completamente documentados.'),
  (3, 'Definido', 'Procesos documentados y estandarizados. Se siguen de manera consistente.'),
  (4, 'Gestionado', 'Procesos medidos y controlados. Se monitorean métricas.'),
  (5, 'Optimizado', 'Mejora continua. Procesos optimizados constantemente.');

-- Insert sample domains for ISO27001
INSERT INTO public.domains (name, description, standard) VALUES
  ('Políticas de Seguridad', 'Directrices y políticas de seguridad de la información', 'ISO27001'),
  ('Organización de la Seguridad', 'Estructura organizacional y responsabilidades', 'ISO27001'),
  ('Seguridad de Recursos Humanos', 'Gestión de seguridad del personal', 'ISO27001'),
  ('Gestión de Activos', 'Inventario y clasificación de activos', 'ISO27001'),
  ('Control de Acceso', 'Gestión de accesos y autenticación', 'ISO27001');

-- Insert sample domains for NIST
INSERT INTO public.domains (name, description, standard) VALUES
  ('Identificar', 'Desarrollar comprensión organizacional para gestionar riesgos', 'NIST'),
  ('Proteger', 'Desarrollar e implementar salvaguardas apropiadas', 'NIST'),
  ('Detectar', 'Desarrollar e implementar actividades de detección', 'NIST'),
  ('Responder', 'Desarrollar e implementar actividades de respuesta', 'NIST'),
  ('Recuperar', 'Desarrollar e implementar planes de recuperación', 'NIST');