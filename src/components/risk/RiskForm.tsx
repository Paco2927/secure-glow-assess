import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface RiskFormProps {
  riskId: string | null;
  onClose: () => void;
}

export function RiskForm({ riskId, onClose }: RiskFormProps) {
  const [loading, setLoading] = useState(false);
  const [organizations, setOrganizations] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    organization_id: "",
    asset: "",
    owner: "",
    threat: "",
    vulnerability: "",
    control_reference: "",
    risk_description: "",
  });

  const [assessment, setAssessment] = useState({
    likelihood: 3,
    impact: 3,
    existing_controls: "",
    residual_risk: "",
  });

  const [treatment, setTreatment] = useState<{
    treatment_plan: string;
    responsible_person: string;
    target_date: string;
    status: "open" | "in_progress" | "closed" | "accepted";
    review_date: string;
    notes: string;
  }>({
    treatment_plan: "",
    responsible_person: "",
    target_date: "",
    status: "open",
    review_date: "",
    notes: "",
  });

  useEffect(() => {
    fetchOrganizations();
    if (riskId) {
      fetchRiskData();
    }
  }, [riskId]);

  const fetchOrganizations = async () => {
    const { data } = await supabase.from("organizations").select("*");
    setOrganizations(data || []);
  };

  const fetchRiskData = async () => {
    if (!riskId) return;

    try {
      const { data: risk } = await supabase
        .from("risks")
        .select("*")
        .eq("id", riskId)
        .single();

      if (risk) {
        setFormData(risk);

        const { data: assessmentData } = await supabase
          .from("risk_assessments")
          .select("*")
          .eq("risk_id", riskId)
          .eq("is_current", true)
          .maybeSingle();

        if (assessmentData) {
          setAssessment({
            likelihood: assessmentData.likelihood,
            impact: assessmentData.impact,
            existing_controls: assessmentData.existing_controls || "",
            residual_risk: assessmentData.residual_risk || "",
          });
        }

        const { data: treatmentData } = await supabase
          .from("risk_treatments")
          .select("*")
          .eq("risk_id", riskId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (treatmentData) {
          setTreatment({
            treatment_plan: treatmentData.treatment_plan,
            responsible_person: treatmentData.responsible_person,
            target_date: treatmentData.target_date || "",
            status: treatmentData.status,
            review_date: treatmentData.review_date || "",
            notes: treatmentData.notes || "",
          });
        }
      }
    } catch (error) {
      console.error("Error fetching risk data:", error);
      toast.error("Error al cargar los datos del riesgo");
    }
  };

  const calculateRiskLevel = (likelihood: number, impact: number): "low" | "medium" | "high" | "extreme" => {
    const score = likelihood * impact;
    if (score <= 6) return "low";
    if (score <= 12) return "medium";
    if (score <= 20) return "high";
    return "extreme";
  };

  const handleSubmit = async () => {
    if (!formData.organization_id || !formData.asset || !formData.risk_description) {
      toast.error("Por favor complete los campos obligatorios");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      let savedRiskId = riskId;

      if (riskId) {
        const { error } = await supabase
          .from("risks")
          .update(formData)
          .eq("id", riskId);
        if (error) throw error;
      } else {
        const { data: newRisk, error } = await supabase
          .from("risks")
          .insert({ ...formData, created_by: user.id })
          .select()
          .single();
        if (error) throw error;
        savedRiskId = newRisk.id;
      }

      if (savedRiskId) {
        await supabase
          .from("risk_assessments")
          .update({ is_current: false })
          .eq("risk_id", savedRiskId);

        const riskScore = assessment.likelihood * assessment.impact;
        const { error: assessmentError } = await supabase
          .from("risk_assessments")
          .insert([{
            risk_id: savedRiskId,
            likelihood: assessment.likelihood,
            impact: assessment.impact,
            risk_score: riskScore,
            risk_level: calculateRiskLevel(assessment.likelihood, assessment.impact),
            existing_controls: assessment.existing_controls,
            residual_risk: assessment.residual_risk,
            assessed_by: user.id,
            is_current: true,
          }]);
        if (assessmentError) throw assessmentError;

        if (treatment.treatment_plan) {
          const { error: treatmentError } = await supabase
            .from("risk_treatments")
            .insert({
              risk_id: savedRiskId,
              ...treatment,
              created_by: user.id,
            });
          if (treatmentError) throw treatmentError;
        }

        await supabase.from("risk_audit_log").insert({
          risk_id: savedRiskId,
          changed_by: user.id,
          action: riskId ? "UPDATE" : "CREATE",
          description: riskId ? "Riesgo actualizado" : "Riesgo creado",
        });
      }

      toast.success(riskId ? "Riesgo actualizado exitosamente" : "Riesgo creado exitosamente");
      onClose();
      window.location.reload();
    } catch (error) {
      console.error("Error saving risk:", error);
      toast.error("Error al guardar el riesgo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{riskId ? "Editar Riesgo" : "Nuevo Riesgo"}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="identification" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="identification">Identificación</TabsTrigger>
            <TabsTrigger value="assessment">Evaluación</TabsTrigger>
            <TabsTrigger value="treatment">Tratamiento</TabsTrigger>
          </TabsList>

          <TabsContent value="identification" className="space-y-4">
            <div>
              <Label htmlFor="organization">Organización *</Label>
              <Select
                value={formData.organization_id}
                onValueChange={(value) => setFormData({ ...formData, organization_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione organización" />
                </SelectTrigger>
                <SelectContent>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="asset">Activo *</Label>
              <Input
                id="asset"
                value={formData.asset}
                onChange={(e) => setFormData({ ...formData, asset: e.target.value })}
                placeholder="ej: Base de datos de clientes"
              />
            </div>

            <div>
              <Label htmlFor="owner">Propietario *</Label>
              <Input
                id="owner"
                value={formData.owner}
                onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                placeholder="Persona o rol responsable"
              />
            </div>

            <div>
              <Label htmlFor="threat">Amenaza *</Label>
              <Input
                id="threat"
                value={formData.threat}
                onChange={(e) => setFormData({ ...formData, threat: e.target.value })}
                placeholder="ej: Infección de malware"
              />
            </div>

            <div>
              <Label htmlFor="vulnerability">Vulnerabilidad *</Label>
              <Input
                id="vulnerability"
                value={formData.vulnerability}
                onChange={(e) => setFormData({ ...formData, vulnerability: e.target.value })}
                placeholder="ej: Sistema sin parches"
              />
            </div>

            <div>
              <Label htmlFor="control_reference">Referencia Control Anexo A</Label>
              <Input
                id="control_reference"
                value={formData.control_reference}
                onChange={(e) => setFormData({ ...formData, control_reference: e.target.value })}
                placeholder="ej: A.5.7, A.8.28"
              />
            </div>

            <div>
              <Label htmlFor="risk_description">Descripción del Riesgo *</Label>
              <Textarea
                id="risk_description"
                value={formData.risk_description}
                onChange={(e) => setFormData({ ...formData, risk_description: e.target.value })}
                placeholder="Descripción concisa del riesgo"
                rows={3}
              />
            </div>
          </TabsContent>

          <TabsContent value="assessment" className="space-y-4">
            <div>
              <Label htmlFor="likelihood">Probabilidad (1-5): {assessment.likelihood}</Label>
              <Input
                type="range"
                id="likelihood"
                min="1"
                max="5"
                value={assessment.likelihood}
                onChange={(e) => setAssessment({ ...assessment, likelihood: parseInt(e.target.value) })}
              />
              <p className="text-xs text-muted-foreground mt-1">
                1=Raro, 2=Improbable, 3=Posible, 4=Probable, 5=Casi seguro
              </p>
            </div>

            <div>
              <Label htmlFor="impact">Impacto (1-5): {assessment.impact}</Label>
              <Input
                type="range"
                id="impact"
                min="1"
                max="5"
                value={assessment.impact}
                onChange={(e) => setAssessment({ ...assessment, impact: parseInt(e.target.value) })}
              />
              <p className="text-xs text-muted-foreground mt-1">
                1=Insignificante, 2=Menor, 3=Moderado, 4=Mayor, 5=Crítico
              </p>
            </div>

            <div className="p-4 border rounded-lg bg-muted">
              <p className="font-semibold">Puntuación de Riesgo: {assessment.likelihood * assessment.impact}</p>
              <p className="text-sm text-muted-foreground">
                Nivel: {calculateRiskLevel(assessment.likelihood, assessment.impact).toUpperCase()}
              </p>
            </div>

            <div>
              <Label htmlFor="existing_controls">Controles Existentes</Label>
              <Textarea
                id="existing_controls"
                value={assessment.existing_controls}
                onChange={(e) => setAssessment({ ...assessment, existing_controls: e.target.value })}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="residual_risk">Riesgo Residual</Label>
              <Textarea
                id="residual_risk"
                value={assessment.residual_risk}
                onChange={(e) => setAssessment({ ...assessment, residual_risk: e.target.value })}
                rows={2}
              />
            </div>
          </TabsContent>

          <TabsContent value="treatment" className="space-y-4">
            <div>
              <Label htmlFor="treatment_plan">Plan de Tratamiento</Label>
              <Textarea
                id="treatment_plan"
                value={treatment.treatment_plan}
                onChange={(e) => setTreatment({ ...treatment, treatment_plan: e.target.value })}
                placeholder="Acciones para reducir o aceptar el riesgo"
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="responsible_person">Responsable</Label>
              <Input
                id="responsible_person"
                value={treatment.responsible_person}
                onChange={(e) => setTreatment({ ...treatment, responsible_person: e.target.value })}
                placeholder="Persona responsable de implementar el tratamiento"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="target_date">Fecha Objetivo</Label>
                <Input
                  type="date"
                  id="target_date"
                  value={treatment.target_date}
                  onChange={(e) => setTreatment({ ...treatment, target_date: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="review_date">Fecha de Revisión</Label>
                <Input
                  type="date"
                  id="review_date"
                  value={treatment.review_date}
                  onChange={(e) => setTreatment({ ...treatment, review_date: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="status">Estado</Label>
              <Select
                value={treatment.status}
                onValueChange={(value: any) => setTreatment({ ...treatment, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Abierto</SelectItem>
                  <SelectItem value="in_progress">En Progreso</SelectItem>
                  <SelectItem value="closed">Cerrado</SelectItem>
                  <SelectItem value="accepted">Aceptado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                value={treatment.notes}
                onChange={(e) => setTreatment({ ...treatment, notes: e.target.value })}
                rows={3}
              />
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {riskId ? "Actualizar" : "Crear"} Riesgo
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
