-- Step 1: Create role system
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
ON public.user_roles FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
ON public.user_roles FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Step 2: Clear existing assessment data
DELETE FROM public.assessment_results;
DELETE FROM public.assessments;

-- Step 3: Clear controls and domains
DELETE FROM public.controls;
DELETE FROM public.domains;

-- Step 4: Clear and recreate maturity levels
DELETE FROM public.maturity_levels;

-- Temporarily drop the type constraint
ALTER TABLE public.maturity_levels ALTER COLUMN name TYPE TEXT;

-- Insert new maturity levels
INSERT INTO public.maturity_levels (level, name, description) VALUES
(5, 'Siempre', 'El control está completamente integrado en la cultura y los procesos, se aplica de manera sistemática y se mejora continuamente.'),
(4, 'Casi siempre', 'El control está formalizado, es conocido y se aplica de manera consistente en la mayoría de los casos.'),
(3, 'Ocasionalmente', 'El control se aplica de forma inconsistente, a menudo dependiendo de la persona o el proyecto.'),
(2, 'Casi nunca', 'El control se aplica de manera aislada, reactiva y sin un proceso establecido.'),
(1, 'Nunca', 'El control no existe o no se aplica.');

-- Step 5: Insert new ISO 27001 domains
INSERT INTO public.domains (name, description, standard) VALUES
('A5 - Controles Organizacionales', 'Controles relacionados con la estructura organizacional y gobierno de seguridad', 'ISO27001'),
('A6 - Controles Orientados a Personas', 'Controles relacionados con el factor humano en la seguridad', 'ISO27001'),
('A7 - Controles Físicos', 'Controles de seguridad física de instalaciones y equipos', 'ISO27001'),
('A8 - Controles Tecnológicos', 'Controles técnicos y tecnológicos de seguridad', 'ISO27001'),
('GV - Gobernar', 'Estrategia, expectativas y política de gestión de riesgos', 'NIST'),
('ID - Identificar', 'Comprensión de riesgos actuales de seguridad cibernética', 'NIST'),
('PR - Proteger', 'Medidas de protección para gestionar riesgos', 'NIST'),
('DE - Detectar', 'Detección y análisis de posibles ataques', 'NIST'),
('RS - Responder', 'Medidas en relación con incidentes detectados', 'NIST'),
('RC - Recuperar', 'Restauración de activos y operaciones', 'NIST');

-- Step 6: RLS policies for admin management
CREATE POLICY "Admins can insert domains"
ON public.domains FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update domains"
ON public.domains FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete domains"
ON public.domains FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert controls"
ON public.controls FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update controls"
ON public.controls FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete controls"
ON public.controls FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Step 7: Grant first 3 users admin role
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
ORDER BY created_at
LIMIT 3
ON CONFLICT (user_id, role) DO NOTHING;