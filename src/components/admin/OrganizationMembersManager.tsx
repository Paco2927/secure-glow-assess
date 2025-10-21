import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, Trash2, Mail, User } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Member {
  id: string;
  user_id: string;
  organization_role: string | null;
  status: string;
  profiles: {
    name: string;
    email: string;
  };
}

interface OrganizationMembersManagerProps {
  organizationId: string;
  isOwner: boolean;
}

export const OrganizationMembersManager = ({ organizationId, isOwner }: OrganizationMembersManagerProps) => {
  const { toast } = useToast();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [editRole, setEditRole] = useState("");

  useEffect(() => {
    loadMembers();
  }, [organizationId]);

  const loadMembers = async () => {
    try {
      const { data, error } = await supabase
        .from("organization_members")
        .select(
          `
          id,
          user_id,
          organization_role,
          status,
          profiles!organization_members_user_id_fkey(name, email)
        `,
        )
        .eq("organization_id", organizationId);

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error("Error loading members:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los miembros",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInviteMember = async () => {
    if (!inviteEmail) return;

    try {
      // Check if user exists
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", inviteEmail)
        .maybeSingle();

      if (profileError) throw profileError;

      if (!profileData) {
        toast({
          title: "Usuario no encontrado",
          description: "No existe un usuario con ese correo electrónico",
          variant: "destructive",
        });
        return;
      }

      // Add member to organization
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { error } = await supabase.from("organization_members").insert({
        organization_id: organizationId,
        user_id: profileData.id,
        invited_by: user?.id,
        status: "accepted",
      });

      if (error) throw error;

      toast({
        title: "Miembro agregado",
        description: "El usuario ha sido agregado a la organización",
      });

      setShowInviteDialog(false);
      setInviteEmail("");
      loadMembers();
    } catch (error: any) {
      console.error("Error inviting member:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo agregar el miembro",
        variant: "destructive",
      });
    }
  };

  const handleUpdateRole = async () => {
    if (!editingMember) return;

    try {
      const { error } = await supabase
        .from("organization_members")
        .update({ organization_role: editRole })
        .eq("id", editingMember.id);

      if (error) throw error;

      toast({
        title: "Rol actualizado",
        description: "El rol del miembro ha sido actualizado",
      });

      setEditingMember(null);
      setEditRole("");
      loadMembers();
    } catch (error) {
      console.error("Error updating role:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el rol",
        variant: "destructive",
      });
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      const { error } = await supabase.from("organization_members").delete().eq("id", memberId);

      if (error) throw error;

      toast({
        title: "Miembro eliminado",
        description: "El miembro ha sido eliminado de la organización",
      });

      loadMembers();
    } catch (error) {
      console.error("Error removing member:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el miembro",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="text-center py-4">Cargando miembros...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Miembros de la Organización
          </span>
          {isOwner && (
            <Button onClick={() => setShowInviteDialog(true)} size="sm">
              <UserPlus className="h-4 w-4 mr-2" />
              Invitar Miembro
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {members.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No hay miembros en esta organización</p>
          ) : (
            members.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{member.profiles.name}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{member.profiles.email}</p>
                  {member.organization_role && (
                    <p className="text-sm text-primary mt-1">Rol: {member.organization_role}</p>
                  )}
                </div>
                {isOwner && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingMember(member);
                        setEditRole(member.organization_role || "");
                      }}
                    >
                      Asignar puesto
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleRemoveMember(member.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>

      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invitar Miembro</DialogTitle>
            <DialogDescription>
              Ingresa el correo electrónico del usuario que deseas agregar a la organización
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="usuario@ejemplo.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleInviteMember}>Agregar Miembro</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingMember} onOpenChange={() => setEditingMember(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Asignar Puesto</DialogTitle>
            <DialogDescription>Define el puesto de {editingMember?.profiles.name} en la organización</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="role">Puesto (ej: Gerente de Administración)</Label>
              <Input
                id="role"
                placeholder="Escribe el rol..."
                value={editRole}
                onChange={(e) => setEditRole(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingMember(null)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateRole}>Guardar Rol</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
