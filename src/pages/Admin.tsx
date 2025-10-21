import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Users, FileText, List, ClipboardCheck, Shield, Palette } from "lucide-react";
import { UserRoleManager } from "@/components/admin/UserRoleManager";
import { DomainManager } from "@/components/admin/DomainManager";
import { ControlManager } from "@/components/admin/ControlManager";
import ImprovementPlanManager from "@/components/admin/ImprovementPlanManager";
import ContactSettingsManager from "@/components/admin/ContactSettingsManager";
import { ThemeSettingsManager } from "@/components/admin/ThemeSettingsManager";

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userRole, setUserRole] = useState<"admin" | "moderator" | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/auth");
        return;
      }

      // Check if user is admin
      const { data: isAdmin, error: adminError } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "admin",
      });

      if (adminError) throw adminError;

      // Check if user is moderator
      const { data: isModerator, error: moderatorError } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "moderator",
      });

      if (moderatorError) throw moderatorError;

      if (!isAdmin && !isModerator) {
        toast({
          title: "Acceso denegado",
          description: "No tienes permisos de administrador o moderador",
          variant: "destructive",
        });
        navigate("/dashboard");
        return;
      }

      setUserRole(isAdmin ? "admin" : "moderator");
    } catch (error) {
      console.error("Error checking admin access:", error);
      toast({
        title: "Error",
        description: "Error al verificar permisos",
        variant: "destructive",
      });
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  if (!userRole) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Panel de {userRole === "admin" ? "Administración" : "Moderación"}</h1>
              <p className="text-sm text-muted-foreground">
                {userRole === "admin" ? "Acceso completo al sistema" : "Acceso a funciones de gestión y moderación"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full">
            <Shield className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium capitalize">{userRole}</span>
          </div>
        </div>

        <Card className="p-6">
          <Tabs defaultValue="domains" className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              {/* Solo Admin puede ver Usuarios y Roles */}
              {userRole === "admin" && (
                <TabsTrigger value="users">
                  <Users className="h-4 w-4 mr-2" />
                  Usuarios y Roles
                </TabsTrigger>
              )}

              {/* Ambos roles pueden ver Dominios */}
              <TabsTrigger value="domains">
                <FileText className="h-4 w-4 mr-2" />
                Dominios
              </TabsTrigger>

              {/* Ambos roles pueden ver Controles */}
              <TabsTrigger value="controls">
                <List className="h-4 w-4 mr-2" />
                Controles
              </TabsTrigger>

              {/* Ambos roles pueden ver Planes de Mejora */}
              <TabsTrigger value="plans">
                <ClipboardCheck className="h-4 w-4 mr-2" />
                Planes de Mejora
              </TabsTrigger>

              {/* Solo Admin puede ver Configuración de Contacto */}
              {userRole === "admin" && (
                <TabsTrigger value="contact">
                  <Shield className="h-4 w-4 mr-2" />
                  Contacto
                </TabsTrigger>
              )}

              {/* Solo Admin puede ver Personalización de Tema */}
              {userRole === "admin" && (
                <TabsTrigger value="theme">
                  <Palette className="h-4 w-4 mr-2" />
                  Colores
                </TabsTrigger>
              )}
            </TabsList>

            {userRole === "admin" && (
              <TabsContent value="users" className="mt-6">
                <UserRoleManager />
              </TabsContent>
            )}

            {/* Dominios visible para ambos roles */}
            <TabsContent value="domains" className="mt-6">
              <DomainManager />
            </TabsContent>

            {/* Controles visible para ambos roles */}
            <TabsContent value="controls" className="mt-6">
              <ControlManager />
            </TabsContent>

            {/* Planes de Mejora visible para ambos roles */}
            <TabsContent value="plans" className="mt-6">
              <ImprovementPlanManager />
            </TabsContent>

            {/* Configuración de Contacto solo para Admin */}
            {userRole === "admin" && (
              <TabsContent value="contact" className="mt-6">
                <ContactSettingsManager />
              </TabsContent>
            )}

            {/* Personalización de Tema solo para Admin */}
            {userRole === "admin" && (
              <TabsContent value="theme" className="mt-6">
                <ThemeSettingsManager />
              </TabsContent>
            )}
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default Admin;
