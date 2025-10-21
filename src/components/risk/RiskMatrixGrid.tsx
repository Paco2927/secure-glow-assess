import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface Risk {
  id: string;
  asset: string;
  risk_description: string;
  currentAssessment?: {
    likelihood: number;
    impact: number;
    risk_level: string;
  };
}

interface RiskMatrixGridProps {
  onEditRisk: (riskId: string) => void;
  assessmentId: string | null;
}

export function RiskMatrixGrid({ onEditRisk, assessmentId }: RiskMatrixGridProps) {
  const [risks, setRisks] = useState<Risk[]>([]);
  const [loading, setLoading] = useState(true);
  const [matrixSize] = useState(5);

  useEffect(() => {
    fetchRisksWithAssessments();
  }, [assessmentId]);

  const fetchRisksWithAssessments = async () => {
    try {
      let query = supabase.from("risks").select("*");
      
      if (assessmentId) {
        query = query.eq("assessment_id", assessmentId);
      }

      const { data: risksData, error: risksError } = await query;

      if (risksError) throw risksError;

      const risksWithAssessments = await Promise.all(
        (risksData || []).map(async (risk) => {
          const { data: assessment } = await supabase
            .from("risk_assessments")
            .select("*")
            .eq("risk_id", risk.id)
            .eq("is_current", true)
            .maybeSingle();

          return {
            ...risk,
            currentAssessment: assessment || undefined,
          };
        })
      );

      setRisks(risksWithAssessments);
    } catch (error) {
      console.error("Error fetching risks:", error);
      toast.error("Error al cargar los riesgos");
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (score: number) => {
    if (score <= 6) return "hsl(var(--success))";
    if (score <= 12) return "hsl(var(--warning))";
    if (score <= 20) return "hsl(var(--destructive))";
    return "hsl(var(--destructive))";
  };

  const getRisksInCell = (likelihood: number, impact: number) => {
    return risks.filter(
      (risk) =>
        risk.currentAssessment?.likelihood === likelihood &&
        risk.currentAssessment?.impact === impact
    );
  };

  if (loading) {
    return <Skeleton className="w-full h-96" />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Matriz de Riesgo Visual</CardTitle>
        <CardDescription>
          Visualización de riesgos según probabilidad e impacto
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="inline-grid gap-1 min-w-full" style={{ gridTemplateColumns: `80px repeat(${matrixSize}, minmax(120px, 1fr))` }}>
            {/* Header row */}
            <div className="font-semibold text-sm p-2"></div>
            {Array.from({ length: matrixSize }, (_, i) => (
              <div key={`impact-${i}`} className="font-semibold text-sm p-2 text-center border bg-muted">
                Impacto {i + 1}
              </div>
            ))}

            {/* Matrix rows */}
            {Array.from({ length: matrixSize }, (_, likelihoodIndex) => {
              const likelihood = matrixSize - likelihoodIndex;
              return (
                <>
                  <div key={`likelihood-${likelihood}`} className="font-semibold text-sm p-2 flex items-center border bg-muted">
                    Prob. {likelihood}
                  </div>
                  {Array.from({ length: matrixSize }, (_, impactIndex) => {
                    const impact = impactIndex + 1;
                    const score = likelihood * impact;
                    const cellRisks = getRisksInCell(likelihood, impact);
                    const color = getRiskColor(score);

                    return (
                      <div
                        key={`cell-${likelihood}-${impact}`}
                        className="border p-2 min-h-[100px] cursor-pointer hover:opacity-80 transition-opacity"
                        style={{ backgroundColor: color + "20" }}
                      >
                        <div className="text-xs font-semibold mb-1" style={{ color }}>
                          Score: {score}
                        </div>
                        <div className="space-y-1">
                          {cellRisks.map((risk) => (
                            <Badge
                              key={risk.id}
                              variant="outline"
                              className="cursor-pointer text-xs block truncate"
                              onClick={() => onEditRisk(risk.id)}
                            >
                              {risk.asset}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-6 flex gap-4 justify-center flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded" style={{ backgroundColor: getRiskColor(5) }} />
              <span className="text-sm">Bajo (1-6)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded" style={{ backgroundColor: getRiskColor(10) }} />
              <span className="text-sm">Medio (7-12)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded" style={{ backgroundColor: getRiskColor(15) }} />
              <span className="text-sm">Alto (13-20)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded" style={{ backgroundColor: getRiskColor(25) }} />
              <span className="text-sm">Extremo (21-25)</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
