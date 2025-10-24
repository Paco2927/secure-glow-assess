import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function MatrixConfig() {
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({
    id: "",
    name: "Default ISO 27001 Matrix",
    likelihood_scale: 5,
    impact_scale: 5,
    scoring_formula: "likelihood * impact",
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const { data } = await supabase
        .from("risk_matrix_config")
        .select("*")
        .eq("is_active", true)
        .maybeSingle();

      if (data) {
        setConfig({
          id: data.id,
          name: data.name,
          likelihood_scale: data.likelihood_scale,
          impact_scale: data.impact_scale,
          scoring_formula: data.scoring_formula,
        });
      }
    } catch (error) {
      console.error("Error fetching config:", error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (config.id) {
        const { error } = await supabase
          .from("risk_matrix_config")
          .update({
            name: config.name,
            likelihood_scale: config.likelihood_scale,
            impact_scale: config.impact_scale,
            scoring_formula: config.scoring_formula,
          })
          .eq("id", config.id);

        if (error) throw error;
      }

      toast.success("Configuración actualizada");
      window.location.reload();
    } catch (error) {
      console.error("Error saving config:", error);
      toast.error("Error al guardar la configuración");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuración de la Matriz</CardTitle>
        <CardDescription>
          Personaliza los parámetros de evaluación de riesgos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="name">Nombre de la Matriz</Label>
          <Input
            id="name"
            value={config.name}
            onChange={(e) => setConfig({ ...config, name: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="likelihood_scale">Escala de Probabilidad</Label>
            <Select
              value={config.likelihood_scale.toString()}
              onValueChange={(value) => setConfig({ ...config, likelihood_scale: parseInt(value) })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="4">1-4</SelectItem>
                <SelectItem value="5">1-5</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="impact_scale">Escala de Impacto</Label>
            <Select
              value={config.impact_scale.toString()}
              onValueChange={(value) => setConfig({ ...config, impact_scale: parseInt(value) })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="4">1-4</SelectItem>
                <SelectItem value="5">1-5</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="pt-4">
          <Button onClick={handleSave} disabled={loading} className="w-full">
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Guardar Configuración
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
