import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Lock, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { z } from "zod";

const authSchema = z.object({
  email: z.string().trim().email({ message: "Correo electrónico inválido" }),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres" }),
  name: z.string().trim().min(2, { message: "El nombre debe tener al menos 2 caracteres" }).optional(),
  dni: z.string().trim().optional(),
});

const Auth = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [signupData, setSignupData] = useState({ email: "", password: "", name: "", dni: "" });
  
  // DNI validation states
  const [isValidatingDni, setIsValidatingDni] = useState(false);
  const [dniValidationMessage, setDniValidationMessage] = useState("");
  const [isDniValidated, setIsDniValidated] = useState(false);
  const dniTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        navigate("/");
      }
    };
    checkUser();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const validatedData = authSchema.parse(loginData);

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

  const validateCedulaCR = useCallback(async (cedula: string) => {
    if (!cedula.trim()) {
      setDniValidationMessage("");
      setIsDniValidated(false);
      return;
    }

    setIsValidatingDni(true);
    setDniValidationMessage("");

    try {
      const { data, error } = await supabase.functions.invoke('validate-cedula-cr', {
        body: { cedula },
      });

      if (error) {
        console.error('Error calling validate-cedula-cr:', error);
        setDniValidationMessage("Error al validar cédula. Puedes ingresar el nombre manualmente.");
        setIsDniValidated(false);
        return;
      }

      if (data.success && data.name) {
        setSignupData(prev => ({ ...prev, name: data.name }));
        setDniValidationMessage(`✓ Nombre encontrado: ${data.name}`);
        setIsDniValidated(true);
      } else {
        setDniValidationMessage(data.error || "Cédula no encontrada. Ingresa tu nombre manualmente.");
        setIsDniValidated(false);
      }
    } catch (error) {
      console.error('Error validating cedula:', error);
      setDniValidationMessage("Error de conexión. Puedes ingresar el nombre manualmente.");
      setIsDniValidated(false);
    } finally {
      setIsValidatingDni(false);
    }
  }, []);

  const handleDniChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDni = e.target.value;
    setSignupData({ ...signupData, dni: newDni });
    
    // Clear previous validation
    setDniValidationMessage("");
    setIsDniValidated(false);
    
    // Clear existing timeout
    if (dniTimeoutRef.current) {
      clearTimeout(dniTimeoutRef.current);
    }

    // Set new timeout for validation
    if (newDni.trim()) {
      dniTimeoutRef.current = setTimeout(() => {
        validateCedulaCR(newDni);
      }, 800);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const validatedData = authSchema.parse(signupData);
      const redirectUrl = `${window.location.origin}/`;

      const { data, error } = await supabase.auth.signUp({
        email: validatedData.email,
        password: validatedData.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name: validatedData.name || "",
            dni: signupData.dni || "",
          },
        },
      });

      if (error) {
        if (error.message.includes("User already registered")) {
          toast({
            title: "Usuario existente",
            description: "Este correo ya está registrado. Intenta iniciar sesión.",
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

      if (data.user) {
        toast({
          title: "¡Registro exitoso!",
          description: "Por favor, verifica tu correo electrónico para confirmar tu cuenta.",
        });
        setSignupData({ email: "", password: "", name: "", dni: "" });
      }
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
    <div className="min-h-screen flex items-center justify-center gradient-subtle p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full gradient-hero shadow-glow mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2">TechSecureIA</h1>
          <p className="text-muted-foreground">Evaluación de Ciberseguridad</p>
        </div>

        <Card className="shadow-strong">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              Acceso al Sistema
            </CardTitle>
            <CardDescription>Inicia sesión o crea una cuenta para comenzar tus evaluaciones</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
                <TabsTrigger value="signup">Registrarse</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
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
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-dni">Cédula (Opcional)</Label>
                    <div className="relative">
                      <Input
                        id="signup-dni"
                        type="text"
                        placeholder="1-2345-6789"
                        value={signupData.dni}
                        onChange={handleDniChange}
                        className={isDniValidated ? "pr-10 border-green-500" : ""}
                      />
                      {isValidatingDni && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                      )}
                      {isDniValidated && (
                        <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                      )}
                    </div>
                    {dniValidationMessage && (
                      <p className={`text-sm flex items-center gap-1 ${
                        isDniValidated ? "text-green-600" : "text-muted-foreground"
                      }`}>
                        {isDniValidated ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <AlertCircle className="w-3 h-3" />
                        )}
                        {dniValidationMessage}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Nombre Completo</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Ingresa tu nombre"
                      value={signupData.name}
                      onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
                      required
                      className={isDniValidated ? "bg-muted/50" : ""}
                    />
                    {isDniValidated && (
                      <p className="text-xs text-muted-foreground">
                        Puedes editar el nombre si es necesario
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Correo Electrónico</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="tu@email.com"
                      value={signupData.email}
                      onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Contraseña</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={signupData.password}
                      onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Creando cuenta..." : "Crear Cuenta"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
