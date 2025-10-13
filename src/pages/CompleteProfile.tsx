import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const dniSchema = z.object({
  dni: z.string().trim()
    .min(7, { message: "El DNI debe tener al menos 7 dígitos" })
    .max(10, { message: "El DNI no puede tener más de 10 caracteres" })
    .regex(/^\d+$/, { message: "El DNI debe contener solo números" }),
});

const CompleteProfile = () => {
  const [dni, setDni] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
      }
    };
    checkAuth();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate DNI
      const validatedData = dniSchema.parse({ dni });

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("No user found");
      }

      // Update profile with DNI
      const { error } = await supabase
        .from("profiles")
        .update({ dni: validatedData.dni })
        .eq("id", user.id);

      if (error) {
        if (error.message.includes("duplicate key") || error.message.includes("profiles_dni_unique")) {
          toast({
            title: "DNI duplicado",
            description: "Este DNI ya está registrado. Por favor, use otro DNI.",
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
        title: "¡Perfil completado!",
        description: "Tu DNI ha sido registrado exitosamente.",
      });

      navigate("/");
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Error de validación",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Ocurrió un error al actualizar el perfil",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Completa tu Perfil
          </CardTitle>
          <CardDescription className="text-center">
            Para continuar, necesitamos que ingreses tu DNI
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dni">DNI *</Label>
              <Input
                id="dni"
                type="text"
                placeholder="12345678"
                value={dni}
                onChange={(e) => setDni(e.target.value)}
                required
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Solo números, 7-10 dígitos
              </p>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Guardando..." : "Guardar DNI"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompleteProfile;
