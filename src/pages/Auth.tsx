import { useState, useEffect } from "react";
import ParticlesBackground from "@/components/ParticlesBackground";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock, ArrowLeft, Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { z } from "zod";
import { useThemeSettings } from "@/hooks/useThemeSettings";
import orionAuditLogo from "@/assets/orionaudit-logo.png";

// Schema for login (only validates format, not complexity — complexity is enforced at sign-up)
const loginSchema = z.object({
  email: z.string().trim().email({ message: "Correo electrónico inválido" }),
  password: z.string().min(1, { message: "Ingresa tu contraseña" }),
});

const REMEMBER_KEY = "orionaudit:rememberedEmail";

const Auth = () => {
  const navigate = useNavigate();
  const { companyName } = useThemeSettings();
  const [isLoading, setIsLoading] = useState(false);
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        navigate("/dashboard");
      }
    };
    checkUser();
    // Restore remembered email
    const remembered = localStorage.getItem(REMEMBER_KEY);
    if (remembered) {
      setLoginData((prev) => ({ ...prev, email: remembered }));
      setRememberMe(true);
    }
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const validatedData = loginSchema.parse(loginData);

      const { error } = await supabase.auth.signInWithPassword({
        email: validatedData.email,
        password: validatedData.password,
      });

      if (error) {
        const friendly = error.message.includes("Invalid login credentials")
          ? "Credenciales incorrectas. Verifica tu correo y contraseña."
          : error.message.includes("Email not confirmed")
          ? "Tu correo aún no ha sido confirmado."
          : error.message;
        setErrorMessage(friendly);
        return;
      }

      // Persist or clear remembered email
      if (rememberMe) {
        localStorage.setItem(REMEMBER_KEY, validatedData.email);
      } else {
        localStorage.removeItem(REMEMBER_KEY);
      }

      toast({
        title: "¡Bienvenido!",
        description: "Has iniciado sesión exitosamente.",
      });
      navigate("/dashboard");
    } catch (error) {
      if (error instanceof z.ZodError) {
        setErrorMessage(error.errors[0].message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyEvent = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (typeof e.getModifierState === "function") {
      setCapsLockOn(e.getModifierState("CapsLock"));
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
          <h1 className="text-3xl font-bold mb-2">{companyName || "OrionAudit"}</h1>
          <p className="text-xs text-muted-foreground -mt-1 mb-1">by TechSecureIA</p>
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
              {errorMessage && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="login-email">Correo Electrónico</Label>
                <Input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  autoFocus
                  placeholder="tu@email.com"
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  disabled={isLoading}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Contraseña</Label>
                <div className="relative">
                  <Input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    onKeyDown={handleKeyEvent}
                    onKeyUp={handleKeyEvent}
                    disabled={isLoading}
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
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                {capsLockOn && (
                  <p className="text-xs text-amber-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Bloq Mayús está activado
                  </p>
                )}
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                  <Checkbox
                    checked={rememberMe}
                    onCheckedChange={(v) => setRememberMe(v === true)}
                    disabled={isLoading}
                  />
                  Recordarme
                </label>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Iniciando sesión...
                  </>
                ) : (
                  "Iniciar Sesión"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
