import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, FileCheck, Award, TrendingUp, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useThemeSettings } from "@/hooks/useThemeSettings";
import orionAuditLogo from "@/assets/orionaudit-logo.png";
import NistIcon from "@/assets/NistShiel.png";
import IsoIcon from "@/assets/IsoIcon.png";
const Landing = () => {
  const navigate = useNavigate();
  const { logoUrl, companyName } = useThemeSettings();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);
  const handleStartAssessment = () => {
    if (isAuthenticated) {
      navigate("/dashboard");
    } else {
      navigate("/auth");
    }
  };
  const isoCategories = [
    "Políticas de Seguridad",
    "Organización de la Seguridad",
    "Gestión de Activos",
    "Control de Acceso",
    "Criptografía",
    "Seguridad Física",
    "Seguridad Operacional",
    "Seguridad en las Comunicaciones",
    "Adquisición y Desarrollo",
    "Relaciones con Proveedores",
    "Gestión de Incidentes",
    "Continuidad del Negocio",
    "Cumplimiento Legal",
  ];
  const nistCategories = [
    "Identificar (Identify)",
    "Proteger (Protect)",
    "Detectar (Detect)",
    "Responder (Respond)",
    "Recuperar (Recover)",
  ];
  const benefits = [
    {
      icon: Shield,
      title: "Evaluación Integral",
      description: "Analiza tu organización según estándares internacionales reconocidos",
    },
    {
      icon: FileCheck,
      title: "Reportes Detallados",
      description: "Genera informes completos que se guardan automáticamente para seguimiento",
    },
    {
      icon: TrendingUp,
      title: "Planes de Mejora",
      description: "Recibe recomendaciones específicas para fortalecer tu ciberseguridad",
    },
    {
      icon: Award,
      title: "Cumplimiento Normativo",
      description: "Asegura que tu empresa cumpla con ISO 27001 y NIST CSF",
    },
  ];
  return (
    <div className="min-h-screen gradient-subtle">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm border-b shadow-soft sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
              <img
                src={logoUrl || orionAuditLogo}
                alt={companyName || "OrionAudit"}
                className="w-10 h-10 object-contain"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold">{companyName}</h1>
              <p className="text-xs text-muted-foreground">Cybersecurity Assessment Platform</p>
            </div>
          </div>
          <Button onClick={() => navigate("/auth")} className="shadow-soft">
            Iniciar Sesión
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary rounded-full blur-3xl" />
        </div>

        <div className="relative container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
              <Shield className="w-4 h-4" />
              <span className="text-sm font-medium">Plataforma de Evaluación de Ciberseguridad</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Evalúa y Fortalece la <span className="text-primary">Ciberseguridad</span> de tu Empresa
            </h1>

            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Descubre si tu organización cumple con los estándares internacionales de ciberseguridad
              <strong> ISO 27001</strong> y <strong>NIST Cybersecurity Framework</strong>
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={handleStartAssessment} className="shadow-medium text-lg px-8 py-6">
                Comenzar Evaluación
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/contact")} className="text-lg px-8 py-6">
                Contáctanos
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-card/50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              ¿Por qué usar <span className="text-primary">{companyName}</span>?
            </h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {benefits.map((benefit, index) => (
                <Card key={index} className="shadow-soft hover:shadow-medium transition-shadow">
                  <CardContent className="pt-6">
                    <div className="w-12 h-12 rounded-full gradient-hero flex items-center justify-center mb-4">
                      <benefit.icon className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{benefit.title}</h3>
                    <p className="text-muted-foreground text-sm">{benefit.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Standards Section */}
      <section id="standards" className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Estándares que Evaluamos</h2>
            <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
              Nuestras evaluaciones están basadas en dos de los marcos de ciberseguridad más reconocidos mundialmente
            </p>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* ISO 27001 Card */}
              <Card className="shadow-medium hover:shadow-strong transition-shadow">
                <CardContent className="pt-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-full gradient-hero flex items-center justify-center">
                      <img src={IsoIcon} alt="ISO 27001" className="w-14 h-14" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">ISO 27001</h3>
                      <p className="text-muted-foreground">Gestión de Seguridad de la Información</p>
                    </div>
                  </div>

                  <p className="text-muted-foreground mb-4">
                    ISO 27001 es el estándar internacional para sistemas de gestión de seguridad de la información
                    (SGSI). Evaluamos las siguientes categorías:
                  </p>

                  <div className="space-y-2">
                    {isoCategories.map((category, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{category}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* NIST CSF Card */}
              <Card className="shadow-medium hover:shadow-strong transition-shadow">
                <CardContent className="pt-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center">
                      <img src={NistIcon} alt="NIST CSF" className="w-14 h-14" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">NIST CSF</h3>
                      <p className="text-muted-foreground">Cybersecurity Framework</p>
                    </div>
                  </div>

                  <p className="text-muted-foreground mb-4">
                    El NIST Cybersecurity Framework proporciona un enfoque flexible para gestionar riesgos de
                    ciberseguridad. Evaluamos las cinco funciones principales:
                  </p>

                  <div className="space-y-3">
                    {nistCategories.map((category, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <CheckCircle2 className="w-5 h-5 text-secondary mt-0.5 flex-shrink-0" />
                        <span className="text-sm font-medium">{category}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 p-4 bg-secondary/10 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      Cada función contiene múltiples categorías que evaluamos en detalle para proporcionarte un
                      panorama completo de tu madurez en ciberseguridad.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Reports Section */}
      <section className="py-16 bg-card/50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <FileCheck className="w-16 h-16 text-primary mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Reportes que Impulsan la Mejora</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Al completar una evaluación, obtendrás un <strong>reporte detallado</strong> que se guarda automáticamente
              en tu cuenta. Este reporte incluye:
            </p>

            <div className="grid md:grid-cols-3 gap-6 text-left">
              <Card className="shadow-soft">
                <CardContent className="pt-6">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <span className="text-2xl font-bold text-primary">1</span>
                  </div>
                  <h4 className="font-semibold mb-2">Puntuación por Categoría</h4>
                  <p className="text-sm text-muted-foreground">
                    Visualiza tu nivel de madurez en cada dominio evaluado
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-soft">
                <CardContent className="pt-6">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <span className="text-2xl font-bold text-primary">2</span>
                  </div>
                  <h4 className="font-semibold mb-2">Áreas de Mejora</h4>
                  <p className="text-sm text-muted-foreground">
                    Identifica los puntos débiles donde debes enfocar tus esfuerzos
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-soft">
                <CardContent className="pt-6">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <span className="text-2xl font-bold text-primary">3</span>
                  </div>
                  <h4 className="font-semibold mb-2">Planes de Acción</h4>
                  <p className="text-sm text-muted-foreground">
                    Recibe recomendaciones específicas para mejorar tu ciberseguridad
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-10" />
        <div className="relative container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">¿Listo para Evaluar tu Ciberseguridad?</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Comienza hoy mismo a fortalecer la seguridad de tu organización con evaluaciones basadas en estándares
            internacionales
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p className="text-sm">© 2025 {companyName}. Plataforma profesional de evaluación de ciberseguridad.</p>
        </div>
      </footer>
    </div>
  );
};
export default Landing;
