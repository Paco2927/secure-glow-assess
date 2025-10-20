import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Search } from "lucide-react";

interface Control {
  id: string;
  code: string;
  name: string;
  domain_id: string;
}

interface MaturityLevel {
  id: string;
  name: string;
  level: number;
}

interface Domain {
  id: string;
  name: string;
  standard: string;
}

interface Template {
  id: string;
  control_id: string;
  maturity_level_id: string;
  template_text: string;
  controls: Control;
  maturity_levels: MaturityLevel;
}

const ImprovementPlanManager = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [controls, setControls] = useState<Control[]>([]);
  const [maturityLevels, setMaturityLevels] = useState<MaturityLevel[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);

  const [selectedDomain, setSelectedDomain] = useState<string>("");
  const [selectedControl, setSelectedControl] = useState<string>("");
  const [selectedLevel, setSelectedLevel] = useState<string>("");
  const [templateText, setTemplateText] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [domainsRes, controlsRes, levelsRes, templatesRes] = await Promise.all([
        supabase.from("domains").select("*").order("name"),
        supabase.from("controls").select("*").order("code"),
        supabase.from("maturity_levels").select("*").order("level"),
        supabase
          .from("improvement_plan_templates")
          .select(
            `
          *,
          controls(id, code, name, domain_id),
          maturity_levels(id, name, level)
        `,
          )
          .order("created_at", { ascending: false }),
      ]);

      if (domainsRes.error) throw domainsRes.error;
      if (controlsRes.error) throw controlsRes.error;
      if (levelsRes.error) throw levelsRes.error;
      if (templatesRes.error) throw templatesRes.error;

      setDomains(domainsRes.data || []);
      setControls(controlsRes.data || []);
      setMaturityLevels(levelsRes.data || []);
      setTemplates((templatesRes.data as any) || []);
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

  const handleSave = async () => {
    if (!selectedControl || !selectedLevel || !templateText.trim()) {
      toast({
        title: "Error",
        description: "Debes seleccionar un control, nivel de madurez y escribir un texto",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingId) {
        const { error } = await supabase
          .from("improvement_plan_templates")
          .update({ template_text: templateText })
          .eq("id", editingId);

        if (error) throw error;

        toast({
          title: "Éxito",
          description: "Template actualizado correctamente",
        });
      } else {
        const { error } = await supabase.from("improvement_plan_templates").insert({
          control_id: selectedControl,
          maturity_level_id: selectedLevel,
          template_text: templateText,
        });

        if (error) throw error;

        toast({
          title: "Éxito",
          description: "Template creado correctamente",
        });
      }

      resetForm();
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (template: Template) => {
    setEditingId(template.id);
    setSelectedControl(template.control_id);
    setSelectedLevel(template.maturity_level_id);
    setTemplateText(template.template_text);

    const control = controls.find((c) => c.id === template.control_id);
    if (control) {
      setSelectedDomain(control.domain_id);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este template?")) return;

    try {
      const { error } = await supabase.from("improvement_plan_templates").delete().eq("id", id);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Template eliminado correctamente",
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setSelectedDomain("");
    setSelectedControl("");
    setSelectedLevel("");
    setTemplateText("");
  };

  const filteredControls = controls.filter((c) => (selectedDomain ? c.domain_id === selectedDomain : true));

  const filteredTemplates = templates.filter((t) => {
    const matchesSearch =
      searchTerm === "" ||
      t.controls.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.controls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.maturity_levels.name.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{editingId ? "Editar" : "Crear"} Template de Plan de Mejora</CardTitle>
          <CardDescription>
            Define el texto del plan de mejora para cada control según el nivel de madurez seleccionado
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Dominio</Label>
              <Select value={selectedDomain} onValueChange={setSelectedDomain}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un dominio" />
                </SelectTrigger>
                <SelectContent>
                  {domains.map((domain) => (
                    <SelectItem key={domain.id} value={domain.id}>
                      {domain.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Control</Label>
              <Select value={selectedControl} onValueChange={setSelectedControl} disabled={!selectedDomain}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un control" />
                </SelectTrigger>
                <SelectContent>
                  {filteredControls.map((control) => (
                    <SelectItem key={control.id} value={control.id}>
                      {control.code} - {control.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Nivel de Madurez</Label>
              <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un nivel" />
                </SelectTrigger>
                <SelectContent>
                  {maturityLevels.map((level) => (
                    <SelectItem key={level.id} value={level.id}>
                      Nivel {level.level} - {level.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Texto del Plan de Mejora</Label>
            <Textarea
              value={templateText}
              onChange={(e) => setTemplateText(e.target.value)}
              placeholder="Escribe el plan de mejora recomendado para este control y nivel..."
              rows={6}
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSave}>{editingId ? "Actualizar" : "Crear"} plantilla</Button>
            {editingId && (
              <Button variant="outline" onClick={resetForm}>
                Cancelar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Templates Existentes</CardTitle>
          <CardDescription>Lista de todos los templates de planes de mejora configurados</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por código, nombre o nivel..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="text-sm text-muted-foreground">Mostrando {filteredTemplates.length} template(s)</div>

          <div className="space-y-3">
            {filteredTemplates.map((template) => (
              <Card key={template.id} className="p-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">
                        {template.controls.code} - {template.controls.name}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Nivel {template.maturity_levels.level}: {template.maturity_levels.name}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(template)}>
                        Editar
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(template.id)}>
                        Eliminar
                      </Button>
                    </div>
                  </div>
                  <div className="bg-muted/30 p-3 rounded text-sm">{template.template_text}</div>
                </div>
              </Card>
            ))}

            {filteredTemplates.length === 0 && (
              <div className="text-center text-muted-foreground py-8">No se encontraron templates</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ImprovementPlanManager;
