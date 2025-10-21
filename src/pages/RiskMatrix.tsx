import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RiskMatrixGrid } from "@/components/risk/RiskMatrixGrid";
import { RiskList } from "@/components/risk/RiskList";
import { RiskForm } from "@/components/risk/RiskForm";
import { MatrixConfig } from "@/components/risk/MatrixConfig";

export default function RiskMatrix() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const assessmentId = searchParams.get("assessment");
  const [showRiskForm, setShowRiskForm] = useState(false);
  const [editingRiskId, setEditingRiskId] = useState<string | null>(null);
  const [assessmentInfo, setAssessmentInfo] = useState<any>(null);

  useEffect(() => {
    if (assessmentId) {
      fetchAssessmentInfo();
    }
  }, [assessmentId]);

  const fetchAssessmentInfo = async () => {
    if (!assessmentId) return;
    
    const { data } = await supabase
      .from("assessments")
      .select("*, organizations(name)")
      .eq("id", assessmentId)
      .single();
    
    if (data) {
      setAssessmentInfo(data);
    }
  };

  const handleEditRisk = (riskId: string) => {
    setEditingRiskId(riskId);
    setShowRiskForm(true);
  };

  const handleCloseForm = () => {
    setShowRiskForm(false);
    setEditingRiskId(null);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Matriz de Riesgos ISO 27001</h1>
              <p className="text-muted-foreground">
                {assessmentInfo 
                  ? `Evaluación: ${assessmentInfo.organizations?.name || 'Sin organización'} - ${assessmentInfo.standard}`
                  : "Gestión integral de riesgos de seguridad de la información"
                }
              </p>
            </div>
          </div>
          <Button onClick={() => setShowRiskForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Riesgo
          </Button>
        </div>

        <Tabs defaultValue="matrix" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="matrix">Matriz Visual</TabsTrigger>
            <TabsTrigger value="list">Lista de Riesgos</TabsTrigger>
            <TabsTrigger value="config">Configuración</TabsTrigger>
          </TabsList>

          <TabsContent value="matrix" className="space-y-4">
            <RiskMatrixGrid onEditRisk={handleEditRisk} assessmentId={assessmentId} />
          </TabsContent>

          <TabsContent value="list" className="space-y-4">
            <RiskList onEditRisk={handleEditRisk} assessmentId={assessmentId} />
          </TabsContent>

          <TabsContent value="config" className="space-y-4">
            <MatrixConfig />
          </TabsContent>
        </Tabs>

        {showRiskForm && (
          <RiskForm
            riskId={editingRiskId}
            onClose={handleCloseForm}
            assessmentId={assessmentId}
            organizationId={assessmentInfo?.organization_id}
          />
        )}
      </div>
    </div>
  );
}
