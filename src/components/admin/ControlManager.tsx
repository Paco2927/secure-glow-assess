import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Search } from "lucide-react";

interface Control {
  id: string;
  code: string;
  name: string;
  description: string;
  domain_id: string;
  domains: {
    name: string;
    standard: string;
  };
}

interface Domain {
  id: string;
  name: string;
  standard: string;
}

export const ControlManager = () => {
  const { toast } = useToast();
  const [controls, setControls] = useState<Control[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [controlToDelete, setControlToDelete] = useState<string | null>(null);
  const [editingControl, setEditingControl] = useState<Control | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDomain, setFilterDomain] = useState<string>("all");
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    domain_id: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [controlsRes, domainsRes] = await Promise.all([
        supabase.from("controls").select("*, domains(name, standard)").order("code"),
        supabase.from("domains").select("*").order("standard", { ascending: true }).order("name", { ascending: true }),
      ]);

      if (controlsRes.error) throw controlsRes.error;
      if (domainsRes.error) throw domainsRes.error;

      setControls(controlsRes.data || []);
      setDomains(domainsRes.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los controles",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingControl) {
        const { error } = await supabase.from("controls").update(formData).eq("id", editingControl.id);

        if (error) throw error;

        toast({
          title: "Control actualizado",
          description: "El control se ha actualizado correctamente",
        });
      } else {
        const { error } = await supabase.from("controls").insert(formData);

        if (error) throw error;

        toast({
          title: "Control creado",
          description: "El control se ha creado correctamente",
        });
      }

      setIsDialogOpen(false);
      setEditingControl(null);
      setFormData({ code: "", name: "", description: "", domain_id: "" });
      fetchData();
    } catch (error: any) {
      console.error("Error saving control:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar el control",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (control: Control) => {
    setEditingControl(control);
    setFormData({
      code: control.code,
      name: control.name,
      description: control.description,
      domain_id: control.domain_id,
    });
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setControlToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!controlToDelete) return;

    try {
      const { error } = await supabase.from("controls").delete().eq("id", controlToDelete);

      if (error) throw error;

      toast({
        title: "Control eliminado",
        description: "El control se ha eliminado correctamente",
      });

      fetchData();
    } catch (error: any) {
      console.error("Error deleting control:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el control",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setControlToDelete(null);
    }
  };

  const filteredControls = controls.filter((control) => {
    const matchesSearch =
      control.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      control.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      control.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDomain = filterDomain === "all" || control.domain_id === filterDomain;

    return matchesSearch && matchesDomain;
  });

  if (loading) {
    return <div className="text-center py-8">Cargando controles...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Gestión de Controles</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingControl(null);
                setFormData({ code: "", name: "", description: "", domain_id: "" });
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Control
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingControl ? "Editar Control" : "Nuevo Control"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Código</label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="Ej: 5.1, GV.OC-01"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Nombre</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nombre del control"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Descripción (Pregunta)</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Pregunta de evaluación"
                  rows={3}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Dominio</label>
                <Select
                  value={formData.domain_id}
                  onValueChange={(value) => setFormData({ ...formData, domain_id: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un dominio" />
                  </SelectTrigger>
                  <SelectContent>
                    {domains.map((domain) => (
                      <SelectItem key={domain.id} value={domain.id}>
                        {domain.name} ({domain.standard})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">{editingControl ? "Actualizar" : "Crear"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-4 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar controles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterDomain} onValueChange={setFilterDomain}>
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Filtrar por dominio" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los dominios</SelectItem>
            {domains.map((domain) => (
              <SelectItem key={domain.id} value={domain.id}>
                {domain.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="text-sm text-muted-foreground mb-2">
        Mostrando {filteredControls.length} de {controls.length} controles
      </div>

      <div className="grid gap-3">
        {filteredControls.map((control) => (
          <div key={control.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-mono text-sm font-semibold">{control.code}</span>
                  <span className="text-sm font-medium">{control.name}</span>
                  <span className="text-xs bg-muted px-2 py-1 rounded">{control.domains.name}</span>
                </div>
                <p className="text-sm text-muted-foreground">{control.description}</p>
              </div>
              <div className="flex gap-2 ml-4">
                <Button size="sm" variant="outline" onClick={() => handleEdit(control)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleDeleteClick(control.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar control?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el control.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
