import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, ArrowLeft, Save, FileText } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { OrganizationSelector } from "@/components/OrganizationSelector";
import EvidenceViewer from "@/components/EvidenceViewer";
import NistIcon from "@/assets/NistShiel.png";
interface Control {
  id: string;
  name: string;
  description: string;
  code: string;
  domain_id: string;
  domains: {
    name: string;
  };
}

interface ControlData {
  conformityStatus: "conforme" | "no_conformidad" | "no_conformidad_menor" | "punto_de_mejora";
  comments: string;
  proofImage: File | null;
  existingProofUrl?: string;
}

interface MaturityLevel {
  id: string;
  level: number;
  name: string;
  description: string;
}

const AssessmentNIST = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editAssessmentId = searchParams.get("edit");
  const [user, setUser] = useState<any>(null);
  const [controls, setControls] = useState<Control[]>([]);
  const [maturityLevels, setMaturityLevels] = useState<MaturityLevel[]>([]);
  const [selectedLevels, setSelectedLevels] = useState<Record<string, string>>({});
  const [controlData, setControlData] = useState<Record<string, ControlData>>({});
  const [selectedOrganization, setSelectedOrganization] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentAssessmentId, setCurrentAssessmentId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Check if all controls have been answered and organization selected
  const allControlsAnswered =
    controls.length > 0 &&
    controls.every((control) => selectedLevels[control.id] && controlData[control.id]?.conformityStatus) &&
    selectedOrganization;

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
    };

    const loadData = async () => {
      // Load NIST controls with their domains
      const { data: controlsData } = await supabase
        .from("controls")
        .select(
          `
          *,
          domains!inner (
            name,
            standard
          )
        `,
        )
        .eq("domains.standard", "NIST")
        .order("code");

      if (controlsData) setControls(controlsData);

      // Load maturity levels
      const { data: levelsData } = await supabase.from("maturity_levels").select("*").order("level");

      if (levelsData) setMaturityLevels(levelsData);
    };

    checkAuth();
    loadData();
  }, [navigate]);

  // Load assessment when organization changes or edit mode
  useEffect(() => {
    const loadAssessment = async () => {
      if (!user) return;

      // If editing specific assessment
      if (editAssessmentId) {
        const { data: assessment, error } = await supabase
          .from("assessments")
          .select("id, organization_id")
          .eq("id", editAssessmentId)
          .eq("standard", "NIST")
          .single();

        if (error || !assessment) {
          toast({
            title: "Error",
            description: "No se pudo cargar la evaluación",
            variant: "destructive",
          });
          return;
        }

        setIsEditMode(true);
        setSelectedOrganization(assessment.organization_id);
        setCurrentAssessmentId(assessment.id);

        // Load existing results
        const { data: results } = await supabase
          .from("assessment_results")
          .select("control_id, maturity_level_id, conformity_status, comments, proof_image_url")
          .eq("assessment_id", assessment.id);

        if (results) {
          const newSelectedLevels: Record<string, string> = {};
          const newControlData: Record<string, ControlData> = {};
          
          results.forEach((result) => {
            newSelectedLevels[result.control_id] = result.maturity_level_id;
            newControlData[result.control_id] = {
              conformityStatus: result.conformity_status,
              comments: result.comments || "",
              proofImage: null,
              existingProofUrl: result.proof_image_url || undefined,
            };
          });
          
          setSelectedLevels(newSelectedLevels);
          setControlData(newControlData);
        }

        toast({
          title: "Modo edición",
          description: "Editando evaluación existente. Los cambios se guardarán automáticamente.",
        });
        return;
      }

      // Otherwise load pending assessment for selected organization
      if (!selectedOrganization) return;

      const { data: pendingAssessment } = await supabase
        .from("assessments")
        .select("id")
        .eq("organization_id", selectedOrganization)
        .eq("user_id", user.id)
        .eq("standard", "NIST")
        .eq("status", "pending")
        .maybeSingle();

      if (pendingAssessment) {
        setCurrentAssessmentId(pendingAssessment.id);

        // Load existing results
        const { data: results } = await supabase
          .from("assessment_results")
          .select("control_id, maturity_level_id, conformity_status, comments, proof_image_url")
          .eq("assessment_id", pendingAssessment.id);

        if (results) {
          const newSelectedLevels: Record<string, string> = {};
          const newControlData: Record<string, ControlData> = {};

          results.forEach((result) => {
            newSelectedLevels[result.control_id] = result.maturity_level_id;
            newControlData[result.control_id] = {
              conformityStatus: result.conformity_status,
              comments: result.comments || "",
              proofImage: null,
              existingProofUrl: result.proof_image_url || undefined,
            };
          });

          setSelectedLevels(newSelectedLevels);
          setControlData(newControlData);
        }

        toast({
          title: "Evaluación pendiente encontrada",
          description: "Se ha cargado tu evaluación anterior para continuar.",
        });
      } else {
        setCurrentAssessmentId(null);
        setSelectedLevels({});
        setControlData({});
      }
    };

    loadAssessment();
  }, [selectedOrganization, user, editAssessmentId]);

  // Auto-save progress when answering questions
  const saveProgress = async (controlId: string, levelId: string, data: ControlData, uploadFile?: File) => {
    if (!selectedOrganization || !user) return;

    try {
      let assessmentId = currentAssessmentId;

      // Create assessment if it doesn't exist
      if (!assessmentId) {
        const { data: newAssessment, error: assessmentError } = await supabase
          .from("assessments")
          .insert({
            user_id: user.id,
            standard: "NIST",
            assessor_name: user.email,
            comments: "Evaluación NIST CSF en progreso",
            organization_id: selectedOrganization,
            status: "pending",
          })
          .select()
          .single();

        if (assessmentError) {
          console.error("Error creating assessment:", assessmentError);
          toast({
            title: "Error al crear evaluación",
            description: "No se pudo crear la evaluación. Por favor, intenta nuevamente.",
            variant: "destructive",
          });
          throw assessmentError;
        }
        assessmentId = newAssessment.id;
        setCurrentAssessmentId(assessmentId);

        // Notify user that assessment was created
        toast({
          title: "Evaluación iniciada",
          description: "Tu progreso se guardará automáticamente",
        });
      }

      // Upload file if provided
      let proofImageUrl: string | null = null;
      if (uploadFile) {
        const file = uploadFile;
        const fileExt = file.name.split(".").pop();
        const fileName = `${assessmentId}/${controlId}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("evidencias")
          .upload(fileName, file, { upsert: true });

        if (!uploadError) {
          const { data, error: signedUrlError } = await supabase.storage
            .from("evidencias")
            .createSignedUrl(fileName, 3600); // 1 hour expiry
          
          if (!signedUrlError && data) {
            proofImageUrl = data.signedUrl;
          }
          
          toast({
            title: "Evidencia guardada",
            description: "La evidencia se ha guardado automáticamente",
          });
        }
      }

      // Upsert the result
      const resultData: any = {
        assessment_id: assessmentId,
        control_id: controlId,
        maturity_level_id: levelId,
        conformity_status: data.conformityStatus,
        comments: data.comments || null,
        evidence: "",
      };

      if (proofImageUrl) {
        resultData.proof_image_url = proofImageUrl;
      }

      const { error: upsertError } = await supabase.from("assessment_results").upsert(
        resultData,
        {
          onConflict: "assessment_id,control_id",
        },
      );

      if (upsertError) {
        console.error("Error saving control result:", upsertError);
        toast({
          title: "Error al guardar respuesta",
          description: "No se pudo guardar la respuesta. Verifica tus permisos.",
          variant: "destructive",
        });
        throw upsertError;
      }
    } catch (error) {
      console.error("Error saving progress:", error);
    }
  };

  const handleSubmit = async () => {
    if (!selectedOrganization) {
      toast({
        title: "Selecciona una organización",
        description: "Debes seleccionar una organización antes de continuar.",
        variant: "destructive",
      });
      return;
    }

    if (!allControlsAnswered) {
      toast({
        title: "Completa todos los campos",
        description: "Debes evaluar todos los controles antes de finalizar.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const assessmentId = currentAssessmentId;

      // Upload images for all controls
      await Promise.all(
        Object.entries(controlData).map(async ([controlId, data]) => {
          if (data.proofImage) {
            const file = data.proofImage;
            const fileExt = file.name.split(".").pop();
            const fileName = `${assessmentId}/${controlId}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
              .from("evidencias")
              .upload(fileName, file, { upsert: true });

            if (!uploadError) {
              const { data, error: signedUrlError } = await supabase.storage
                .from("evidencias")
                .createSignedUrl(fileName, 3600); // 1 hour expiry
              
              const publicUrl = !signedUrlError && data ? data.signedUrl : null;

              // Update the result with the proof image URL
              await supabase
                .from("assessment_results")
                .update({ proof_image_url: publicUrl })
                .eq("assessment_id", assessmentId)
                .eq("control_id", controlId);
            }
          }
        }),
      );

      // Update assessment status to completed
      await supabase.from("assessments").update({ status: "completed" }).eq("id", assessmentId);

      toast({
        title: "¡Evaluación guardada!",
        description: "Tu evaluación NIST CSF se ha guardado exitosamente.",
      });

      setCurrentAssessmentId(null);
      navigate("/reportes");
    } catch (error: any) {
      toast({
        title: "Error al guardar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen gradient-subtle">
      {/* Header */}
      <header className="bg-card border-b shadow-soft sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center">
                <img src={NistIcon} alt="NIST CSF" className="w-12 h-12 object-contain" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Evaluación NIST CSF</h1>
                <p className="text-xs text-muted-foreground">Cybersecurity Framework</p>
              </div>
            </div>
            <Button onClick={handleSubmit} disabled={isSubmitting || !allControlsAnswered} variant="secondary">
              <Save className="w-4 h-4 mr-2" />
              {isSubmitting ? "Guardando..." : "Finalizar Evaluación"}
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card className="mb-6 shadow-medium">
            <CardHeader>
              <CardTitle>Selecciona la Organización</CardTitle>
              <CardDescription>
                Debes seleccionar la organización a la cual se le realizará la evaluación
              </CardDescription>
            </CardHeader>
            <CardContent>
              <OrganizationSelector value={selectedOrganization} onChange={setSelectedOrganization} />
            </CardContent>
          </Card>

          <Card className="mb-6 shadow-medium">
            <CardHeader>
              <CardTitle>Instrucciones</CardTitle>
              <CardDescription>
                Evalúa cada control según la frecuencia de aplicación en tu organización
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                {maturityLevels.map((level) => (
                  <div key={level.id} className="flex gap-2">
                    <span className="font-semibold text-secondary">{level.name}:</span>
                    <span className="text-muted-foreground">{level.description}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            {controls.map((control) => (
              <Card key={control.id} className="shadow-medium">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-lg">
                        {control.code} - {control.name}
                      </CardTitle>
                      <CardDescription className="mt-1">{control.description}</CardDescription>
                    </div>
                    <span className="text-xs bg-secondary/10 text-secondary px-2 py-1 rounded-md whitespace-nowrap">
                      {control.domains.name}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="mb-3 block">Frecuencia de Aplicación</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                      {maturityLevels.map((level) => (
                        <Button
                          key={level.id}
                          variant={selectedLevels[control.id] === level.id ? "secondary" : "outline"}
                          className="w-full text-xs sm:text-sm"
                          onClick={() => {
                            const newLevels = { ...selectedLevels, [control.id]: level.id };
                            setSelectedLevels(newLevels);
                            // Save immediately with existing data or defaults
                            const dataToSave = controlData[control.id] || {
                              conformityStatus: "conforme",
                              comments: "",
                              proofImage: null,
                            };
                            saveProgress(control.id, level.id, dataToSave);
                          }}
                        >
                          {level.name}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="mb-3 block">Estado de Conformidad *</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {[
                        { value: "conforme", label: "Conforme" },
                        { value: "no_conformidad", label: "No Conformidad" },
                        { value: "no_conformidad_menor", label: "No Conformidad Menor" },
                        { value: "punto_de_mejora", label: "Punto de Mejora" },
                      ].map((status) => (
                        <Button
                          key={status.value}
                          variant={controlData[control.id]?.conformityStatus === status.value ? "secondary" : "outline"}
                          className="w-full text-xs sm:text-sm"
                          onClick={() => {
                            const newData = {
                              ...controlData[control.id],
                              conformityStatus: status.value as
                                | "conforme"
                                | "no_conformidad"
                                | "no_conformidad_menor"
                                | "punto_de_mejora",
                              comments: controlData[control.id]?.comments || "",
                              proofImage: controlData[control.id]?.proofImage || null,
                            };
                            setControlData({
                              ...controlData,
                              [control.id]: newData,
                            });
                            // Save immediately with selected level or first maturity level
                            const levelId = selectedLevels[control.id] || maturityLevels[0]?.id;
                            if (levelId) {
                              saveProgress(control.id, levelId, newData);
                            }
                          }}
                        >
                          {status.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor={`comments-${control.id}`}>Comentarios (Opcional)</Label>
                    <Textarea
                      id={`comments-${control.id}`}
                      placeholder="Agrega comentarios adicionales..."
                      value={controlData[control.id]?.comments || ""}
                      onChange={(e) =>
                        setControlData({
                          ...controlData,
                          [control.id]: {
                            ...controlData[control.id],
                            conformityStatus: controlData[control.id]?.conformityStatus || "conforme",
                            comments: e.target.value,
                            proofImage: controlData[control.id]?.proofImage || null,
                          },
                        })
                      }
                      onBlur={() => {
                        // Save when user finishes editing comments
                        if (selectedLevels[control.id] && controlData[control.id]) {
                          saveProgress(control.id, selectedLevels[control.id], controlData[control.id]);
                        }
                      }}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor={`proof-${control.id}`}>Evidencia (Opcional)</Label>
                    
                    {/* Mostrar evidencia existente */}
                    {controlData[control.id]?.existingProofUrl && !controlData[control.id]?.proofImage && (
                      <div className="mt-2 mb-3 p-3 bg-muted/30 rounded-lg border border-border">
                        <p className="text-xs font-medium mb-2">Evidencia guardada:</p>
                        <EvidenceViewer 
                          evidenceUrl={controlData[control.id].existingProofUrl!}
                          controlName={control.name}
                        />
                      </div>
                    )}
                    
                    <p className="text-xs text-muted-foreground mb-2">
                      {controlData[control.id]?.existingProofUrl 
                        ? "Puedes reemplazar la evidencia subiendo un nuevo archivo"
                        : "Puedes adjuntar imágenes, PDFs, documentos Word o videos cortos (máx. 20MB)"}
                    </p>
                    <input
                      id={`proof-${control.id}`}
                      type="file"
                      accept="image/*,.pdf,.doc,.docx,video/mp4,video/webm,video/quicktime"
                       onChange={async (e) => {
                        const file = e.target.files?.[0] || null;
                        const newData = {
                          ...controlData[control.id],
                          conformityStatus: controlData[control.id]?.conformityStatus || "conforme",
                          comments: controlData[control.id]?.comments || "",
                          proofImage: file,
                        };
                        setControlData({
                          ...controlData,
                          [control.id]: newData,
                        });
                        
                        // Auto-save with file upload
                        if (file && selectedLevels[control.id]) {
                          await saveProgress(control.id, selectedLevels[control.id], newData, file);
                        }
                      }}
                      className="mt-2 w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-secondary file:text-secondary-foreground hover:file:bg-secondary/90"
                    />
                    {controlData[control.id]?.proofImage && (
                      <div className="mt-3 p-3 bg-muted/30 rounded-lg border border-border">
                        <p className="text-xs font-medium text-foreground mb-2">
                          Vista previa: {controlData[control.id].proofImage.name}
                        </p>
                        {controlData[control.id].proofImage.type.startsWith('image/') && (
                          <img
                            src={URL.createObjectURL(controlData[control.id].proofImage)}
                            alt="Vista previa"
                            className="max-w-full h-auto max-h-60 rounded border object-contain"
                          />
                        )}
                        {controlData[control.id].proofImage.type === 'application/pdf' && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <FileText className="h-8 w-8" />
                            <span className="text-sm">Archivo PDF seleccionado</span>
                          </div>
                        )}
                        {controlData[control.id].proofImage.type.startsWith('video/') && (
                          <video
                            src={URL.createObjectURL(controlData[control.id].proofImage)}
                            controls
                            className="max-w-full h-auto max-h-60 rounded border"
                          >
                            Tu navegador no soporta la reproducción de videos.
                          </video>
                        )}
                        {(controlData[control.id].proofImage.type.includes('word') ||
                          controlData[control.id].proofImage.type.includes('document')) && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <FileText className="h-8 w-8" />
                            <span className="text-sm">Documento seleccionado</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-8 flex justify-center">
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !allControlsAnswered}
              variant="secondary"
              size="lg"
              className="min-w-[200px]"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSubmitting ? "Guardando..." : "Finalizar Evaluación"}
            </Button>
            {!allControlsAnswered && (
              <p className="text-sm text-muted-foreground mt-4 text-center w-70 h-10 pl-4">
                Completa todos los controles para finalizar
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssessmentNIST;
