import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Shield, ShieldOff, Trash2 } from "lucide-react";
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
import { useAdminRole } from "@/hooks/useAdminRole";

interface Profile {
  id: string;
  name: string;
  email: string;
}

interface UserRole {
  user_id: string;
  role: 'admin' | 'user' | 'moderator';
}

export const UserRoleManager = () => {
  const { toast } = useToast();
  const { isAdmin: isCurrentUserAdmin } = useAdminRole();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  };

  const fetchData = async () => {
    try {
      // Fetch all profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at');

      if (profilesError) throw profilesError;

      // Fetch all user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      setProfiles(profilesData || []);
      setUserRoles(rolesData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los usuarios",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const isModerator = (userId: string) => {
    return userRoles.some(role => role.user_id === userId && role.role === 'moderator');
  };

  const isAdmin = (userId: string) => {
    return userRoles.some(role => role.user_id === userId && role.role === 'admin');
  };

  const toggleModeratorRole = async (userId: string) => {
    try {
      const currentlyModerator = isModerator(userId);

      if (currentlyModerator) {
        // Remove moderator role
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', 'moderator');

        if (error) throw error;

        toast({
          title: "Rol actualizado",
          description: "Se han removido los permisos de moderador"
        });
      } else {
        // Add moderator role
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: 'moderator' });

        if (error) throw error;

        toast({
          title: "Rol actualizado",
          description: "Se han otorgado permisos de moderador"
        });
      }

      fetchData();
    } catch (error: any) {
      console.error("Error updating role:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el rol",
        variant: "destructive"
      });
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteUserId) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Error",
          description: "No hay sesión activa",
          variant: "destructive"
        });
        return;
      }

      const response = await fetch(
        'https://cqpfwdxfmemwegkrxkre.supabase.co/functions/v1/delete-user',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ userId: deleteUserId }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al eliminar usuario');
      }

      toast({
        title: "Usuario eliminado",
        description: "El usuario ha sido eliminado exitosamente"
      });

      fetchData();
    } catch (error: any) {
      console.error("Error deleting user:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el usuario",
        variant: "destructive"
      });
    } finally {
      setDeleteUserId(null);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Cargando usuarios...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Gestión de Usuarios y Roles</h2>
      </div>

      <div className="border rounded-lg">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-4">Nombre</th>
              <th className="text-left p-4">Email</th>
              <th className="text-left p-4">Rol</th>
              <th className="text-left p-4">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((profile) => (
              <tr key={profile.id} className="border-b last:border-0">
                <td className="p-4">{profile.name}</td>
                <td className="p-4">{profile.email}</td>
                <td className="p-4">
                  <div className="flex gap-2">
                    {isAdmin(profile.id) && (
                      <span className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
                        <Shield className="h-4 w-4" />
                        Administrador
                      </span>
                    )}
                    {isModerator(profile.id) && (
                      <span className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full text-sm">
                        <Shield className="h-4 w-4" />
                        Moderador
                      </span>
                    )}
                    {!isAdmin(profile.id) && !isModerator(profile.id) && (
                      <span className="inline-flex items-center gap-2 bg-muted px-3 py-1 rounded-full text-sm">
                        Usuario
                      </span>
                    )}
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex gap-2">
                    {!isAdmin(profile.id) && (
                      <Button
                        variant={isModerator(profile.id) ? "destructive" : "default"}
                        size="sm"
                        onClick={() => toggleModeratorRole(profile.id)}
                      >
                        {isModerator(profile.id) ? (
                          <>
                            <ShieldOff className="h-4 w-4 mr-2" />
                            Remover Moderador
                          </>
                        ) : (
                          <>
                            <Shield className="h-4 w-4 mr-2" />
                            Hacer Moderador
                          </>
                        )}
                      </Button>
                    )}
                    {isCurrentUserAdmin && profile.id !== currentUserId && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDeleteUserId(profile.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Eliminar
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AlertDialog open={!!deleteUserId} onOpenChange={() => setDeleteUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará el usuario permanentemente junto con todos sus datos asociados (roles, evaluaciones, organizaciones, etc.).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
