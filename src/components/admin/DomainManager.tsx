import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";

interface Domain {
  id: string;
  name: string;
  description: string;
  standard: string;
}

export const DomainManager = () => {
  const { toast } = useToast();
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDomain, setEditingDomain] = useState<Domain | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    standard: "ISO27001"
  });

  useEffect(() => {
    fetchDomains();
  }, []);

  const fetchDomains = async () => {
    try {
      const { data, error } = await supabase
        .from('domains')
        .select('*')
        .order('standard', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      setDomains(data || []);
    } catch (error) {
      console.error("Error fetching domains:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los dominios",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingDomain) {
        const { error } = await supabase
          .from('domains')
          .update(formData)
          .eq('id', editingDomain.id);

        if (error) throw error;

        toast({
          title: "Dominio actualizado",
          description: "El dominio se ha actualizado correctamente"
        });
      } else {
        const { error } = await supabase
          .from('domains')
          .insert(formData);

        if (error) throw error;

        toast({
          title: "Dominio creado",
          description: "El dominio se ha creado correctamente"
        });
      }

      setIsDialogOpen(false);
      setEditingDomain(null);
      setFormData({ name: "", description: "", standard: "ISO27001" });
      fetchDomains();
    } catch (error: any) {
      console.error("Error saving domain:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar el dominio",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (domain: Domain) => {
    setEditingDomain(domain);
    setFormData({
      name: domain.name,
      description: domain.description,
      standard: domain.standard
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este dominio? Esto también eliminará todos los controles asociados.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from('domains')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Dominio eliminado",
        description: "El dominio se ha eliminado correctamente"
      });

      fetchDomains();
    } catch (error: any) {
      console.error("Error deleting domain:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el dominio",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <div className="text-center py-8">Cargando dominios...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Gestión de Dominios</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingDomain(null);
              setFormData({ name: "", description: "", standard: "ISO27001" });
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Dominio
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingDomain ? "Editar Dominio" : "Nuevo Dominio"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Nombre</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nombre del dominio"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Descripción</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descripción del dominio"
                  rows={3}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Estándar</label>
                <Select
                  value={formData.standard}
                  onValueChange={(value) => setFormData({ ...formData, standard: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ISO27001">ISO 27001</SelectItem>
                    <SelectItem value="NIST">NIST CSF</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingDomain ? "Actualizar" : "Crear"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {domains.map((domain) => (
          <div key={domain.id} className="border rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold">{domain.name}</h3>
                  <span className="text-xs bg-muted px-2 py-1 rounded">
                    {domain.standard}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{domain.description}</p>
              </div>
              <div className="flex gap-2 ml-4">
                <Button size="sm" variant="outline" onClick={() => handleEdit(domain)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleDelete(domain.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};