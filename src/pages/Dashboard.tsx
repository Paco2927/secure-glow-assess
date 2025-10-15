import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, LogOut, ArrowRight, Users, FileText } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import heroImage from "@/assets/hero-security.jpg";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

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

      // Check admin status
      const { data: adminCheck } = await supabase.rpc("has_role", {
        _user_id: session.user.id,
        _role: "admin",
      });
      setIsAdmin(adminCheck || false);
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
            {isAdmin && (
              <Button variant="secondary" size="sm" onClick={() => navigate("/admin")}>
                <Shield className="w-4 h-4 mr-2" />
                Admin
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 flex items-center justify-center">
          <img
            src="https://techsecureai.com/wp-content/uploads/2025/06/WhatsApp_Image_2025-06-05_at_3.01.53_PM-removebg-preview.png"
            alt="Imagen a mostrar"
            width="300"
            height="200"
          />
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
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card
              className="p-6 cursor-pointer hover:shadow-lg transition-shadow shadow-medium border-primary/20"
              onClick={() => navigate("/assessment/iso27001")}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full gradient-hero flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold">ISO 27001</h2>
                  <p className="text-sm text-muted-foreground">Seguridad de la Información</p>
                </div>
                <ArrowRight className="w-5 h-5 text-primary" />
              </div>
            </Card>

            <Card
              className="p-6 cursor-pointer hover:shadow-lg transition-shadow shadow-medium border-secondary/20"
              onClick={() => navigate("/assessment/nist")}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-secondary" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold">NIST CSF</h2>
                  <p className="text-sm text-muted-foreground">Cybersecurity Framework</p>
                </div>
                <ArrowRight className="w-5 h-5 text-secondary" />
              </div>
            </Card>

            <Card
              className="p-6 cursor-pointer hover:shadow-lg transition-shadow shadow-medium border-accent/20"
              onClick={() => navigate("/reportes")}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-accent" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold">Mis Reportes</h2>
                  <p className="text-sm text-muted-foreground">Ver evaluaciones anteriores</p>
                </div>
                <ArrowRight className="w-5 h-5 text-accent" />
              </div>
            </Card>
          </div>

          {/* Additional Features */}
          <div className="mt-12">
            <Card className="shadow-medium">
              <CardHeader>
                <CardTitle>Funcionalidades Disponibles</CardTitle>
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
