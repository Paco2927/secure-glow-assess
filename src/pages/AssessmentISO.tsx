import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, ArrowLeft, Save, AlertTriangle, FileText, X, Eye } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { OrganizationSelector } from "@/components/OrganizationSelector";
import EvidenceViewer from "@/components/EvidenceViewer";
import IsoIcon from "@/assets/IsoIcon.png";
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

interface EvidenceFile {
  url: string;
  fileName: string;
  uploadedAt: string;
}

interface ControlData {
  conformityStatus: "conforme" | "no_conformidad" | "no_conformidad_menor" | "punto_de_mejora";
  comments: string;
  proofImages: File[];
  existingProofUrls: EvidenceFile[];
}

interface MaturityLevel {
  id: string;
  level: number;
  name: string;
  description: string;
}

const AssessmentISO = () => {
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
    controls.every((control) => 
      selectedLevels[control.id] && controlData[control.id]?.conformityStatus
    ) && 
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
      // Load ISO 27001 controls with their domains
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
        .eq("domains.standard", "ISO27001")
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
          .eq("standard", "ISO27001")
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
          .select("control_id, maturity_level_id, conformity_status, comments, proof_images")
          .eq("assessment_id", assessment.id);

        if (results) {
          const newSelectedLevels: Record<string, string> = {};
          const newControlData: Record<string, ControlData> = {};
          
          results.forEach((result) => {
            newSelectedLevels[result.control_id] = result.maturity_level_id;
            const proofImages = Array.isArray(result.proof_images) ? result.proof_images as unknown as EvidenceFile[] : [];
            newControlData[result.control_id] = {
              conformityStatus: result.conformity_status,
              comments: result.comments || "",
              proofImages: [],
              existingProofUrls: proofImages,
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
        .eq("standard", "ISO27001")
        .eq("status", "pending")
        .maybeSingle();

      if (pendingAssessment) {
        setCurrentAssessmentId(pendingAssessment.id);
        
        // Load existing results
        const { data: results } = await supabase
          .from("assessment_results")
          .select("control_id, maturity_level_id, conformity_status, comments, proof_images")
          .eq("assessment_id", pendingAssessment.id);

        if (results) {
          const newSelectedLevels: Record<string, string> = {};
          const newControlData: Record<string, ControlData> = {};
          
          results.forEach((result) => {
            newSelectedLevels[result.control_id] = result.maturity_level_id;
            const proofImages = Array.isArray(result.proof_images) ? result.proof_images as unknown as EvidenceFile[] : [];
            newControlData[result.control_id] = {
              conformityStatus: result.conformity_status,
              comments: result.comments || "",
              proofImages: [],
              existingProofUrls: proofImages,
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
  const saveProgress = async (controlId: string, levelId: string, data: ControlData, uploadFiles?: File[]) => {
    if (!selectedOrganization || !user) return;

    try {
      let assessmentId = currentAssessmentId;

      // Create assessment if it doesn't exist
      if (!assessmentId) {
        const { data: newAssessment, error: assessmentError } = await supabase
          .from("assessments")
          .insert({
            user_id: user.id,
            standard: "ISO27001",
            assessor_name: user.email,
            comments: "Evaluación ISO 27001 en progreso",
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
        
        toast({
          title: "Evaluación iniciada",
          description: "Tu progreso se guardará automáticamente",
        });
      }

      // Upload new files if provided
      const newEvidences: EvidenceFile[] = [];
      if (uploadFiles && uploadFiles.length > 0) {
        for (const file of uploadFiles) {
          const fileExt = file.name.split(".").pop();
          const timestamp = Date.now();
          const fileName = `${assessmentId}/${controlId}/${timestamp}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from("evidencias")
            .upload(fileName, file, { upsert: false });

          if (!uploadError) {
            const { data, error: signedUrlError } = await supabase.storage
              .from("evidencias")
              .createSignedUrl(fileName, 31536000); // 1 year expiry
            
            if (!signedUrlError && data) {
              newEvidences.push({
                url: data.signedUrl,
                fileName: file.name,
                uploadedAt: new Date().toISOString(),
              });
            }
          }
        }
        
        if (newEvidences.length > 0) {
          toast({
            title: "Evidencias guardadas",
            description: `Se ${newEvidences.length === 1 ? 'ha' : 'han'} guardado ${newEvidences.length} evidencia${newEvidences.length > 1 ? 's' : ''}`,
          });
        }
      }

      // Combine existing and new evidences
      const allEvidences = [...data.existingProofUrls, ...newEvidences];

      // Upsert the result
      const resultData: any = {
        assessment_id: assessmentId,
        control_id: controlId,
        maturity_level_id: levelId,
        conformity_status: data.conformityStatus,
        comments: data.comments || null,
        evidence: "",
        proof_images: JSON.parse(JSON.stringify(allEvidences)),
      };

      const { error: upsertError } = await supabase
        .from("assessment_results")
        .upsert(resultData, {
          onConflict: "assessment_id,control_id"
        });

      if (upsertError) {
        console.error("Error saving control result:", upsertError);
        toast({
          title: "Error al guardar respuesta",
          description: "No se pudo guardar la respuesta. Verifica tus permisos.",
          variant: "destructive",
        });
        throw upsertError;
      }

      // Update local state with new evidences
      setControlData({
        ...controlData,
        [controlId]: {
          ...data,
          existingProofUrls: allEvidences,
          proofImages: [],
        },
      });
    } catch (error) {
      console.error("Error saving progress:", error);
    }
  };

  // Delete evidence function
  const deleteEvidence = async (controlId: string, evidenceIndex: number) => {
    if (!currentAssessmentId) return;

    const data = controlData[controlId];
    if (!data) return;

    try {
      const updatedEvidences = data.existingProofUrls.filter((_, index) => index !== evidenceIndex);

      // Update database
      const { error } = await supabase
        .from("assessment_results")
        .update({ proof_images: JSON.parse(JSON.stringify(updatedEvidences)) })
        .eq("assessment_id", currentAssessmentId)
        .eq("control_id", controlId);

      if (error) throw error;

      // Update local state
      setControlData({
        ...controlData,
        [controlId]: {
          ...data,
          existingProofUrls: updatedEvidences,
        },
      });

      toast({
        title: "Evidencia eliminada",
        description: "La evidencia se ha eliminado correctamente",
      });
    } catch (error) {
      console.error("Error deleting evidence:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la evidencia",
        variant: "destructive",
      });
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

      // Update assessment status to completed
      await supabase
        .from("assessments")
        .update({ status: "completed" })
        .eq("id", assessmentId);

      toast({
        title: "¡Evaluación guardada!",
        description: "Tu evaluación ISO 27001 se ha guardado exitosamente.",
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
              <div className="w-10 h-10 rounded-full gradient-hero flex items-center justify-center">
                <img src={IsoIcon} alt="ISO 27001" className="w-12 h-12 object-contain" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Evaluación ISO 27001</h1>
                <p className="text-xs text-muted-foreground">Seguridad de la Información</p>
              </div>
            </div>
            <div className="flex gap-2">
              {currentAssessmentId && (
                <Button
                  variant="outline"
                  onClick={() => navigate(`/risk-matrix?assessment=${currentAssessmentId}`)}
                >
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Matriz de Riesgos
                </Button>
              )}
              <Button onClick={handleSubmit} disabled={isSubmitting || !allControlsAnswered} variant="hero">
                <Save className="w-4 h-4 mr-2" />
                {isSubmitting ? "Guardando..." : "Finalizar Evaluación"}
              </Button>
            </div>
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
                    <span className="font-semibold text-primary">{level.name}:</span>
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
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-md whitespace-nowrap">
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
                          variant={selectedLevels[control.id] === level.id ? "default" : "outline"}
                          className="w-full text-xs sm:text-sm"
                          onClick={() => {
                            const newLevels = { ...selectedLevels, [control.id]: level.id };
                            setSelectedLevels(newLevels);
                            // Save immediately with existing data or defaults
                            const dataToSave = controlData[control.id] || {
                              conformityStatus: "conforme",
                              comments: "",
                              proofImages: [],
                              existingProofUrls: [],
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
                          variant={controlData[control.id]?.conformityStatus === status.value ? "default" : "outline"}
                          className="w-full text-xs sm:text-sm"
                          onClick={() => {
                            const newData = {
                              ...controlData[control.id],
                              conformityStatus: status.value as "conforme" | "no_conformidad" | "no_conformidad_menor" | "punto_de_mejora",
                              comments: controlData[control.id]?.comments || "",
                              proofImages: controlData[control.id]?.proofImages || [],
                              existingProofUrls: controlData[control.id]?.existingProofUrls || [],
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
                            proofImages: controlData[control.id]?.proofImages || [],
                            existingProofUrls: controlData[control.id]?.existingProofUrls || [],
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
                    <Label htmlFor={`proof-${control.id}`}>Evidencias (Opcional)</Label>
                    
                    {/* Mostrar evidencias existentes */}
                    {controlData[control.id]?.existingProofUrls && controlData[control.id].existingProofUrls.length > 0 && (
                      <div className="mt-2 mb-3 space-y-2">
                        <p className="text-xs font-medium">Evidencias guardadas:</p>
                        {controlData[control.id].existingProofUrls.map((evidence, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg border border-border">
                            <EvidenceViewer 
                              evidenceUrl={evidence.url}
                              controlName={control.name}
                            />
                            <span className="text-xs flex-1 truncate">{evidence.fileName}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteEvidence(control.id, index)}
                              className="h-8 w-8 p-0 hover:bg-destructive/10"
                            >
                              <X className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Mostrar vista previa de archivos pendientes de subir */}
                    {controlData[control.id]?.proofImages && controlData[control.id].proofImages.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <p className="text-xs font-medium text-foreground">Archivos pendientes de subir:</p>
                        {controlData[control.id].proofImages.map((file, index) => (
                          <div key={index} className="p-3 bg-muted/30 rounded-lg border border-border">
                            <p className="text-xs font-medium text-foreground mb-2">{file.name}</p>
                            {file.type.startsWith('image/') && (
                              <img
                                src={URL.createObjectURL(file)}
                                alt="Vista previa"
                                className="max-w-full h-auto max-h-40 rounded border object-contain"
                              />
                            )}
                            {file.type === 'application/pdf' && (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <FileText className="h-6 w-6" />
                                <span className="text-sm">Archivo PDF</span>
                              </div>
                            )}
                            {file.type.startsWith('video/') && (
                              <video
                                src={URL.createObjectURL(file)}
                                controls
                                className="max-w-full h-auto max-h-40 rounded border"
                              >
                                Tu navegador no soporta la reproducción de videos.
                              </video>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <p className="text-xs text-muted-foreground mb-2 mt-2">
                      Puedes adjuntar múltiples archivos (imágenes, PDFs, documentos Word o videos, máx. 20MB cada uno)
                    </p>
                    <input
                      id={`proof-${control.id}`}
                      type="file"
                      multiple
                      accept="image/*,.pdf,.doc,.docx,video/mp4,video/webm,video/quicktime"
                      onChange={async (e) => {
                        const files = Array.from(e.target.files || []);
                        if (files.length === 0) return;

                        const newData = {
                          ...controlData[control.id],
                          conformityStatus: controlData[control.id]?.conformityStatus || "conforme",
                          comments: controlData[control.id]?.comments || "",
                          proofImages: [...(controlData[control.id]?.proofImages || []), ...files],
                          existingProofUrls: controlData[control.id]?.existingProofUrls || [],
                        };
                        
                        setControlData({
                          ...controlData,
                          [control.id]: newData,
                        });
                        
                        // Auto-save with file upload
                        if (selectedLevels[control.id]) {
                          await saveProgress(control.id, selectedLevels[control.id], newData, files);
                        }
                        
                        // Reset input
                        e.target.value = '';
                      }}
                      className="mt-2 w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-8 flex justify-center">
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !allControlsAnswered}
              variant="hero"
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

export default AssessmentISO;
