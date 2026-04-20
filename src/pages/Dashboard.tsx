import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Shield,
  LogOut,
  ArrowRight,
  Users,
  FileText,
  Building2,
  User,
  AlertTriangle,
  ClipboardList,
  BarChart3,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useThemeSettings } from "@/hooks/useThemeSettings";
import { useAuthReady } from "@/hooks/useAuthReady";
import heroImage from "@/assets/hero-security.jpg";
import techSecureIcon from "@/assets/techsecure_ai.png";
import NistIcon from "@/assets/NistShiel.png";
import IsoIcon from "@/assets/IsoIcon.png";

const Dashboard = () => {
  const navigate = useNavigate();
  const { logoUrl, dashboardBackgroundUrl, backgroundFit, companyName } = useThemeSettings();
  const { user, isReady: isAuthReady } = useAuthReady();
  const [profile, setProfile] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuditor, setIsAuditor] = useState(false);
  const [isDashboardLoading, setIsDashboardLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const clearDashboardState = () => {
      setProfile(null);
      setIsAdmin(false);
      setIsAuditor(false);
      setIsDashboardLoading(false);
    };

    const loadDashboardData = async () => {
      if (!isAuthReady) return;

      if (!user) {
        clearDashboardState();
        return;
      }

      setIsDashboardLoading(true);

      try {
        const [profileResponse, adminResponse, auditorResponse] = await Promise.all([
          supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
          supabase.rpc("has_role", {
            _user_id: user.id,
            _role: "admin",
          }),
          supabase.rpc("has_role", {
            _user_id: user.id,
            _role: "auditor",
          }),
        ]);

        if (cancelled) return;

        setProfile(profileResponse.data ?? null);
        setIsAdmin(Boolean(adminResponse.data));
        setIsAuditor(Boolean(auditorResponse.data));
      } catch (error) {
        if (cancelled) return;

        console.error("Error loading dashboard:", error);
        setProfile(null);
        setIsAdmin(false);
        setIsAuditor(false);
      } finally {
        if (!cancelled) {
          setIsDashboardLoading(false);
        }
      }
    };

    void loadDashboardData();

    return () => {
      cancelled = true;
    };
  }, [isAuthReady, user]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut({ scope: "local" });
    } catch (e) {
      console.error("signOut error", e);
    } finally {
      window.location.assign("/auth");
    }
    toast({
      title: "Sesión cerrada",
      description: "Has cerrado sesión exitosamente.",
    });
  };

  if (!isAuthReady || (user && isDashboardLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen gradient-subtle">
      {/* Header */}
      <header className="bg-card border-b shadow-soft">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full gradient-hero flex items-center justify-center">
              <img
                src={logoUrl || techSecureIcon}
                alt="Logo"
                className={logoUrl ? "w-10 h-10 object-contain" : "w-4.5 h-6"}
              />
            </div>
            <div>
              <h1 className="text-xl font-bold">{companyName}</h1>
              <p className="text-xs text-muted-foreground">Cybersecurity Assessment</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {(isAdmin || isAuditor) && (
              <Button variant="secondary" size="sm" onClick={() => navigate("/admin")}>
                <Shield className="w-4 h-4 mr-2" />
                {isAdmin ? "Admin" : "Auditor"}
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={profile?.avatar_url} alt={profile?.name} />
                    <AvatarFallback>
                      {profile?.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{profile?.name || "Usuario"}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    {(isAdmin || isAuditor) && (
                      <p className="text-xs leading-none text-primary">{isAdmin ? "Administrador" : "Auditor"}</p>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/profile")}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Mi Perfil</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Cerrar Sesión</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          {dashboardBackgroundUrl && (
            <img
              src={dashboardBackgroundUrl}
              alt="Imagen a mostrar"
              className="w-full h-full"
              style={{ objectFit: backgroundFit as any }}
            />
          )}
        </div>
        <div className="relative container mx-auto px-4 py-20 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Evalúa tu Madurez de <span className="text-primary">Ciberseguridad</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Realiza evaluaciones completas basadas en los estándares ISO 27001 y NIST Cybersecurity Framework
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Evaluaciones principales - ISO 27001 y NIST CSF */}
          {(isAdmin || isAuditor) && (
            <div className="grid md:grid-cols-2 gap-6 mb-12">
              {/* ISO 27001 */}
              <Card
                className="cursor-pointer hover:shadow-xl transition-all shadow-strong border-primary/20"
                onClick={() => navigate("/assessment/iso27001")}
              >
                <CardContent className="pt-8 pb-8 flex flex-col items-center text-center">
                  <div className="w-32 h-32 rounded-full gradient-hero flex items-center justify-center mb-6">
                    <img src={IsoIcon} alt="ISO 27001" className="w-28 h-28" />
                  </div>
                  <CardTitle className="text-3xl mb-2">EVALUACIÓN ISO 27001</CardTitle>
                  <CardDescription className="text-base">Gestión de Seguridad de la Información</CardDescription>
                </CardContent>
              </Card>

              {/* NIST CSF */}
              <Card
                className="cursor-pointer hover:shadow-xl transition-all shadow-strong border-secondary/20"
                onClick={() => navigate("/assessment/nist")}
              >
                <CardContent className="pt-8 pb-8 flex flex-col items-center text-center">
                  <div className="w-32 h-32 rounded-full bg-secondary/20 flex items-center justify-center mb-6">
                    <img src={NistIcon} alt="NIST CSF" className="w-28 h-28" />
                  </div>
                  <CardTitle className="text-3xl mb-2">EVALUACIÓN NIST CSF</CardTitle>
                  <CardDescription className="text-base">Cybersecurity Framework</CardDescription>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Otras opciones del dashboard */}
          <div className="space-y-6">
            <h3 className="text-2xl font-bold">
              {isAdmin || isAuditor ? "Herramientas Adicionales" : "Herramientas"}
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Organizaciones - Para todos los usuarios */}
              <Card
                className="p-6 cursor-pointer hover:shadow-lg transition-shadow shadow-medium border-accent/20"
                onClick={() => navigate("/organizations")}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-accent" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold">Organizaciones</h2>
                    <p className="text-sm text-muted-foreground">Ver empresa y miembros</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-accent" />
                </div>
              </Card>

              {/* Matriz de Riesgos - Para todos los usuarios */}
              <Card
                className="p-6 cursor-pointer hover:shadow-lg transition-shadow shadow-medium border-destructive/20"
                onClick={() => navigate("/risk-matrix?from=dashboard")}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-destructive" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold">Matriz de Riesgos</h2>
                    <p className="text-sm text-muted-foreground">Controle sus riesgos</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-destructive" />
                </div>
              </Card>

              {/* Planes de Mejora - Para admin y auditor */}
              {(isAdmin || isAuditor) && (
                <Card
                  className="p-6 cursor-pointer hover:shadow-lg transition-shadow shadow-medium border-primary/20"
                  onClick={() => navigate("/improvement-plans")}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                      <ClipboardList className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl font-bold">Planes de Mejora</h2>
                      <p className="text-sm text-muted-foreground">Gestionar acciones de mejora</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-primary" />
                  </div>
                </Card>
              )}

              {/* KPIs - Indicadores de Gestión */}
              <Card
                className="p-6 cursor-pointer hover:shadow-lg transition-shadow shadow-medium border-amber-500/20"
                onClick={() => navigate("/kpis")}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold">Indicadores de Gestión</h2>
                    <p className="text-sm text-muted-foreground">KPIs de cumplimiento y riesgos</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-amber-600" />
                </div>
              </Card>

              {/* Mis Reportes - Para todos los usuarios */}
              <Card
                className="p-6 cursor-pointer hover:shadow-lg transition-shadow shadow-medium border-muted/40"
                onClick={() => navigate("/reportes")}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-muted/40 flex items-center justify-center">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold">Ver evaluaciones</h2>
                    <p className="text-sm text-muted-foreground">Ver evaluaciones anteriores y en progreso</p>
                  </div>
                  <ArrowRight className="w-5 h-5" />
                </div>
              </Card>
            </div>
          </div>

          {/* Additional Features */}
          <div className="mt-12">
            <Card className="shadow-medium">
              <CardHeader>
                <CardTitle>Funcionalidades Disponibles</CardTitle>
                <CardDescription>
                  {isAdmin && "Tienes acceso completo a todas las herramientas de administración."}
                  {isAuditor &&
                    !isAdmin &&
                    "Tienes acceso a herramientas de auditoría y evaluación NIST e ISO27001."}
                  {!isAdmin && !isAuditor && "Accede a organizaciones, matriz de riesgos y reportes."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Accede a todas las herramientas de evaluación y consulta tus reportes históricos.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
