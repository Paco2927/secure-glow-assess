import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, FileCheck, BarChart3, LogOut, ClipboardList } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import heroImage from "@/assets/hero-security.jpg";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);

      // Fetch user profile
      const { data: profileData } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();

      setProfile(profileData);
    };

    checkUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        navigate("/auth");
      }
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Sesión cerrada",
      description: "Has cerrado sesión exitosamente.",
    });
    navigate("/auth");
  };

  if (!user) return null;

  return (
    <div className="min-h-screen gradient-subtle">
      {/* Header */}
      <header className="bg-card border-b shadow-soft">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full gradient-hero flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">TechSecureIA</h1>
              <p className="text-xs text-muted-foreground">Cybersecurity Assessment</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">{profile?.name || user.email}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <img src={heroImage} alt="Cybersecurity" className="w-full h-full object-cover" />
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
        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {/* ISO 27001 Card */}
          <Card
            className="shadow-medium hover:shadow-strong transition-smooth hover:scale-105 cursor-pointer gradient-card"
            onClick={() => navigate("/assessment/iso27001")}
          >
            <CardHeader>
              <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <FileCheck className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">ISO 27001</CardTitle>
              <CardDescription className="text-base">Evaluación de Seguridad de la Información</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Evalúa el nivel de madurez de tu organización según los controles de ISO/IEC 27001:2022
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Políticas de Seguridad</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Organización de la Seguridad</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Gestión de Activos y Control de Acceso</span>
                </li>
              </ul>
              <Button variant="hero" className="w-full mt-6">
                Comenzar Evaluación ISO 27001
              </Button>
            </CardContent>
          </Card>

          {/* NIST Card */}
          <Card
            className="shadow-medium hover:shadow-strong transition-smooth hover:scale-105 cursor-pointer gradient-card"
            onClick={() => navigate("/assessment/nist")}
          >
            <CardHeader>
              <div className="w-16 h-16 rounded-lg bg-secondary/20 flex items-center justify-center mb-4">
                <BarChart3 className="w-8 h-8 text-secondary" />
              </div>
              <CardTitle className="text-2xl">NIST CSF</CardTitle>
              <CardDescription className="text-base">Cybersecurity Framework</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Evalúa tu organización según el Marco de Ciberseguridad del NIST
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-secondary">•</span>
                  <span>Identificar, Proteger, Detectar</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-secondary">•</span>
                  <span>Responder y Recuperar</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-secondary">•</span>
                  <span>Gestión Integral de Riesgos</span>
                </li>
              </ul>
              <Button variant="secondary" className="w-full mt-6">
                Comenzar Evaluación NIST
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Additional Features */}
        <div className="mt-12 max-w-5xl mx-auto">
          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-primary" />
                Próximamente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <BarChart3 className="w-8 h-8 mx-auto mb-2 text-primary" />
                  <h3 className="font-semibold mb-1">Reportes</h3>
                  <p className="text-xs text-muted-foreground">Dashboard de métricas</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <FileCheck className="w-8 h-8 mx-auto mb-2 text-primary" />
                  <h3 className="font-semibold mb-1">Historial</h3>
                  <p className="text-xs text-muted-foreground">Evaluaciones previas</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <Shield className="w-8 h-8 mx-auto mb-2 text-primary" />
                  <h3 className="font-semibold mb-1">Planes de Mejora</h3>
                  <p className="text-xs text-muted-foreground">Seguimiento de acciones</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
