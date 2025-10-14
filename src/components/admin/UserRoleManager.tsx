import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Shield, ShieldOff } from "lucide-react";

interface Profile {
  id: string;
  name: string;
  email: string;
}

interface UserRole {
  user_id: string;
  role: 'admin' | 'user';
}

export const UserRoleManager = () => {
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

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

  const isAdmin = (userId: string) => {
    return userRoles.some(role => role.user_id === userId && role.role === 'admin');
  };

  const toggleAdminRole = async (userId: string) => {
    try {
      const currentlyAdmin = isAdmin(userId);

      if (currentlyAdmin) {
        // Remove admin role
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', 'admin');

        if (error) throw error;

        toast({
          title: "Rol actualizado",
          description: "Se han removido los permisos de administrador"
        });
      } else {
        // Add admin role
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: 'admin' });

        if (error) throw error;

        toast({
          title: "Rol actualizado",
          description: "Se han otorgado permisos de administrador"
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
                  {isAdmin(profile.id) ? (
                    <span className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
                      <Shield className="h-4 w-4" />
                      Administrador
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2 bg-muted px-3 py-1 rounded-full text-sm">
                      Usuario
                    </span>
                  )}
                </td>
                <td className="p-4">
                  <Button
                    variant={isAdmin(profile.id) ? "destructive" : "default"}
                    size="sm"
                    onClick={() => toggleAdminRole(profile.id)}
                  >
                    {isAdmin(profile.id) ? (
                      <>
                        <ShieldOff className="h-4 w-4 mr-2" />
                        Remover Admin
                      </>
                    ) : (
                      <>
                        <Shield className="h-4 w-4 mr-2" />
                        Hacer Admin
                      </>
                    )}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};