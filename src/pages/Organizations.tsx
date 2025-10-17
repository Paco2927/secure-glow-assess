import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Building2, Plus, Pencil, Trash2, ArrowLeft, Users } from "lucide-react";
import { useAdminRole } from "@/hooks/useAdminRole";
import { OrganizationMembersManager } from "@/components/admin/OrganizationMembersManager";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

interface Organization {
  id: string;
  name: string;
  sector: string | null;
  contact_email: string | null;
  country: string | null;
  created_at: string;
}

const Organizations = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin, loading: adminLoading } = useAdminRole();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [deleteOrgId, setDeleteOrgId] = useState<string | null>(null);
  const [selectedOrgForMembers, setSelectedOrgForMembers] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    sector: "",
    contact_email: "",
    country: "",
  });

  useEffect(() => {
    checkAuth();
    loadOrganizations();
  }, []);

  const checkAuth = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
    }
  };

  const loadOrganizations = async () => {
    try {
      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrganizations(data || []);
    } catch (error) {
      console.error("Error loading organizations:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las organizaciones",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (org?: Organization) => {
    if (!isAdmin && !org) {
      toast({
        title: "Permiso denegado",
        description: "Solo los administradores pueden crear organizaciones",
        variant: "destructive",
      });
      return;
    }

    if (org) {
      setEditingOrg(org);
      setFormData({
        name: org.name,
        sector: org.sector || "",
        contact_email: org.contact_email || "",
        country: org.country || "",
      });
    } else {
      setEditingOrg(null);
      setFormData({ name: "", sector: "", contact_email: "", country: "" });
    }
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingOrg(null);
    setFormData({ name: "", sector: "", contact_email: "", country: "" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      if (editingOrg) {
        const { error } = await supabase
          .from("organizations")
          .update({
            name: formData.name,
            sector: formData.sector || null,
            contact_email: formData.contact_email || null,
            country: formData.country || null,
          })
          .eq("id", editingOrg.id);

        if (error) throw error;

        toast({
          title: "Organización actualizada",
          description: "Los cambios se guardaron correctamente",
        });
      } else {
        const { error } = await supabase.from("organizations").insert({
          name: formData.name,
          sector: formData.sector || null,
          contact_email: formData.contact_email || null,
          country: formData.country || null,
          user_id: user.id,
        });

        if (error) throw error;

        toast({
          title: "Organización creada",
          description: "La organización se creó correctamente",
        });
      }

      handleCloseDialog();
      loadOrganizations();
    } catch (error) {
      console.error("Error saving organization:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar la organización",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteOrgId) return;

    try {
      const { error } = await supabase.from("organizations").delete().eq("id", deleteOrgId);

      if (error) throw error;

      toast({
        title: "Organización eliminada",
        description: "La organización se eliminó correctamente",
      });

      loadOrganizations();
    } catch (error) {
      console.error("Error deleting organization:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la organización",
        variant: "destructive",
      });
    } finally {
      setDeleteOrgId(null);
    }
  };

  if (loading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-4xl font-bold flex items-center gap-3">
                <Building2 className="h-10 w-10" />
                Organizaciones
              </h1>
              <p className="text-muted-foreground mt-2">Gestiona las organizaciones para tus evaluaciones</p>
            </div>
          </div>
          {isAdmin && (
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Organización
            </Button>
          )}
        </div>

        {organizations.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Building2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No hay organizaciones</h3>
              <p className="text-muted-foreground mb-4">Crea tu primera organización para comenzar</p>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Crear Organización
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {organizations.map((org) => (
              <Card key={org.id}>
                <CardHeader>
                  <CardTitle>{org.name}</CardTitle>
                  <CardDescription>
                    {org.sector && <div>Sector: {org.sector}</div>}
                    {org.country && <div>País: {org.country}</div>}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {org.contact_email && <p className="text-sm text-muted-foreground mb-4">{org.contact_email}</p>}
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setSelectedOrgForMembers(org.id)}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Miembros
                    </Button>
                    {isAdmin && (
                      <>
                        <Button variant="outline" size="sm" onClick={() => handleOpenDialog(org)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Editar
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => setDeleteOrgId(org.id)}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Eliminar
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingOrg ? "Editar Organización" : "Nueva Organización"}</DialogTitle>
            <DialogDescription>Completa los datos de la organización</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sector">Sector</Label>
                <Input
                  id="sector"
                  value={formData.sector}
                  onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">País</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancelar
              </Button>
              <Button type="submit">{editingOrg ? "Guardar Cambios" : "Crear Organización"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteOrgId} onOpenChange={() => setDeleteOrgId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará la organización permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!selectedOrgForMembers} onOpenChange={() => setSelectedOrgForMembers(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Gestionar Miembros</DialogTitle>
            <DialogDescription>
              Administra los miembros de esta organización
            </DialogDescription>
          </DialogHeader>
          {selectedOrgForMembers && (
            <OrganizationMembersManager
              organizationId={selectedOrgForMembers}
              isOwner={isAdmin}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Organizations;
