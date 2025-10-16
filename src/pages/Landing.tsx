import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, FileText, TrendingUp, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Shield className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold">TechSecure AI</span>
        </div>
        <Button onClick={() => navigate("/auth")} size="lg">
          Iniciar Sesión
        </Button>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Evaluación de Ciberseguridad Empresarial
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
          Revisa si tu empresa está al día con los márgenes de ciberseguridad de NIST y ISO 27001.
          Obtén reportes detallados y descubre áreas de mejora.
        </p>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="border-primary/20">
            <CardContent className="pt-6">
              <Shield className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Evaluación Completa</h3>
              <p className="text-muted-foreground">
                Evalúa tu empresa según los estándares más reconocidos de ciberseguridad a nivel mundial.
              </p>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardContent className="pt-6">
              <FileText className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Reportes Guardados</h3>
              <p className="text-muted-foreground">
                Todos tus reportes se guardan automáticamente para seguimiento histórico y comparación.
              </p>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardContent className="pt-6">
              <TrendingUp className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Planes de Mejora</h3>
              <p className="text-muted-foreground">
                Recibe recomendaciones específicas sobre qué áreas necesitan mejoras en tu ciberseguridad.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* ISO 27001 Section */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-4">
              <img src="/src/assets/IsoIcon.png" alt="ISO 27001" className="h-12 w-12" />
              <h2 className="text-3xl font-bold">ISO 27001</h2>
            </div>
            <p className="text-muted-foreground mb-4">
              Estándar internacional para la gestión de la seguridad de la información.
            </p>
            <h3 className="text-xl font-semibold mb-3">Dominios de Control:</h3>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span>Políticas de Seguridad</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span>Organización de la Seguridad</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span>Seguridad de Recursos Humanos</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span>Gestión de Activos</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span>Control de Acceso</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span>Criptografía</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span>Seguridad Física y Ambiental</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span>Seguridad de Operaciones</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span>Seguridad de las Comunicaciones</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span>Gestión de Incidentes</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span>Continuidad del Negocio</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span>Cumplimiento Legal</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* NIST Section */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-4">
              <img src="/src/assets/NistShiel.png" alt="NIST" className="h-12 w-12" />
              <h2 className="text-3xl font-bold">NIST Cybersecurity Framework</h2>
            </div>
            <p className="text-muted-foreground mb-4">
              Marco de ciberseguridad desarrollado por el Instituto Nacional de Estándares y Tecnología de EE.UU.
            </p>
            <h3 className="text-xl font-semibold mb-3">Funciones Principales:</h3>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span><strong>Identificar (ID):</strong> Gestión de activos, entorno empresarial, gobernanza, evaluación de riesgos</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span><strong>Proteger (PR):</strong> Control de acceso, concienciación, seguridad de datos, mantenimiento</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span><strong>Detectar (DE):</strong> Anomalías, monitoreo continuo, procesos de detección</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span><strong>Responder (RS):</strong> Planificación de respuesta, comunicaciones, análisis, mitigación</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span><strong>Recuperar (RC):</strong> Planificación de recuperación, mejoras, comunicaciones</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl font-bold mb-6">¿Listo para evaluar tu ciberseguridad?</h2>
        <Button onClick={() => navigate("/auth")} size="lg" className="text-lg px-8 py-6">
          Comenzar Evaluación
        </Button>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center text-muted-foreground border-t">
        <p>&copy; 2024 TechSecure AI. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
};

export default Landing;
