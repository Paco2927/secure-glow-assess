import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  BarChart3,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  FileWarning,
  Target,
  Activity,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";

interface ComplianceMetrics {
  approvedPoliciesPercent: number;
  updatedProceduresPercent: number;
  avgUpdateDays: number;
  nonConformitiesCount: number;
  correctiveActionsClosed: number;
  correctiveActionsTotal: number;
  correctiveActionsPercent: number;
  conformityBreakdown: { name: string; value: number; color: string }[];
}

interface RiskMetrics {
  totalRisks: number;
  evaluatedRisks: number;
  evaluatedPercent: number;
  risksWithTreatment: number;
  treatmentPercent: number;
  criticalOpen: number;
  criticalClosed: number;
  avgTreatmentDays: number;
  riskLevelBreakdown: { name: string; value: number; color: string }[];
}

const KPIDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [compliance, setCompliance] = useState<ComplianceMetrics | null>(null);
  const [risk, setRisk] = useState<RiskMetrics | null>(null);

  useEffect(() => {
    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      await Promise.all([loadComplianceMetrics(), loadRiskMetrics()]);
      setLoading(false);
    };
    init();
  }, [navigate]);

  const loadComplianceMetrics = async () => {
    try {
      // Get all assessments
      const { data: assessments } = await supabase
        .from("assessments")
        .select("id, status, assessment_date");

      const total = assessments?.length || 0;
      const completed = assessments?.filter((a) => a.status === "completed").length || 0;
      const approvedPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

      // Updated in last year
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      const updatedLastYear =
        assessments?.filter((a) => new Date(a.assessment_date) >= oneYearAgo).length || 0;
      const updatedPercent = total > 0 ? Math.round((updatedLastYear / total) * 100) : 0;

      // Average update time (days between assessments per org)
      let avgDays = 0;
      if (assessments && assessments.length > 1) {
        const sorted = [...assessments].sort(
          (a, b) => new Date(a.assessment_date).getTime() - new Date(b.assessment_date).getTime()
        );
        let totalDiff = 0;
        let diffCount = 0;
        for (let i = 1; i < sorted.length; i++) {
          const diff =
            (new Date(sorted[i].assessment_date).getTime() -
              new Date(sorted[i - 1].assessment_date).getTime()) /
            (1000 * 60 * 60 * 24);
          totalDiff += diff;
          diffCount++;
        }
        avgDays = diffCount > 0 ? Math.round(totalDiff / diffCount) : 0;
      }

      // Non-conformities from assessment_results
      const { data: results } = await supabase
        .from("assessment_results")
        .select("conformity_status");

      const nonConformities =
        results?.filter(
          (r) =>
            r.conformity_status === "no_conformidad" ||
            r.conformity_status === "no_conformidad_menor"
        ).length || 0;

      // Conformity breakdown
      const conformeCount = results?.filter((r) => r.conformity_status === "conforme").length || 0;
      const noConfCount = results?.filter((r) => r.conformity_status === "no_conformidad").length || 0;
      const noConfMenorCount = results?.filter((r) => r.conformity_status === "no_conformidad_menor").length || 0;
      const puntoMejoraCount = results?.filter((r) => r.conformity_status === "punto_de_mejora").length || 0;

      // Improvement plans (corrective actions)
      const { data: plans } = await supabase
        .from("improvement_plans")
        .select("status, target_date");

      const plansTotal = plans?.length || 0;
      const plansClosed = plans?.filter((p) => p.status === "Completado").length || 0;
      // Closed on time
      const closedOnTime =
        plans?.filter((p) => {
          if (p.status !== "Completado") return false;
          return true; // If completed, consider on time (we don't have completion_date)
        }).length || 0;
      const closedPercent = plansTotal > 0 ? Math.round((closedOnTime / plansTotal) * 100) : 0;

      setCompliance({
        approvedPoliciesPercent: approvedPercent,
        updatedProceduresPercent: updatedPercent,
        avgUpdateDays: avgDays,
        nonConformitiesCount: nonConformities,
        correctiveActionsClosed: plansClosed,
        correctiveActionsTotal: plansTotal,
        correctiveActionsPercent: closedPercent,
        conformityBreakdown: [
          { name: "Conforme", value: conformeCount, color: "#22c55e" },
          { name: "No Conformidad", value: noConfCount, color: "#ef4444" },
          { name: "NC Menor", value: noConfMenorCount, color: "#f59e0b" },
          { name: "Punto de Mejora", value: puntoMejoraCount, color: "#3b82f6" },
        ],
      });
    } catch (error: any) {
      console.error("Error loading compliance metrics:", error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const loadRiskMetrics = async () => {
    try {
      // Total risks
      const { data: risks } = await supabase.from("risks").select("id, created_at");
      const totalRisks = risks?.length || 0;

      // Risks with assessments (evaluated)
      const { data: riskAssessments } = await supabase
        .from("risk_assessments")
        .select("risk_id, risk_level, is_current, created_at");

      const evaluatedRiskIds = new Set(riskAssessments?.map((ra) => ra.risk_id) || []);
      const evaluatedCount = evaluatedRiskIds.size;
      const evaluatedPercent = totalRisks > 0 ? Math.round((evaluatedCount / totalRisks) * 100) : 0;

      // Risks with treatment plans
      const { data: treatments } = await supabase
        .from("risk_treatments")
        .select("risk_id, status, created_at, updated_at, target_date");

      const risksWithTreatmentIds = new Set(treatments?.map((t) => t.risk_id) || []);
      const treatmentCount = risksWithTreatmentIds.size;
      const treatmentPercent = totalRisks > 0 ? Math.round((treatmentCount / totalRisks) * 100) : 0;

      // Critical risks (high + extreme) open vs closed
      const currentAssessments = riskAssessments?.filter((ra) => ra.is_current) || [];
      const criticalLevels = ["high", "extreme"];
      const criticalAssessments = currentAssessments.filter((ra) =>
        criticalLevels.includes(ra.risk_level)
      );

      const criticalRiskIds = new Set(criticalAssessments.map((ra) => ra.risk_id));
      const closedTreatmentRiskIds = new Set(
        treatments?.filter((t) => t.status === "closed").map((t) => t.risk_id) || []
      );

      let criticalOpen = 0;
      let criticalClosed = 0;
      criticalRiskIds.forEach((id) => {
        if (closedTreatmentRiskIds.has(id)) {
          criticalClosed++;
        } else {
          criticalOpen++;
        }
      });

      // Average treatment time in days
      let avgTreatmentDays = 0;
      const closedTreatments = treatments?.filter((t) => t.status === "closed") || [];
      if (closedTreatments.length > 0) {
        const totalDays = closedTreatments.reduce((sum, t) => {
          const created = new Date(t.created_at!).getTime();
          const updated = new Date(t.updated_at!).getTime();
          return sum + (updated - created) / (1000 * 60 * 60 * 24);
        }, 0);
        avgTreatmentDays = Math.round(totalDays / closedTreatments.length);
      }

      // Risk level breakdown from current assessments
      const lowCount = currentAssessments.filter((ra) => ra.risk_level === "low").length;
      const medCount = currentAssessments.filter((ra) => ra.risk_level === "medium").length;
      const highCount = currentAssessments.filter((ra) => ra.risk_level === "high").length;
      const extremeCount = currentAssessments.filter((ra) => ra.risk_level === "extreme").length;

      setRisk({
        totalRisks,
        evaluatedRisks: evaluatedCount,
        evaluatedPercent,
        risksWithTreatment: treatmentCount,
        treatmentPercent,
        criticalOpen,
        criticalClosed,
        avgTreatmentDays,
        riskLevelBreakdown: [
          { name: "Bajo", value: lowCount, color: "#22c55e" },
          { name: "Medio", value: medCount, color: "#eab308" },
          { name: "Alto", value: highCount, color: "#f97316" },
          { name: "Extremo", value: extremeCount, color: "#ef4444" },
        ],
      });
    } catch (error: any) {
      console.error("Error loading risk metrics:", error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Cargando indicadores...</p>
        </div>
      </div>
    );
  }

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
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Indicadores de Gestión (KPIs)</h1>
                <p className="text-xs text-muted-foreground">
                  Cumplimiento, control documental y gestión de riesgos
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 space-y-10 max-w-7xl">
        {/* ──────── SECTION 1: Cumplimiento y Control Documental ──────── */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <ShieldCheck className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold">Cumplimiento y Control Documental</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {/* KPI Card */}
            <KPICard
              icon={<CheckCircle2 className="w-5 h-5 text-green-500" />}
              title="Políticas aprobadas y vigentes"
              value={`${compliance?.approvedPoliciesPercent ?? 0}%`}
              subtitle={`Evaluaciones completadas del total`}
              progress={compliance?.approvedPoliciesPercent ?? 0}
              progressColor="bg-green-500"
            />
            <KPICard
              icon={<TrendingUp className="w-5 h-5 text-blue-500" />}
              title="Procedimientos actualizados (último año)"
              value={`${compliance?.updatedProceduresPercent ?? 0}%`}
              subtitle="Evaluaciones realizadas en los últimos 12 meses"
              progress={compliance?.updatedProceduresPercent ?? 0}
              progressColor="bg-blue-500"
            />
            <KPICard
              icon={<Clock className="w-5 h-5 text-amber-500" />}
              title="Tiempo promedio de actualización"
              value={`${compliance?.avgUpdateDays ?? 0} días`}
              subtitle="Promedio entre evaluaciones"
            />
            <KPICard
              icon={<XCircle className="w-5 h-5 text-red-500" />}
              title="No conformidades detectadas"
              value={`${compliance?.nonConformitiesCount ?? 0}`}
              subtitle="No conformidades + No conformidades menores"
            />
            <KPICard
              icon={<Target className="w-5 h-5 text-emerald-500" />}
              title="Acciones correctivas cerradas"
              value={`${compliance?.correctiveActionsClosed ?? 0} / ${compliance?.correctiveActionsTotal ?? 0}`}
              subtitle={`${compliance?.correctiveActionsPercent ?? 0}% completadas`}
              progress={compliance?.correctiveActionsPercent ?? 0}
              progressColor="bg-emerald-500"
            />
          </div>

          {/* Conformity breakdown chart */}
          {compliance && compliance.conformityBreakdown.some((c) => c.value > 0) && (
            <Card className="shadow-medium">
              <CardHeader>
                <CardTitle className="text-base">Distribución de Conformidad</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={compliance.conformityBreakdown.filter((c) => c.value > 0)}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        dataKey="value"
                        label={({ name, percent }) =>
                          `${name} ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {compliance.conformityBreakdown
                          .filter((c) => c.value > 0)
                          .map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </section>

        {/* ──────── SECTION 2: Gestión de Riesgos ──────── */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <AlertTriangle className="w-6 h-6 text-amber-500" />
            <h2 className="text-2xl font-bold">Gestión de Riesgos</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <KPICard
              icon={<Activity className="w-5 h-5 text-primary" />}
              title="Total de riesgos identificados"
              value={`${risk?.totalRisks ?? 0}`}
              subtitle="Riesgos registrados en el sistema"
            />
            <KPICard
              icon={<CheckCircle2 className="w-5 h-5 text-blue-500" />}
              title="Riesgos evaluados vs identificados"
              value={`${risk?.evaluatedRisks ?? 0} / ${risk?.totalRisks ?? 0}`}
              subtitle={`${risk?.evaluatedPercent ?? 0}% evaluados`}
              progress={risk?.evaluatedPercent ?? 0}
              progressColor="bg-blue-500"
            />
            <KPICard
              icon={<ShieldCheck className="w-5 h-5 text-emerald-500" />}
              title="Riesgos con plan de tratamiento"
              value={`${risk?.risksWithTreatment ?? 0} / ${risk?.totalRisks ?? 0}`}
              subtitle={`${risk?.treatmentPercent ?? 0}% con tratamiento definido`}
              progress={risk?.treatmentPercent ?? 0}
              progressColor="bg-emerald-500"
            />
            <KPICard
              icon={<FileWarning className="w-5 h-5 text-red-500" />}
              title="Riesgos críticos abiertos vs cerrados"
              value={
                <span>
                  <span className="text-red-500">{risk?.criticalOpen ?? 0} abiertos</span>
                  {" / "}
                  <span className="text-green-500">{risk?.criticalClosed ?? 0} cerrados</span>
                </span>
              }
              subtitle="Riesgos con nivel alto o extremo"
            />
            <KPICard
              icon={<Clock className="w-5 h-5 text-amber-500" />}
              title="Tiempo promedio de tratamiento"
              value={`${risk?.avgTreatmentDays ?? 0} días`}
              subtitle="Desde creación hasta cierre del tratamiento"
            />
          </div>

          {/* Risk level breakdown chart */}
          {risk && risk.riskLevelBreakdown.some((r) => r.value > 0) && (
            <Card className="shadow-medium">
              <CardHeader>
                <CardTitle className="text-base">Distribución por Nivel de Riesgo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={risk.riskLevelBreakdown.filter((r) => r.value > 0)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="value" name="Cantidad" radius={[8, 8, 0, 0]}>
                        {risk.riskLevelBreakdown
                          .filter((r) => r.value > 0)
                          .map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </section>
      </div>
    </div>
  );
};

/* ──────── Reusable KPI Card ──────── */
interface KPICardProps {
  icon: React.ReactNode;
  title: string;
  value: React.ReactNode;
  subtitle: string;
  progress?: number;
  progressColor?: string;
}

const KPICard = ({ icon, title, value, subtitle, progress, progressColor }: KPICardProps) => (
  <Card className="shadow-medium hover:shadow-lg transition-shadow">
    <CardContent className="pt-6">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-muted">{icon}</div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground font-medium truncate">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          {progress !== undefined && (
            <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${progressColor || "bg-primary"}`}
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          )}
        </div>
      </div>
    </CardContent>
  </Card>
);

export default KPIDashboard;
