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
  const [isAdmin, setIsAdmin] = useState(false);
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
      const { data: hasAdminRole, error: adminError } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "admin",
      });

      if (adminError) throw adminError;

      if (!hasAdminRole) {
        toast({
          title: "Acceso denegado",
          description: "No tienes permisos de administrador",
          variant: "destructive",
        });
        navigate("/dashboard");
        return;
      }

      setIsAdmin(true);
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

  if (!isAdmin) {
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
              <h1 className="text-3xl font-bold">Panel de Administración</h1>
              <p className="text-sm text-muted-foreground">
                Acceso completo al sistema
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full">
            <Shield className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium capitalize">Admin</span>
          </div>
        </div>

        <Card className="p-6">
          <Tabs defaultValue="users" className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="users">
                <Users className="h-4 w-4 mr-2" />
                Usuarios y Roles
              </TabsTrigger>

              <TabsTrigger value="domains">
                <FileText className="h-4 w-4 mr-2" />
                Dominios
              </TabsTrigger>

              <TabsTrigger value="controls">
                <List className="h-4 w-4 mr-2" />
                Controles
              </TabsTrigger>

              <TabsTrigger value="plans">
                <ClipboardCheck className="h-4 w-4 mr-2" />
                Planes de Mejora
              </TabsTrigger>

              <TabsTrigger value="contact">
                <Shield className="h-4 w-4 mr-2" />
                Contacto
              </TabsTrigger>

              <TabsTrigger value="theme">
                <Palette className="h-4 w-4 mr-2" />
                Personalización
              </TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="mt-6">
              <UserRoleManager />
            </TabsContent>

            <TabsContent value="domains" className="mt-6">
              <DomainManager />
            </TabsContent>

            <TabsContent value="controls" className="mt-6">
              <ControlManager />
            </TabsContent>

            <TabsContent value="plans" className="mt-6">
              <ImprovementPlanManager />
            </TabsContent>

            <TabsContent value="contact" className="mt-6">
              <ContactSettingsManager />
            </TabsContent>

            <TabsContent value="theme" className="mt-6">
              <ThemeSettingsManager />
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default Admin;
