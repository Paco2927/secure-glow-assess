import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, ArrowLeft, Save } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { OrganizationSelector } from "@/components/OrganizationSelector";
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
}

interface MaturityLevel {
  id: string;
  level: number;
  name: string;
  description: string;
}

const AssessmentNIST = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [controls, setControls] = useState<Control[]>([]);
  const [maturityLevels, setMaturityLevels] = useState<MaturityLevel[]>([]);
  const [selectedLevels, setSelectedLevels] = useState<Record<string, string>>({});
  const [controlData, setControlData] = useState<Record<string, ControlData>>({});
  const [selectedOrganization, setSelectedOrganization] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      // Create a new assessment
      const { data: assessment, error: assessmentError } = await supabase
        .from("assessments")
        .insert({
          user_id: user.id,
          standard: "NIST",
          assessor_name: user.email,
          comments: "Evaluación inicial NIST CSF",
          organization_id: selectedOrganization,
        })
        .select()
        .single();

      if (assessmentError) throw assessmentError;

      // Upload images and save assessment results for each control
      const results = await Promise.all(
        Object.entries(selectedLevels).map(async ([controlId, levelId]) => {
          let proofImageUrl = null;
          
          // Upload proof image if exists
          if (controlData[controlId]?.proofImage) {
            const file = controlData[controlId].proofImage;
            const fileExt = file!.name.split('.').pop();
            const fileName = `${assessment.id}/${controlId}.${fileExt}`;
            
            const { error: uploadError } = await supabase.storage
              .from('avatars')
              .upload(fileName, file!, { upsert: true });
            
            if (!uploadError) {
              const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(fileName);
              proofImageUrl = publicUrl;
            }
          }
          
          return {
            assessment_id: assessment.id,
            control_id: controlId,
            maturity_level_id: levelId,
            evidence: "",
            comments: controlData[controlId]?.comments || null,
            proof_image_url: proofImageUrl,
            conformity_status: controlData[controlId]?.conformityStatus,
          };
        })
      );

      const { error: resultsError } = await supabase.from("assessment_results").insert(results);

      if (resultsError) throw resultsError;

      toast({
        title: "¡Evaluación guardada!",
        description: "Tu evaluación NIST CSF se ha guardado exitosamente.",
      });

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
                          onClick={() => setSelectedLevels({ ...selectedLevels, [control.id]: level.id })}
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
                          onClick={() =>
                            setControlData({
                              ...controlData,
                              [control.id]: {
                                ...controlData[control.id],
                                conformityStatus: status.value as "conforme" | "no_conformidad" | "no_conformidad_menor" | "punto_de_mejora",
                                comments: controlData[control.id]?.comments || "",
                                proofImage: controlData[control.id]?.proofImage || null,
                              },
                            })
                          }
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
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor={`proof-${control.id}`}>Imagen de Prueba (Opcional)</Label>
                    <input
                      id={`proof-${control.id}`}
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setControlData({
                          ...controlData,
                          [control.id]: {
                            ...controlData[control.id],
                            conformityStatus: controlData[control.id]?.conformityStatus || "conforme",
                            comments: controlData[control.id]?.comments || "",
                            proofImage: file,
                          },
                        });
                      }}
                      className="mt-2 w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-secondary file:text-secondary-foreground hover:file:bg-secondary/90"
                    />
                    {controlData[control.id]?.proofImage && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Archivo: {controlData[control.id].proofImage.name}
                      </p>
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
