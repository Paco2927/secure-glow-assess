import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Building2, Plus, Pencil, Trash2, ArrowLeft, Users, Upload } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
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

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// 🌎 Lista completa de países
const countries = [
  "Afganistán",
  "Albania",
  "Alemania",
  "Andorra",
  "Angola",
  "Antigua y Barbuda",
  "Arabia Saudita",
  "Argelia",
  "Argentina",
  "Armenia",
  "Australia",
  "Austria",
  "Azerbaiyán",
  "Bahamas",
  "Bangladés",
  "Barbados",
  "Baréin",
  "Bélgica",
  "Belice",
  "Benín",
  "Bielorrusia",
  "Bolivia",
  "Bosnia y Herzegovina",
  "Botsuana",
  "Brasil",
  "Brunéi",
  "Bulgaria",
  "Burkina Faso",
  "Burundi",
  "Cabo Verde",
  "Camboya",
  "Camerún",
  "Canadá",
  "Chile",
  "China",
  "Colombia",
  "Corea del Sur",
  "Costa Rica",
  "Croacia",
  "Cuba",
  "Dinamarca",
  "Ecuador",
  "Egipto",
  "El Salvador",
  "Emiratos Árabes Unidos",
  "Eslovaquia",
  "Eslovenia",
  "España",
  "Estados Unidos",
  "Estonia",
  "Etiopía",
  "Filipinas",
  "Finlandia",
  "Francia",
  "Grecia",
  "Guatemala",
  "Honduras",
  "Hungría",
  "India",
  "Indonesia",
  "Irlanda",
  "Islandia",
  "Israel",
  "Italia",
  "Japón",
  "Luxemburgo",
  "México",
  "Nicaragua",
  "Noruega",
  "Panamá",
  "Paraguay",
  "Perú",
  "Polonia",
  "Portugal",
  "Reino Unido",
  "República Dominicana",
  "Rumania",
  "Rusia",
  "Suecia",
  "Suiza",
  "Uruguay",
  "Venezuela",
];

// 🏭 Lista de sectores predefinidos
const sectors = [
  "Agricultura",
  "Alimentación y Bebidas",
  "Arte y Cultura",
  "Asesoría y Consultoría",
  "Automotriz",
  "Aviación y Aeroespacial",
  "Banca y Finanzas",
  "Biotecnología",
  "Comercio Mayorista",
  "Comercio Minorista",
  "Comunicaciones",
  "Construcción",
  "Consumo Masivo",
  "Defensa y Seguridad",
  "Deportes y Recreación",
  "Desarrollo de Software",
  "Desarrollo Sostenible",
  "Educación",
  "Energía",
  "Entretenimiento",
  "Farmacéutico",
  "Gestión Ambiental",
  "Hotelería y Turismo",
  "Importación y Exportación",
  "Industria Manufacturera",
  "Ingeniería",
  "Inmobiliario",
  "Internet y Tecnología",
  "Investigación y Desarrollo",
  "Legal y Jurídico",
  "Logística y Transporte",
  "Marketing y Publicidad",
  "Medicina y Salud",
  "Medios de Comunicación",
  "Minería y Recursos Naturales",
  "Moda y Diseño",
  "Non-Profit / ONG",
  "Organismos Gubernamentales",
  "Petróleo y Gas",
  "Recursos Humanos",
  "Servicios Financieros",
  "Servicios Profesionales",
  "Servicios Públicos",
  "Seguros",
  "Seguridad Informática",
  "Sistemas de Información",
  "Telecomunicaciones",
  "Tecnología",
  "Textil",
  "Transporte",
  "Turismo",
  "Ventas",
];

interface Organization {
  id: string;
  name: string;
  sector: string | null;
  contact_email: string | null;
  country: string | null;
  created_at: string;
  logo_url: string | null;
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
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
    loadOrganizations();
  }, []);

  const checkAuth = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) navigate("/auth");
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
      setLogoPreview(org.logo_url);
      setLogoFile(null);
    } else {
      setEditingOrg(null);
      setFormData({ name: "", sector: "", contact_email: "", country: "" });
      setLogoPreview(null);
      setLogoFile(null);
    }
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingOrg(null);
    setFormData({ name: "", sector: "", contact_email: "", country: "" });
    setLogoFile(null);
    setLogoPreview(null);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Archivo muy grande",
          description: "El logo debe ser menor a 5MB",
          variant: "destructive",
        });
        return;
      }
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      let logoUrl = editingOrg?.logo_url || null;

      // Upload logo if a new file is selected
      if (logoFile) {
        const fileExt = logoFile.name.split(".").pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const filePath = `organization-logos/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("organization-logos")
          .upload(filePath, logoFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("organization-logos")
          .getPublicUrl(filePath);

        logoUrl = publicUrl;
      }

      const payload = {
        name: formData.name,
        sector: formData.sector || null,
        contact_email: formData.contact_email || null,
        country: formData.country || null,
        user_id: user.id,
        logo_url: logoUrl,
      };

      if (editingOrg) {
        const { error } = await supabase.from("organizations").update(payload).eq("id", editingOrg.id);
        if (error) throw error;
        toast({ title: "Organización actualizada", description: "Los cambios se guardaron correctamente" });
      } else {
        const { error } = await supabase.from("organizations").insert(payload);
        if (error) throw error;
        toast({ title: "Organización creada", description: "La organización se creó correctamente" });
      }

      handleCloseDialog();
      loadOrganizations();
    } catch (error) {
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
      toast({ title: "Organización eliminada", description: "La organización se eliminó correctamente" });
      loadOrganizations();
    } catch (error) {
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
        {/* Header */}
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

        {/* Lista de organizaciones */}
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
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {organizations.map((org) => (
              <Card key={org.id} className="flex flex-col min-h-[280px]">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={org.logo_url || undefined} alt={org.name} />
                      <AvatarFallback>
                        <Building2 className="h-6 w-6" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{org.name}</CardTitle>
                      <CardDescription className="text-xs">
                        {org.sector && <div>Sector: {org.sector}</div>}
                        {org.country && <div>País: {org.country}</div>}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between pt-0">
                  {org.contact_email && <p className="text-sm text-muted-foreground mb-4">{org.contact_email}</p>}
                  <div className="flex flex-wrap gap-2 mt-auto">
                    <Button variant="outline" size="sm" onClick={() => setSelectedOrgForMembers(org.id)} className="flex-1 min-w-[100px]">
                      <Users className="h-4 w-4 mr-2" />
                      Miembros
                    </Button>
                    {isAdmin && (
                      <>
                        <Button variant="outline" size="sm" onClick={() => handleOpenDialog(org)} className="flex-1 min-w-[100px]">
                          <Pencil className="h-4 w-4 mr-2" />
                          Editar
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => setDeleteOrgId(org.id)} className="flex-1 min-w-[100px]">
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

      {/* Diálogo de crear/editar */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingOrg ? "Editar Organización" : "Nueva Organización"}</DialogTitle>
            <DialogDescription>Completa los datos de la organización</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              {/* Logo */}
              <div className="space-y-2">
                <Label htmlFor="logo">Logo de la Organización</Label>
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={logoPreview || undefined} alt="Logo preview" />
                    <AvatarFallback>
                      <Building2 className="h-10 w-10" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <Input
                      id="logo"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="cursor-pointer"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Formatos: JPG, PNG, GIF (máx. 5MB)
                    </p>
                  </div>
                </div>
              </div>

              {/* Nombre */}
              <div className="space-y-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              {/* Sector (Select) */}
              <div className="space-y-2">
                <Label htmlFor="sector">Sector</Label>
                <Select value={formData.sector} onValueChange={(value) => setFormData({ ...formData, sector: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un sector" />
                  </SelectTrigger>
                  <SelectContent>
                    {sectors.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Correo */}
              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                />
              </div>

              {/* País */}
              <div className="space-y-2">
                <Label htmlFor="country">País</Label>
                <Select
                  value={formData.country}
                  onValueChange={(value) => setFormData({ ...formData, country: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un país" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

      {/* Diálogo de eliminación */}
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

      {/* Gestor de miembros */}
      <Dialog open={!!selectedOrgForMembers} onOpenChange={() => setSelectedOrgForMembers(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Gestionar Miembros</DialogTitle>
            <DialogDescription>Administra los miembros de esta organización</DialogDescription>
          </DialogHeader>
          {selectedOrgForMembers && (
            <OrganizationMembersManager organizationId={selectedOrgForMembers} isOwner={isAdmin} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Organizations;
