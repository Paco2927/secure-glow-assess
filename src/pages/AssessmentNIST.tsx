import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, ArrowLeft, Save } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Domain {
  id: string;
  name: string;
  description: string;
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
  const [domains, setDomains] = useState<Domain[]>([]);
  const [maturityLevels, setMaturityLevels] = useState<MaturityLevel[]>([]);
  const [selectedLevels, setSelectedLevels] = useState<Record<string, string>>({});
  const [evidences, setEvidences] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
    };

    const loadData = async () => {
      // Load NIST domains
      const { data: domainsData } = await supabase
        .from("domains")
        .select("*")
        .eq("standard", "NIST");
      
      if (domainsData) setDomains(domainsData);

      // Load maturity levels
      const { data: levelsData } = await supabase
        .from("maturity_levels")
        .select("*")
        .order("level");
      
      if (levelsData) setMaturityLevels(levelsData);
    };

    checkAuth();
    loadData();
  }, [navigate]);

  const handleSubmit = async () => {
    if (Object.keys(selectedLevels).length === 0) {
      toast({
        title: "Selecciona al menos un nivel",
        description: "Debes evaluar al menos una función antes de guardar.",
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
        })
        .select()
        .single();

      if (assessmentError) throw assessmentError;

      // Save assessment results for each domain
      const results = Object.entries(selectedLevels).map(([domainId, levelId]) => ({
        assessment_id: assessment.id,
        control_id: domainId,
        maturity_level_id: levelId,
        evidence: evidences[domainId] || "",
      }));

      const { error: resultsError } = await supabase
        .from("assessment_results")
        .insert(results);

      if (resultsError) throw resultsError;

      toast({
        title: "¡Evaluación guardada!",
        description: "Tu evaluación NIST CSF se ha guardado exitosamente.",
      });

      navigate("/");
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
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center">
                <Shield className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Evaluación NIST CSF</h1>
                <p className="text-xs text-muted-foreground">Cybersecurity Framework</p>
              </div>
            </div>
            <Button onClick={handleSubmit} disabled={isSubmitting} variant="secondary">
              <Save className="w-4 h-4 mr-2" />
              {isSubmitting ? "Guardando..." : "Guardar Evaluación"}
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card className="mb-6 shadow-medium">
            <CardHeader>
              <CardTitle>Instrucciones</CardTitle>
              <CardDescription>
                Evalúa cada función del NIST Cybersecurity Framework según el nivel de madurez de tu organización
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                {maturityLevels.map((level) => (
                  <div key={level.id} className="flex gap-2">
                    <span className="font-semibold text-secondary">Nivel {level.level}:</span>
                    <span className="font-medium">{level.name}</span>
                    <span className="text-muted-foreground">- {level.description}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            {domains.map((domain) => (
              <Card key={domain.id} className="shadow-medium">
                <CardHeader>
                  <CardTitle>{domain.name}</CardTitle>
                  <CardDescription>{domain.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="mb-3 block">Nivel de Madurez</Label>
                    <div className="grid grid-cols-5 gap-2">
                      {maturityLevels.map((level) => (
                        <Button
                          key={level.id}
                          variant={selectedLevels[domain.id] === level.id ? "secondary" : "outline"}
                          className="w-full"
                          onClick={() =>
                            setSelectedLevels({ ...selectedLevels, [domain.id]: level.id })
                          }
                        >
                          {level.level}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {selectedLevels[domain.id] && (
                    <div>
                      <Label htmlFor={`evidence-${domain.id}`}>
                        Evidencia / Comentarios (Opcional)
                      </Label>
                      <Textarea
                        id={`evidence-${domain.id}`}
                        placeholder="Describe las evidencias o comentarios sobre esta función..."
                        value={evidences[domain.id] || ""}
                        onChange={(e) =>
                          setEvidences({ ...evidences, [domain.id]: e.target.value })
                        }
                        className="mt-2"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-8 flex justify-end">
            <Button onClick={handleSubmit} disabled={isSubmitting} variant="secondary" size="lg">
              <Save className="w-4 h-4 mr-2" />
              {isSubmitting ? "Guardando..." : "Guardar Evaluación"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssessmentNIST;
