import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import EvidenceViewer from "@/components/EvidenceViewer";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface Organization {
  id: string;
  name: string;
  logo_url: string | null;
}

interface Assessment {
  id: string;
  standard: string;
  assessment_date: string;
  status: string;
}

interface AssessmentResult {
  id: string;
  control_id: string;
  maturity_level_id: string;
  conformity_status: string;
  improvement_action: string | null;
  comments: string | null;
  proof_image_url: string | null;
  controls: {
    code: string;
    name: string;
  };
  maturity_levels: {
    level: number;
    name: string;
  };
}

export default function ImprovementPlans() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [assessmentResults, setAssessmentResults] = useState<AssessmentResult[]>([]);
  
  const [selectedOrganization, setSelectedOrganization] = useState<string>("");
  const [selectedAssessment, setSelectedAssessment] = useState<string>("");
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchOrganizations();
  }, []);

  useEffect(() => {
    if (selectedOrganization) {
      fetchAssessments();
      setSelectedAssessment("");
      setAssessmentResults([]);
    }
  }, [selectedOrganization]);

  useEffect(() => {
    if (selectedAssessment) {
      fetchAssessmentResults();
    }
  }, [selectedAssessment]);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("organizations")
        .select("id, name, logo_url")
        .order("name");

      if (error) throw error;
      setOrganizations(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAssessments = async () => {
    try {
      const { data, error } = await supabase
        .from("assessments")
        .select("id, standard, assessment_date, status")
        .eq("organization_id", selectedOrganization)
        .order("assessment_date", { ascending: false });

      if (error) throw error;
      setAssessments(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchAssessmentResults = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("assessment_results")
        .select(`
          id,
          control_id,
          maturity_level_id,
          conformity_status,
          improvement_action,
          comments,
          proof_image_url,
          controls(code, name),
          maturity_levels(level, name)
        `)
        .eq("assessment_id", selectedAssessment)
        .order("control_id");

      if (error) throw error;
      setAssessmentResults((data as any) || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveImprovementAction = async (resultId: string, improvementAction: string) => {
    setSavingIds(prev => new Set(prev).add(resultId));
    
    try {
      const { error } = await supabase
        .from("assessment_results")
        .update({ improvement_action: improvementAction })
        .eq("id", resultId);

      if (error) throw error;

      toast({
        title: "Guardado",
        description: "Plan de mejora actualizado correctamente",
      });

      setAssessmentResults(prev => 
        prev.map(r => r.id === resultId ? { ...r, improvement_action: improvementAction } : r)
      );
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSavingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(resultId);
        return newSet;
      });
    }
  };

  if (loading && organizations.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Planes de Mejora</h1>
            <p className="text-muted-foreground">Gestiona los planes de mejora por organización y evaluación</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Editar Planes de Mejora por Organización</CardTitle>
            <CardDescription>
              Selecciona una organización y evaluación para personalizar los planes de mejora de cada control
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Organización</Label>
                <Select value={selectedOrganization} onValueChange={setSelectedOrganization}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una organización" />
                  </SelectTrigger>
                  <SelectContent>
                    {organizations.map((org) => (
                      <SelectItem key={org.id} value={org.id}>
                        <div className="flex items-center gap-2">
                          {org.logo_url && (
                            <Avatar className="w-5 h-5">
                              <AvatarImage src={org.logo_url} alt={org.name} />
                              <AvatarFallback>{org.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                          )}
                          <span>{org.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Evaluación</Label>
                <Select 
                  value={selectedAssessment} 
                  onValueChange={setSelectedAssessment}
                  disabled={!selectedOrganization || assessments.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      !selectedOrganization 
                        ? "Primero selecciona una organización"
                        : assessments.length === 0 
                        ? "No hay evaluaciones realizadas"
                        : "Selecciona una evaluación"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {assessments.map((assessment) => (
                      <SelectItem key={assessment.id} value={assessment.id}>
                        {assessment.standard} - {new Date(assessment.assessment_date).toLocaleDateString()} 
                        <Badge variant="outline" className="ml-2">{assessment.status}</Badge>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedOrganization && assessments.length === 0 && (
              <div className="text-center p-8 text-muted-foreground bg-muted/30 rounded-lg">
                No hay evaluaciones realizadas para esta organización
              </div>
            )}
          </CardContent>
        </Card>

        {selectedAssessment && assessmentResults.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Controles Evaluados</CardTitle>
              <CardDescription>
                Edita el plan de mejora para cada control de esta evaluación
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <>
                  {(() => {
                    const filteredResults = assessmentResults.filter(r => r.maturity_levels.level !== 5);
                    const perfectControlsCount = assessmentResults.length - filteredResults.length;
                    
                    return (
                      <>
                        {perfectControlsCount > 0 && (
                          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-4">
                            <p className="text-sm text-green-800 dark:text-green-200">
                              {perfectControlsCount} control(es) con nivel 5 (Siempre) no requieren plan de mejora
                            </p>
                          </div>
                        )}
                        {filteredResults.length === 0 ? (
                          <div className="text-center p-8 text-muted-foreground bg-muted/30 rounded-lg">
                            ¡Excelente! Todos los controles están en nivel 5 (Siempre). No se requieren planes de mejora.
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {filteredResults.map((result) => (
                              <Card key={result.id} className="p-4">
                                <div className="space-y-3">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <h4 className="font-semibold">
                                        {result.controls.code} - {result.controls.name}
                                      </h4>
                                      <div className="flex gap-2 mt-1">
                                        <Badge variant="outline">
                                          Nivel {result.maturity_levels.level}: {result.maturity_levels.name}
                                        </Badge>
                                        <Badge variant={result.conformity_status === 'conforme' ? 'default' : 'destructive'}>
                                          {result.conformity_status}
                                        </Badge>
                                      </div>
                                    </div>
                                  </div>

                                  {result.comments && (
                                    <div className="text-sm text-muted-foreground bg-muted/30 p-2 rounded">
                                      <strong>Comentarios:</strong> {result.comments}
                                    </div>
                                  )}

                                  {result.proof_image_url && (
                                    <div className="flex items-center gap-2">
                                      <EvidenceViewer 
                                        evidenceUrl={result.proof_image_url}
                                        controlName={`${result.controls.code} - ${result.controls.name}`}
                                      />
                                    </div>
                                  )}

                                  <div className="space-y-2">
                                    <Label>Plan de Mejora</Label>
                                    <Textarea
                                      value={result.improvement_action || ""}
                                      onChange={(e) => {
                                        setAssessmentResults(prev =>
                                          prev.map(r => r.id === result.id ? { ...r, improvement_action: e.target.value } : r)
                                        );
                                      }}
                                      placeholder="Escribe el plan de mejora personalizado para este control..."
                                      rows={4}
                                    />
                                    <Button
                                      size="sm"
                                      onClick={() => handleSaveImprovementAction(result.id, result.improvement_action || "")}
                                      disabled={savingIds.has(result.id)}
                                    >
                                      {savingIds.has(result.id) ? (
                                        <>
                                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                          Guardando...
                                        </>
                                      ) : (
                                        <>
                                          <Save className="h-4 w-4 mr-2" />
                                          Guardar
                                        </>
                                      )}
                                    </Button>
                                  </div>
                                </div>
                              </Card>
                            ))}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
