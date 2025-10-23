import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, Trash2, Mail, User, Search } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
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

interface AvailableUser {
  id: string;
  name: string;
  email: string;
  dni: string | null;
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
  const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [editRole, setEditRole] = useState("");
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);

  useEffect(() => {
    loadMembers();
  }, [organizationId]);

  useEffect(() => {
    if (showInviteDialog) {
      loadAvailableUsers();
    }
  }, [showInviteDialog, organizationId]);

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

  const loadAvailableUsers = async () => {
    try {
      const { data: allProfiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, name, email, dni");

      if (profilesError) throw profilesError;

      // Filter out users who are already members
      const memberIds = members.map((m) => m.user_id);
      const available = (allProfiles || []).filter((profile) => !memberIds.includes(profile.id));

      setAvailableUsers(available);
    } catch (error) {
      console.error("Error loading available users:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los usuarios disponibles",
        variant: "destructive",
      });
    }
  };

  const handleInviteMember = async () => {
    if (!selectedUserId) {
      toast({
        title: "Error",
        description: "Por favor selecciona un usuario",
        variant: "destructive",
      });
      return;
    }

    try {
      // Add member to organization
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { error } = await supabase.from("organization_members").insert({
        organization_id: organizationId,
        user_id: selectedUserId,
        invited_by: user?.id,
        status: "accepted",
      });

      if (error) throw error;

      toast({
        title: "Miembro agregado",
        description: "El usuario ha sido agregado a la organización",
      });

      setShowInviteDialog(false);
      setSelectedUserId(null);
      setSearchQuery("");
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
        title: "Puesto actualizado",
        description: "El puesto del miembro ha sido actualizado",
      });

      setEditingMember(null);
      setEditRole("");
      loadMembers();
    } catch (error) {
      console.error("Error updating role:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el puesto",
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
                    <p className="text-sm text-primary mt-1">Puesto: {member.organization_role}</p>
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
                    <Button variant="destructive" size="sm" onClick={() => setMemberToDelete(member)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>

      <Dialog open={showInviteDialog} onOpenChange={(open) => {
        setShowInviteDialog(open);
        if (!open) {
          setSelectedUserId(null);
          setSearchQuery("");
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Invitar Miembro</DialogTitle>
            <DialogDescription>
              Busca y selecciona el usuario que deseas agregar a la organización
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar por correo o cédula</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Buscar usuario..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Usuarios disponibles ({availableUsers.filter((user) => {
                const query = searchQuery.toLowerCase();
                return (
                  user.email.toLowerCase().includes(query) ||
                  user.name.toLowerCase().includes(query) ||
                  (user.dni && user.dni.toLowerCase().includes(query))
                );
              }).length})</Label>
              <ScrollArea className="h-[300px] border rounded-md">
                <div className="p-2 space-y-2">
                  {availableUsers
                    .filter((user) => {
                      const query = searchQuery.toLowerCase();
                      return (
                        user.email.toLowerCase().includes(query) ||
                        user.name.toLowerCase().includes(query) ||
                        (user.dni && user.dni.toLowerCase().includes(query))
                      );
                    })
                    .map((user) => (
                      <button
                        key={user.id}
                        onClick={() => setSelectedUserId(user.id)}
                        className={`w-full text-left p-3 rounded-lg border transition-colors ${
                          selectedUserId === user.id
                            ? "bg-primary/10 border-primary"
                            : "bg-background hover:bg-muted/50 border-border"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{user.name}</div>
                            <div className="text-sm text-muted-foreground truncate flex items-center gap-1">
                              <Mail className="h-3 w-3 flex-shrink-0" />
                              {user.email}
                            </div>
                            {user.dni && (
                              <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                <span className="font-medium">Cédula:</span>
                                <span>{user.dni}</span>
                                <span className="text-[10px] text-muted-foreground/70">({user.name})</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  {availableUsers.filter((user) => {
                    const query = searchQuery.toLowerCase();
                    return (
                      user.email.toLowerCase().includes(query) ||
                      user.name.toLowerCase().includes(query) ||
                      (user.dni && user.dni.toLowerCase().includes(query))
                    );
                  }).length === 0 && (
                    <div className="text-center text-sm text-muted-foreground py-8">
                      {searchQuery ? "No se encontraron usuarios con ese criterio" : "No hay usuarios disponibles"}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleInviteMember} disabled={!selectedUserId}>
              Agregar Miembro
            </Button>
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
                placeholder="Escribe el puesto..."
                value={editRole}
                onChange={(e) => setEditRole(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingMember(null)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateRole}>Guardar puesto</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!memberToDelete} onOpenChange={() => setMemberToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará a {memberToDelete?.profiles.name} de la organización. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (memberToDelete) {
                  handleRemoveMember(memberToDelete.id);
                  setMemberToDelete(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};
