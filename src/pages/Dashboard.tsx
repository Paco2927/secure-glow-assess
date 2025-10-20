import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, LogOut, ArrowRight, Users, FileText, Building2, User } from "lucide-react";
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
import heroImage from "@/assets/hero-security.jpg";
import techSecureIcon from "@/assets/techsecure_ai.png";
import NistIcon from "@/assets/NistShiel.png";
import IsoIcon from "@/assets/IsoIcon.png";

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
        navigate("/");
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
    navigate("/");
  };

  if (!user) return null;

  return (
    <div className="min-h-screen gradient-subtle">
      {/* Header */}
      <header className="bg-card border-b shadow-soft">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full gradient-hero flex items-center justify-center">
              <img src={techSecureIcon} alt="TechSecureIA" className="w-4.5 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">TechSecureIA</h1>
              <p className="text-xs text-muted-foreground">Cybersecurity Assessment</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {isAdmin && (
              <Button variant="secondary" size="sm" onClick={() => navigate("/admin")}>
                <Shield className="w-4 h-4 mr-2" />
                Admin
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
        <div className="absolute inset-0 opacity-20 flex items-center justify-center">
          <img
            src="https://techsecureai.com/wp-content/uploads/2025/06/WhatsApp_Image_2025-06-05_at_3.01.53_PM-removebg-preview.png"
            alt="Imagen a mostrar"
            width="250"
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
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {isAdmin && (
              <Card
                className="p-6 cursor-pointer hover:shadow-lg transition-shadow shadow-medium border-primary/20"
                onClick={() => navigate("/assessment/iso27001")}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full gradient-hero flex items-center justify-center">
                    <img src={IsoIcon} alt="IsoIcon" className="w-11 h-11" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold">ISO 27001</h2>
                    <p className="text-sm text-muted-foreground">Seguridad de la Información</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-primary" />
                </div>
              </Card>
            )}
            <Card
              className="p-6 cursor-pointer hover:shadow-lg transition-shadow shadow-medium border-secondary/20"
              onClick={() => navigate("/assessment/nist")}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center">
                  <img src={NistIcon} alt="NistIcon" className="w-10 h-10" />
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
              onClick={() => navigate("/organizations")}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-accent" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold">Organizaciones</h2>
                  <p className="text-sm text-muted-foreground">Gestionar empresas</p>
                </div>
                <ArrowRight className="w-5 h-5 text-accent" />
              </div>
            </Card>

            <Card
              className="p-6 cursor-pointer hover:shadow-lg transition-shadow shadow-medium border-muted/40"
              onClick={() => navigate("/reportes")}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-muted/40 flex items-center justify-center">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold">Mis Reportes</h2>
                  <p className="text-sm text-muted-foreground">Ver evaluaciones anteriores</p>
                </div>
                <ArrowRight className="w-5 h-5" />
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
