import { useState, useEffect } from "react";
import ParticlesBackground from "@/components/ParticlesBackground";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { z } from "zod";
import { useThemeSettings } from "@/hooks/useThemeSettings";
import orionAuditLogo from "@/assets/orionaudit-logo.png";

// Schema for login (only email and password)
const loginSchema = z.object({
  email: z.string().trim().email({ message: "Correo electrónico inválido" }),
  password: z.string()
    .min(12, { message: "La contraseña debe tener al menos 12 caracteres" })
    .regex(/[A-Z]/, { message: "La contraseña debe incluir al menos una mayúscula" })
    .regex(/[a-z]/, { message: "La contraseña debe incluir al menos una minúscula" })
    .regex(/[0-9]/, { message: "La contraseña debe incluir al menos un número" })
    .regex(/[^A-Za-z0-9]/, { message: "La contraseña debe incluir al menos un símbolo" }),
});

const Auth = () => {
  const navigate = useNavigate();
  const { companyName } = useThemeSettings();
  const [isLoading, setIsLoading] = useState(false);
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        navigate("/dashboard");
      }
    };
    checkUser();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const validatedData = loginSchema.parse(loginData);

      const { error } = await supabase.auth.signInWithPassword({
        email: validatedData.email,
        password: validatedData.password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast({
            title: "Error de inicio de sesión",
            description: "Credenciales incorrectas. Verifica tu correo y contraseña.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
        }
        return;
      }

      toast({
        title: "¡Bienvenido!",
        description: "Has iniciado sesión exitosamente.",
      });
      navigate("/dashboard");
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Error de validación",
          description: error.errors[0].message,
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center gradient-subtle p-4 relative overflow-hidden">
      <ParticlesBackground />
      <Button
        variant="ghost"
        size="icon"
        onClick={() => navigate("/")}
        className="absolute top-4 left-4"
        aria-label="Volver al inicio"
      >
        <ArrowLeft className="w-5 h-5" />
      </Button>
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4 overflow-hidden">
            <img src={orionAuditLogo} alt="OrionAudit" className="w-16 h-16 object-contain" />
          </div>
          <h1 className="text-3xl font-bold mb-2">{companyName}</h1>
          <p className="text-muted-foreground">Evaluación de Ciberseguridad</p>
        </div>

        <Card className="shadow-strong">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              Iniciar Sesión
            </CardTitle>
            <CardDescription>Ingresa tus credenciales para acceder al sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Correo Electrónico</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="tu@email.com"
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Contraseña</Label>
                <div className="relative">
                  <Input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    required
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
