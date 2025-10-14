import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DomainResult {
  domain_name: string;
  domain_code: string;
  score: number;
  recommendation: string;
  color: 'red' | 'yellow' | 'green';
}

const Results = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const assessmentId = searchParams.get('id');
  const [results, setResults] = useState<DomainResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageScore, setAverageScore] = useState(0);

  useEffect(() => {
    if (!assessmentId) {
      navigate("/");
      return;
    }
    calculateResults();
  }, [assessmentId]);

  const calculateResults = async () => {
    try {
      // Fetch assessment results with related data
      const { data: assessmentData, error } = await supabase
        .from('assessment_results')
        .select(`
          *,
          maturity_levels(level),
          controls(name, code, domains(name, standard))
        `)
        .eq('assessment_id', assessmentId);

      if (error) throw error;

      // Group by domain and calculate scores
      const domainScores: Record<string, { total: number, count: number, name: string, standard: string }> = {};

      assessmentData?.forEach((result: any) => {
        const domainName = result.controls.domains.name;
        const level = result.maturity_levels.level;
        const percentage = ((level - 1) / 4) * 100; // Convert level 1-5 to 0-100%

        if (!domainScores[domainName]) {
          domainScores[domainName] = {
            total: 0,
            count: 0,
            name: domainName,
            standard: result.controls.domains.standard
          };
        }

        domainScores[domainName].total += percentage;
        domainScores[domainName].count += 1;
      });

      // Calculate average scores and get recommendations
      const domainResults: DomainResult[] = Object.values(domainScores).map(domain => {
        const score = domain.count > 0 ? Math.round(domain.total / domain.count) : 0;
        return {
          domain_name: domain.name,
          domain_code: domain.name.split(' - ')[0],
          score,
          recommendation: getRecommendation(domain.name, score),
          color: score <= 50 ? 'red' : score <= 75 ? 'yellow' : 'green'
        };
      });

      // Calculate overall average
      const totalScore = domainResults.reduce((sum, d) => sum + d.score, 0);
      const avg = domainResults.length > 0 ? Math.round(totalScore / domainResults.length) : 0;

      setResults(domainResults);
      setAverageScore(avg);
    } catch (error) {
      console.error("Error calculating results:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los resultados",
        variant: "destructive"
      });
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const getRecommendation = (domainName: string, score: number): string => {
    const recommendations: Record<string, Record<string, string>> = {
      "A5 - Controles Organizacionales": {
        critical: "Su organización carece de una estructura de gobierno de seguridad definida. Se recomienda:\n• Establecer políticas de seguridad formalmente documentadas\n• Definir roles y responsabilidades claros en seguridad\n• Implementar un programa de gestión de riesgos\n• Desarrollar procedimientos operativos estandarizados",
        medium: "Su gobierno de seguridad tiene bases pero necesita fortalecerse:\n• Revisar y actualizar políticas regularmente\n• Mejorar la comunicación de responsabilidades\n• Fortalecer la gestión de proveedores\n• Implementar revisiones independientes de seguridad",
        good: "Excelente estructura de gobierno organizacional. Mantenga:\n• Revisiones continuas de políticas\n• Comunicación constante con stakeholders\n• Actualización periódica de inventarios de activos\n• Monitoreo continuo del cumplimiento"
      },
      "A6 - Controles Orientados a Personas": {
        critical: "El factor humano representa un riesgo significativo:\n• Implementar programa de concienciación obligatorio\n• Establecer acuerdos de confidencialidad\n• Crear proceso disciplinario por incumplimientos\n• Mejorar gestión de terminación de empleados",
        medium: "Se necesita fortalecer la cultura de seguridad:\n• Incrementar frecuencia de capacitaciones\n• Formalizar procesos de onboarding/offboarding\n• Establecer canales claros de reporte de incidentes\n• Mejorar controles para trabajo remoto",
        good: "Buena cultura de seguridad organizacional. Continúe:\n• Capacitaciones periódicas y actualizadas\n• Fomentar reporte proactivo de incidentes\n• Revisar periódicamente acuerdos de confidencialidad\n• Mantener controles de acceso actualizados"
      },
      "A7 - Controles Físicos": {
        critical: "Infraestructura física vulnerable:\n• Implementar controles de acceso físico\n• Establecer perímetros de seguridad definidos\n• Instalar sistemas de vigilancia y monitoreo\n• Mejorar políticas de escritorio limpio",
        medium: "Controles físicos básicos presentes pero mejorables:\n• Fortalecer controles de acceso a áreas sensibles\n• Mejorar sistemas de monitoreo continuo\n• Establecer procedimientos para equipos fuera de sede\n• Implementar destrucción segura de activos",
        good: "Excelentes controles físicos. Recomendado:\n• Mantener revisiones periódicas de controles\n• Actualizar sistemas de monitoreo\n• Verificar regularmente respaldos de energía\n• Realizar auditorías físicas regulares"
      },
      "A8 - Controles Tecnológicos": {
        critical: "Controles tecnológicos insuficientes:\n• Implementar gestión de vulnerabilidades\n• Establecer controles de acceso robustos\n• Configurar dispositivos con estándares de seguridad\n• Implementar sistema de backup y recuperación",
        medium: "Controles tecnológicos presentes pero mejorables:\n• Fortalecer gestión de parches y actualizaciones\n• Mejorar controles de acceso y autenticación\n• Implementar monitoreo continuo de redes\n• Establecer cifrado de datos sensible",
        good: "Controles tecnológicos robustos. Mantenga:\n• Monitoreo proactivo de seguridad\n• Actualizaciones periódicas de sistemas\n• Revisiones continuas de accesos\n• Pruebas regulares de recuperación"
      },
      "GV - Gobernar": {
        critical: "Falta gobierno de seguridad estructurado:\n• Establecer estrategia de seguridad alineada al negocio\n• Definir apetito al riesgo formalmente\n• Crear comité de gobierno de seguridad\n• Integrar seguridad con gestión de riesgos empresarial",
        medium: "Gobierno establecido pero necesita madurar:\n• Mejorar comunicación de riesgos a directivos\n• Fortalecer supervisión de proveedores\n• Integrar seguridad en procesos de negocio\n• Establecer métricas de desempeño de seguridad",
        good: "Excelente gobierno de seguridad. Continúe:\n• Revisión periódica de estrategia de seguridad\n• Comunicación constante con stakeholders\n• Monitoreo continuo de cumplimiento\n• Mejora continua basada en métricas"
      },
      "ID - Identificar": {
        critical: "Capacidades de identificación limitadas:\n• Crear inventario completo de activos\n• Implementar evaluación de riesgos formal\n• Establecer proceso de identificación de vulnerabilidades\n• Integrar inteligencia de amenazas",
        medium: "Identificación básica implementada:\n• Mejorar inventario de activos críticos\n• Fortalecer evaluaciones de riesgo\n• Implementar escaneo continuo de vulnerabilidades\n• Establecer fuentes de inteligencia",
        good: "Excelentes capacidades de identificación. Continúe:\n• Actualización continua de inventarios\n• Evaluaciones de riesgo periódicas\n• Integración de threat intelligence\n• Priorización basada en impacto"
      },
      "PR - Proteger": {
        critical: "Controles de protección insuficientes:\n• Implementar gestión de identidades y accesos\n• Establecer programa de concienciación\n• Proteger datos en reposo y tránsito\n• Asegurar configuraciones de plataformas",
        medium: "Controles de protección básicos presentes:\n• Fortalecer autenticación multifactor\n• Mejorar capacitación especializada\n• Implementar cifrado de datos\n• Establecer hardening de sistemas",
        good: "Buenos controles de protección. Mantenga:\n• Revisiones periódicas de accesos\n• Actualizaciones continuas de capacitación\n• Monitoreo de configuraciones seguras\n• Pruebas regulares de respaldos"
      },
      "DE - Detectar": {
        critical: "Capacidades de detección limitadas:\n• Implementar monitoreo continuo de redes\n• Establecer detección de anomalías\n• Crear proceso de análisis de eventos\n• Integrar inteligencia de amenazas",
        medium: "Detección básica implementada:\n• Mejorar correlación de eventos\n• Fortalecer monitoreo de proveedores\n• Implementar análisis de comportamiento\n• Establecer umbrales de alerta",
        good: "Excelentes capacidades de detección. Continúe:\n• Análisis proactivo continuo\n• Actualización de reglas de detección\n• Integración con fuentes de threat intelligence\n• Mejora continua basada en lecciones aprendidas"
      },
      "RS - Responder": {
        critical: "Preparación de respuesta insuficiente:\n• Desarrollar plan de respuesta a incidentes\n• Establecer equipo de respuesta\n• Crear procedimientos de comunicación\n• Realizar simulacros de incidentes",
        medium: "Capacidades de respuesta básicas:\n• Mejorar procesos de análisis forense\n• Fortalecer comunicación con stakeholders\n• Establecer procedimientos de contención\n• Realizar ejercicios regulares",
        good: "Buena capacidad de respuesta. Mantenga:\n• Actualización periódica de planes\n• Ejercicios de simulación regulares\n• Revisión post-incidente sistemática\n• Mejora continua de procedimientos"
      },
      "RC - Recuperar": {
        critical: "Capacidades de recuperación limitadas:\n• Desarrollar plan de recuperación de desastres\n• Establecer procedimientos de restauración\n• Implementar sistema de backups verificados\n• Crear planes de comunicación de recuperación",
        medium: "Recuperación básica establecida:\n• Mejorar verificación de backups\n• Fortalecer procedimientos de restauración\n• Establecer criterios de recuperación\n• Realizar pruebas de recuperación",
        good: "Excelentes capacidades de recuperación. Continúe:\n• Pruebas regulares de recuperación\n• Actualización continua de planes\n• Verificación periódica de backups\n• Mejora basada en lecciones aprendidas"
      }
    };

    const domainRecs = recommendations[domainName] || recommendations["A5 - Controles Organizacionales"];
    
    if (score <= 50) return domainRecs.critical;
    if (score <= 75) return domainRecs.medium;
    return domainRecs.good;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Calculando resultados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al Dashboard
            </Button>
            <h1 className="text-3xl font-bold">Resultados de la Evaluación</h1>
          </div>
        </div>

        <Card className="p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">Puntaje General</h2>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Progress value={averageScore} className="h-4" />
            </div>
            <div className="text-3xl font-bold">{averageScore}%</div>
          </div>
          <p className="mt-4 text-muted-foreground">
            {averageScore <= 50
              ? "Se requiere atención crítica en múltiples áreas"
              : averageScore <= 75
              ? "Su nivel de seguridad es aceptable pero necesita mejoras"
              : "Excelente nivel de seguridad, mantenga las buenas prácticas"}
          </p>
        </Card>

        <div className="space-y-6">
          {results.map((result) => (
            <Card
              key={result.domain_code}
              className={`p-6 border-l-4 ${
                result.color === 'red'
                  ? 'border-l-red-500'
                  : result.color === 'yellow'
                  ? 'border-l-yellow-500'
                  : 'border-l-green-500'
              }`}
            >
              <div className="mb-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-semibold">{result.domain_name}</h3>
                  <span className={`text-2xl font-bold ${
                    result.color === 'red'
                      ? 'text-red-500'
                      : result.color === 'yellow'
                      ? 'text-yellow-500'
                      : 'text-green-500'
                  }`}>
                    {result.score}%
                  </span>
                </div>
                <Progress value={result.score} className="h-3" />
              </div>

              <div className="mt-4">
                <h4 className={`font-semibold mb-2 flex items-center gap-2 ${
                  result.color === 'red'
                    ? 'text-red-500'
                    : result.color === 'yellow'
                    ? 'text-yellow-500'
                    : 'text-green-500'
                }`}>
                  {result.score <= 50 ? '🔴' : result.score <= 75 ? '🟡' : '🟢'}
                  {result.score <= 50
                    ? 'Mejora Crítica Necesaria (0-50%)'
                    : result.score <= 75
                    ? 'Necesita Mejoras (51-75%)'
                    : 'Buen Desempeño (76-100%)'}
                </h4>
                <div className="whitespace-pre-line text-sm text-muted-foreground bg-muted/30 p-4 rounded-lg">
                  {result.recommendation}
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Button onClick={() => navigate("/")}>
            Volver al Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Results;