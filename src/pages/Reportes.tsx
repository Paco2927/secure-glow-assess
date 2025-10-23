import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FileText, Calendar, Trash2, AlertTriangle } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import { toast } from "@/hooks/use-toast";
import { useAdminRole } from "@/hooks/useAdminRole";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Assessment {
  id: string;
  standard: string;
  assessment_date: string;
  assessor_name: string;
  organization_id: string | null;
  status: string;
  average_score?: number;
  organization_name?: string;
  organization_logo_url?: string;
}

interface DomainScore {
  domain: string;
  score: number;
}

const Reportes = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAdminRole();
  const [user, setUser] = useState<any>(null);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [assessmentToDelete, setAssessmentToDelete] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      console.log("🔍 [Reportes] Iniciando verificación de autenticación");
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        console.log("❌ [Reportes] No hay sesión activa, redirigiendo a auth");
        navigate("/auth");
        return;
      }

      console.log("✅ [Reportes] Usuario autenticado:", {
        id: session.user.id,
        email: session.user.email,
        role: session.user.role,
      });
      setUser(session.user);
      loadAssessments(session.user.id);
    };

    checkAuth();
  }, [navigate]);

  const loadAssessments = async (userId: string) => {
    console.log(`📋 [Reportes] Cargando evaluaciones para usuario ID: ${userId}`);

    try {
      // RLS policies handle access control:
      // - Users see all assessments
      // - Organization members see their org's assessments
      // - Admins/moderators see all assessments
      const { data, error } = await supabase
        .from("assessments")
        .select(`*, organizations(name, logo_url)`)
        .order("assessment_date", { ascending: false });

      if (error) {
        console.error("❌ [Reportes] Error de Supabase al cargar evaluaciones:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });
        throw error;
      }

      console.log(`✅ [Reportes] Se retornaron ${data?.length || 0} evaluaciones`);

      // Calculate average score for each assessment
      const assessmentsWithScores = await Promise.all(
        (data || []).map(async (assessment) => {
          console.log(`📊 [Reportes] Calculando puntaje para evaluación ID: ${assessment.id}`);

          const { data: results, error: resultsError } = await supabase
            .from("assessment_results")
            .select(
              `
              maturity_levels(level)
            `,
            )
            .eq("assessment_id", assessment.id);

          if (resultsError) {
            console.error("❌ [Reportes] Error al cargar resultados de evaluación:", {
              assessmentId: assessment.id,
              error: resultsError,
            });
          }

          let averageScore = 0;
          if (results && results.length > 0) {
            // Mapear niveles 1-5 a porcentajes 0-100
            const scoreMap: { [key: number]: number } = {
              1: 0, // Nunca = 0%
              2: 25, // Casi nunca = 25%
              3: 50, // Ocasionalmente = 50%
              4: 75, // Casi siempre = 75%
              5: 100, // Siempre = 100%
            };
            const total = results.reduce((sum: number, r: any) => sum + scoreMap[r.maturity_levels.level], 0);
            averageScore = Math.round(total / results.length);

            console.log(
              `📈 [Reportes] Evaluación ${assessment.id}: ${results.length} resultados, puntaje promedio: ${averageScore}%`,
            );
          } else {
            console.log(`⚠️ [Reportes] Evaluación ${assessment.id}: Sin resultados encontrados`);
          }

          return {
            ...assessment,
            average_score: averageScore,
            organization_name: assessment.organizations?.name || "Sin organización",
            organization_logo_url: assessment.organizations?.logo_url,
          };
        }),
      );

      console.log("🎯 [Reportes] Evaluaciones procesadas:", assessmentsWithScores);
      setAssessments(assessmentsWithScores);
    } catch (error: any) {
      console.error("💥 [Reportes] Error general al cargar evaluaciones:", {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });

      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      console.log("🏁 [Reportes] Carga de evaluaciones completada");
      setLoading(false);
    }
  };

  const viewResults = (assessmentId: string) => {
    console.log(`👁️ [Reportes] Navegando a resultados de evaluación ID: ${assessmentId}`);
    navigate(`/results?id=${assessmentId}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getScoreColor = (score: number) => {
    if (score <= 50) return "#ef4444"; // red
    if (score <= 75) return "#eab308"; // yellow
    return "#22c55e"; // green
  };

  const getScoreLabel = (score: number) => {
    if (score <= 50) return "Crítico";
    if (score <= 75) return "Faltan muchas mejoras";
    return "Bueno";
  };

  const handleDeleteClick = (assessmentId: string, e: React.MouseEvent) => {
    console.log(`🗑️ [Reportes] Usuario intenta eliminar evaluación ID: ${assessmentId}`);
    e.stopPropagation();
    setAssessmentToDelete(assessmentId);
    setDeleteDialogOpen(true);
  };

  const deleteAssessment = async () => {
    if (!assessmentToDelete) {
      console.warn("⚠️ [Reportes] Intento de eliminar evaluación sin ID");
      return;
    }

    console.log(`🔥 [Reportes] Eliminando evaluación ID: ${assessmentToDelete}`);

    try {
      // First delete assessment results
      const { error: resultsError } = await supabase
        .from("assessment_results")
        .delete()
        .eq("assessment_id", assessmentToDelete);

      if (resultsError) {
        console.error("❌ [Reportes] Error al eliminar resultados de evaluación:", {
          assessmentId: assessmentToDelete,
          error: resultsError,
        });
        throw resultsError;
      }

      console.log(`✅ [Reportes] Resultados de evaluación ${assessmentToDelete} eliminados`);

      // Then delete the assessment
      const { error: assessmentError } = await supabase.from("assessments").delete().eq("id", assessmentToDelete);

      if (assessmentError) {
        console.error("❌ [Reportes] Error al eliminar evaluación:", {
          assessmentId: assessmentToDelete,
          error: assessmentError,
        });
        throw assessmentError;
      }

      console.log(`✅ [Reportes] Evaluación ${assessmentToDelete} eliminada exitosamente`);

      toast({
        title: "Evaluación eliminada",
        description: "La evaluación ha sido eliminada exitosamente",
      });

      // Refresh the list
      if (user) {
        console.log("🔄 [Reportes] Recargando lista de evaluaciones después de eliminar");
        loadAssessments(user.id);
      }
    } catch (error: any) {
      console.error("💥 [Reportes] Error general al eliminar evaluación:", {
        assessmentId: assessmentToDelete,
        message: error.message,
        stack: error.stack,
      });

      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setAssessmentToDelete(null);
    }
  };

  if (loading) {
    console.log("⏳ [Reportes] Mostrando estado de carga...");
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando reportes...</p>
        </div>
      </div>
    );
  }

  console.log("🎨 [Reportes] Renderizando componente con", assessments.length, "evaluaciones");

  return (
    <div className="min-h-screen gradient-subtle">
      <header className="bg-card border-b shadow-soft">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 rounded-full gradient-hero flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Reportes de Evaluaciones</h1>
                <p className="text-xs text-muted-foreground">Historial y resultados</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {assessments.length === 0 ? (
            <Card className="p-12 text-center">
              <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-2xl font-semibold mb-2">No hay evaluaciones</h2>
              <p className="text-muted-foreground mb-6">Aún no has completado ninguna evaluación</p>
              <Button onClick={() => navigate("/dashboard")} variant="hero">
                Ir al Dashboard
              </Button>
            </Card>
          ) : (
            <>
              <Card className="mb-8 shadow-medium">
                <CardHeader>
                  <CardTitle>Resumen de Evaluaciones</CardTitle>
                  <CardDescription>Histórico de tus {assessments.length} evaluación(es) completada(s)</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={assessments.map((a, i) => ({
                        name: `${a.standard} #${assessments.length - i}`,
                        score: a.average_score || 0,
                        date: new Date(a.assessment_date).toLocaleDateString("es-ES"),
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="score" name="Puntaje Promedio (%)" radius={[8, 8, 0, 0]}>
                        {assessments.map((a, index) => (
                          <Cell key={`cell-${index}`} fill={getScoreColor(a.average_score || 0)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <h2 className="text-2xl font-bold">Evaluaciones Realizadas</h2>
                {assessments.map((assessment) => (
                  <Card
                    key={assessment.id}
                    className="shadow-medium hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => viewResults(assessment.id)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            Evaluación {assessment.standard}
                          </CardTitle>
                          <CardDescription className="space-y-1 mt-1">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              {formatDate(assessment.assessment_date)}
                            </div>
                            <div className="flex items-center gap-2 font-medium text-foreground">
                              {assessment.organization_logo_url && (
                                <Avatar className="w-5 h-5">
                                  <AvatarImage src={assessment.organization_logo_url} alt={assessment.organization_name} />
                                  <AvatarFallback>{assessment.organization_name?.charAt(0)}</AvatarFallback>
                                </Avatar>
                              )}
                              <span>Organización: {assessment.organization_name}</span>
                            </div>
                          </CardDescription>
                        </div>
                        <div className="text-right">
                          {assessment.status === "pending" ? (
                            <div>
                              <div className="text-2xl font-bold mb-1 text-yellow-600">Pendiente</div>
                              <span className="text-sm font-semibold px-3 py-1 rounded-full bg-yellow-100 text-yellow-600">
                                En Progreso
                              </span>
                            </div>
                          ) : (
                            <div>
                              <div
                                className="text-3xl font-bold mb-1"
                                style={{ color: getScoreColor(assessment.average_score || 0) }}
                              >
                                {assessment.average_score}%
                              </div>
                              <span
                                className="text-sm font-semibold px-3 py-1 rounded-full"
                                style={{
                                  backgroundColor: `${getScoreColor(assessment.average_score || 0)}20`,
                                  color: getScoreColor(assessment.average_score || 0),
                                }}
                              >
                                {getScoreLabel(assessment.average_score || 0)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">Evaluador: {assessment.assessor_name}</p>
                        <div className="flex gap-2">
                          {assessment.organization_id && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/risk-matrix?organization=${assessment.organization_id}`);
                              }}
                            >
                              <AlertTriangle className="w-4 h-4 mr-1" />
                              Riesgos
                            </Button>
                          )}
                          <Button variant="outline" size="sm">
                            Ver Detalles
                          </Button>
                          {isAdmin && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => handleDeleteClick(assessment.id, e)}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar evaluación?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la evaluación y todos sus resultados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={deleteAssessment} className="bg-destructive hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Reportes;
