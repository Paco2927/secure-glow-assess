import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FileText, Calendar, Trash2, AlertTriangle, Edit, LayoutGrid, LayoutList, Shield } from "lucide-react";
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
  assessor_display?: string;
}

interface DomainScore {
  domain: string;
  score: number;
}

const Reportes = () => {
  const navigate = useNavigate();
  const { isAdmin, isAuditor, canManageOrganizations } = useAdminRole();
  const [user, setUser] = useState<any>(null);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [assessmentToDelete, setAssessmentToDelete] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  useEffect(() => {
    const checkAuth = async () => {
      console.log("[Reportes] Iniciando verificación de autenticación");
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        console.log("[Reportes] No hay sesión activa, redirigiendo a auth");
        navigate("/auth");
        return;
      }

      console.log("[Reportes] Usuario autenticado:", {
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
    console.log(`[Reportes] Cargando evaluaciones para usuario ID: ${userId}`);

    try {
      // RLS policies handle access control:
      // - Users see all assessments
      // - Organization members see their org's assessments
      // - Admins/auditors see all assessments
      const { data, error } = await supabase
        .from("assessments")
        .select(`*, organizations(name, logo_url)`)
        .order("assessment_date", { ascending: false });

      if (error) {
        console.error("[Reportes] Error de Supabase al cargar evaluaciones:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });
        throw error;
      }

      console.log(`[Reportes] Se retornaron ${data?.length || 0} evaluaciones`);

      // Calculate average score for each assessment
      const assessmentsWithScores = await Promise.all(
        (data || []).map(async (assessment) => {
          console.log(`[Reportes] Calculando puntaje para evaluación ID: ${assessment.id}`);

          // Get user profile data
          const { data: profileData } = await supabase
            .from("profiles")
            .select("name, email")
            .eq("id", assessment.user_id)
            .single();

          const { data: results, error: resultsError } = await supabase
            .from("assessment_results")
            .select(
              `
              maturity_levels(level)
            `,
            )
            .eq("assessment_id", assessment.id);

          if (resultsError) {
            console.error("[Reportes] Error al cargar resultados de evaluación:", {
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
              `[Reportes] Evaluación ${assessment.id}: ${results.length} resultados, puntaje promedio: ${averageScore}%`,
            );
          } else {
            console.log(`[Reportes] Evaluación ${assessment.id}: Sin resultados encontrados`);
          }

          return {
            ...assessment,
            average_score: averageScore,
            organization_name: assessment.organizations?.name || "Sin organización",
            organization_logo_url: assessment.organizations?.logo_url,
            assessor_display: profileData
              ? `${profileData.name} (${profileData.email})`
              : assessment.assessor_name,
          };
        }),
      );

      console.log("[Reportes] Evaluaciones procesadas:", assessmentsWithScores);
      setAssessments(assessmentsWithScores);
    } catch (error: any) {
      console.error("[Reportes] Error general al cargar evaluaciones:", {
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
      console.log("[Reportes] Carga de evaluaciones completada");
      setLoading(false);
    }
  };

  const viewResults = (assessmentId: string) => {
    console.log(`[Reportes] Navegando a resultados de evaluación ID: ${assessmentId}`);
    navigate(`/results?id=${assessmentId}`);
  };

  const editAssessment = (assessment: Assessment, e: React.MouseEvent) => {
    console.log(`[Reportes] Editando evaluación ID: ${assessment.id}`);
    e.stopPropagation();
    const route = assessment.standard === "ISO27001" ? "/assessment/iso27001" : "/assessment/nist";
    navigate(`${route}?edit=${assessment.id}`);
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
    console.log(`[Reportes] Usuario intenta eliminar evaluación ID: ${assessmentId}`);
    e.stopPropagation();
    setAssessmentToDelete(assessmentId);
    setDeleteDialogOpen(true);
  };

  const deleteAssessment = async () => {
    if (!assessmentToDelete) {
      console.warn("[Reportes] Intento de eliminar evaluación sin ID");
      return;
    }

    console.log(`[Reportes] Eliminando evaluación ID: ${assessmentToDelete}`);

    try {
      // First delete assessment results
      const { error: resultsError } = await supabase
        .from("assessment_results")
        .delete()
        .eq("assessment_id", assessmentToDelete);

      if (resultsError) {
        console.error("[Reportes] Error al eliminar resultados de evaluación:", {
          assessmentId: assessmentToDelete,
          error: resultsError,
        });
        throw resultsError;
      }

      console.log(`[Reportes] Resultados de evaluación ${assessmentToDelete} eliminados`);

      // Then delete the assessment
      const { error: assessmentError } = await supabase.from("assessments").delete().eq("id", assessmentToDelete);

      if (assessmentError) {
        console.error("[Reportes] Error al eliminar evaluación:", {
          assessmentId: assessmentToDelete,
          error: assessmentError,
        });
        throw assessmentError;
      }

      console.log(`[Reportes] Evaluación ${assessmentToDelete} eliminada exitosamente`);

      toast({
        title: "Evaluación eliminada",
        description: "La evaluación ha sido eliminada exitosamente",
      });

      // Refresh the list
      if (user) {
        console.log("[Reportes] Recargando lista de evaluaciones después de eliminar");
        loadAssessments(user.id);
      }
    } catch (error: any) {
      console.error("[Reportes] Error general al eliminar evaluación:", {
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
    console.log("[Reportes] Mostrando estado de carga...");
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando reportes...</p>
        </div>
      </div>
    );
  }

  console.log("[Reportes] Renderizando componente con", assessments.length, "evaluaciones");

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

              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold">Evaluaciones Realizadas</h2>
                  <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                    <Button
                      variant={viewMode === "list" ? "default" : "ghost"}
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => setViewMode("list")}
                    >
                      <LayoutList className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === "grid" ? "default" : "ghost"}
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => setViewMode("grid")}
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" : "space-y-3"}>
                  {assessments.map((assessment) => (
                    viewMode === "grid" ? (
                      /* ── GRID CARD ── */
                      <Card
                        key={assessment.id}
                        className="shadow-medium hover:shadow-lg transition-all cursor-pointer group overflow-hidden"
                        onClick={() => viewResults(assessment.id)}
                      >
                        {/* Top color bar */}
                        <div
                          className="h-1.5"
                          style={{
                            backgroundColor: assessment.status === "pending"
                              ? "#eab308"
                              : getScoreColor(assessment.average_score || 0),
                          }}
                        />
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Shield className="w-4 h-4 text-primary" />
                              <CardTitle className="text-base">{assessment.standard}</CardTitle>
                            </div>
                            {assessment.status === "pending" ? (
                              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                                En Progreso
                              </span>
                            ) : (
                              <span
                                className="text-lg font-bold"
                                style={{ color: getScoreColor(assessment.average_score || 0) }}
                              >
                                {assessment.average_score}%
                              </span>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0 space-y-3">
                          <div className="space-y-1.5 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Calendar className="w-3.5 h-3.5" />
                              <span className="text-xs">{formatDate(assessment.assessment_date)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {assessment.organization_logo_url ? (
                                <Avatar className="w-4 h-4">
                                  <AvatarImage src={assessment.organization_logo_url} alt={assessment.organization_name} />
                                  <AvatarFallback className="text-[8px]">{assessment.organization_name?.charAt(0)}</AvatarFallback>
                                </Avatar>
                              ) : null}
                              <span className="text-xs font-medium truncate">{assessment.organization_name}</span>
                            </div>
                          </div>

                          {assessment.status !== "pending" && (
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${assessment.average_score}%`,
                                  backgroundColor: getScoreColor(assessment.average_score || 0),
                                }}
                              />
                            </div>
                          )}

                          <div className="flex items-center gap-1 pt-1 border-t">
                            {assessment.organization_id && (
                              <Button variant="ghost" size="sm" className="h-7 text-xs px-2" onClick={(e) => { e.stopPropagation(); navigate(`/risk-matrix?organization=${assessment.organization_id}&from=reportes`); }}>
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                Riesgos
                              </Button>
                            )}
                            <div className="flex-1" />
                            {canManageOrganizations && (
                              <>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-primary" onClick={(e) => editAssessment(assessment, e)}>
                                  <Edit className="w-3.5 h-3.5" />
                                </Button>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={(e) => handleDeleteClick(assessment.id, e)}>
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      /* ── LIST ROW ── */
                      <Card
                        key={assessment.id}
                        className="shadow-sm hover:shadow-md transition-all cursor-pointer group border-l-4"
                        style={{
                          borderLeftColor: assessment.status === "pending"
                            ? "#eab308"
                            : getScoreColor(assessment.average_score || 0),
                        }}
                        onClick={() => viewResults(assessment.id)}
                      >
                        <div className="flex items-center gap-4 p-4">
                          {/* Score badge */}
                          <div className="hidden sm:flex w-14 h-14 rounded-xl items-center justify-center shrink-0"
                            style={{
                              backgroundColor: assessment.status === "pending"
                                ? "#fef9c320"
                                : `${getScoreColor(assessment.average_score || 0)}15`,
                            }}
                          >
                            {assessment.status === "pending" ? (
                              <span className="text-xs font-bold text-yellow-600">⏳</span>
                            ) : (
                              <span
                                className="text-lg font-bold"
                                style={{ color: getScoreColor(assessment.average_score || 0) }}
                              >
                                {assessment.average_score}%
                              </span>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="font-semibold text-sm">Evaluación {assessment.standard}</span>
                              {assessment.status === "pending" && (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                                  En Progreso
                                </span>
                              )}
                              {assessment.status !== "pending" && (
                                <span
                                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                                  style={{
                                    backgroundColor: `${getScoreColor(assessment.average_score || 0)}15`,
                                    color: getScoreColor(assessment.average_score || 0),
                                  }}
                                >
                                  {getScoreLabel(assessment.average_score || 0)}
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {formatDate(assessment.assessment_date)}
                              </span>
                              <span className="flex items-center gap-1">
                                {assessment.organization_logo_url && (
                                  <Avatar className="w-4 h-4">
                                    <AvatarImage src={assessment.organization_logo_url} alt={assessment.organization_name} />
                                    <AvatarFallback className="text-[8px]">{assessment.organization_name?.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                )}
                                {assessment.organization_name}
                              </span>
                              <span className="hidden md:inline">
                                Evaluador: {assessment.assessor_display || assessment.assessor_name}
                              </span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 shrink-0">
                            {assessment.organization_id && (
                              <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={(e) => { e.stopPropagation(); navigate(`/risk-matrix?organization=${assessment.organization_id}&from=reportes`); }}>
                                <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                                <span className="hidden lg:inline">Riesgos</span>
                              </Button>
                            )}
                            <Button variant="ghost" size="sm" className="h-8 text-xs">
                              <FileText className="w-3.5 h-3.5 mr-1" />
                              <span className="hidden lg:inline">Detalles</span>
                            </Button>
                            {canManageOrganizations && (
                              <>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-primary" onClick={(e) => editAssessment(assessment, e)}>
                                  <Edit className="w-3.5 h-3.5" />
                                </Button>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" onClick={(e) => handleDeleteClick(assessment.id, e)}>
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </Card>
                    )
                  ))}
                </div>
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
