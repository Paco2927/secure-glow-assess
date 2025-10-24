import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Upload, Eye, EyeOff } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Profile() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [currentPasswordForEmail, setCurrentPasswordForEmail] = useState("");
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [sentCode, setSentCode] = useState("");
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    avatar_url: "",
  });

  useEffect(() => {
    getProfile();
  }, []);

  const getProfile = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single();

      if (error) throw error;

      setProfile({
        name: data.name || "",
        email: data.email || "",
        avatar_url: data.avatar_url || "",
      });
    } catch (error: any) {
      console.error("Error loading profile:", error);
      toast({
        title: "Error",
        description: "No se pudo cargar el perfil",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { error } = await supabase
        .from("profiles")
        .update({
          name: profile.name,
        })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "Perfil actualizado",
        description: "Los cambios se guardaron correctamente",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el perfil",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateEmail = async (newEmail: string) => {
    try {
      if (!currentPasswordForEmail) {
        toast({
          title: "Error",
          description: "Debes ingresar tu contraseña actual",
          variant: "destructive",
        });
        return;
      }

      setLoading(true);

      // Reautenticar al usuario con su contraseña actual
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: profile.email,
        password: currentPasswordForEmail,
      });

      if (signInError) {
        throw new Error("Contraseña incorrecta");
      }

      // Actualizar el email
      const { error } = await supabase.auth.updateUser({ email: newEmail });

      if (error) throw error;

      toast({
        title: "Correo actualizado",
        description: "Se ha enviado un correo de confirmación a tu nuevo correo electrónico",
      });

      setCurrentPasswordForEmail("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el correo",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendPasswordChangeConfirmation = async () => {
    try {
      if (!newPassword || newPassword.length < 6) {
        toast({
          title: "Error",
          description: "La contraseña debe tener al menos 6 caracteres",
          variant: "destructive",
        });
        return;
      }

      setLoading(true);
      
      // Generar código de verificación de 6 dígitos
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setSentCode(code);

      // Enviar correo con código de verificación
      const { error } = await supabase.functions.invoke("send-password-change-confirmation", {
        body: { 
          email: profile.email,
          name: profile.name,
          verificationCode: code
        },
      });

      if (error) throw error;

      setConfirmDialogOpen(true);
      
      toast({
        title: "Correo enviado",
        description: "Se ha enviado un código de verificación a tu correo electrónico",
      });
    } catch (error: any) {
      console.error("Error sending confirmation:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo enviar el correo de confirmación",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async () => {
    try {
      if (verificationCode !== sentCode) {
        toast({
          title: "Código incorrecto",
          description: "El código de verificación no coincide",
          variant: "destructive",
        });
        return;
      }

      setLoading(true);
      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) throw error;

      toast({
        title: "Contraseña actualizada",
        description: "Tu contraseña ha sido cambiada exitosamente",
      });
      
      setNewPassword("");
      setVerificationCode("");
      setSentCode("");
      setConfirmDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar la contraseña",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      const file = event.target.files[0];
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id);

      if (updateError) throw updateError;

      setProfile({ ...profile, avatar_url: publicUrl });

      toast({
        title: "Avatar actualizado",
        description: "Tu foto de perfil ha sido actualizada",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo subir el avatar",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>;
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Mi Perfil</CardTitle>
            <CardDescription>Gestiona tu información personal y preferencias</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar Section */}
            <div className="flex items-center gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile.avatar_url} />
                <AvatarFallback>{profile.name.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <Label htmlFor="avatar" className="cursor-pointer">
                  <div className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-accent">
                    <Upload className="h-4 w-4" />
                    {uploading ? "Subiendo..." : "Cambiar foto"}
                  </div>
                </Label>
                <Input
                  id="avatar"
                  type="file"
                  accept="image/*"
                  onChange={uploadAvatar}
                  disabled={uploading}
                  className="hidden"
                />
              </div>
            </div>

            {/* Name Section */}
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              />
              <Button onClick={updateProfile} disabled={loading}>
                Actualizar Nombre
              </Button>
            </div>

            {/* Email Section */}
            <div className="space-y-2">
              <Label htmlFor="email">Nuevo Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              />
              <Label htmlFor="current-password-email">Contraseña Actual</Label>
              <div className="relative">
                <Input
                  id="current-password-email"
                  type={showCurrentPassword ? "text" : "password"}
                  placeholder="Ingresa tu contraseña actual"
                  value={currentPasswordForEmail}
                  onChange={(e) => setCurrentPasswordForEmail(e.target.value)}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  tabIndex={-1}
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              <Button 
                onClick={() => updateEmail(profile.email)} 
                disabled={!currentPasswordForEmail || loading}
              >
                Actualizar Correo
              </Button>
              <p className="text-sm text-muted-foreground">
                Se enviará un correo de confirmación al nuevo correo electrónico
              </p>
            </div>

            {/* Password Section */}
            <div className="space-y-2">
              <Label htmlFor="password">Nueva Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Ingresa tu nueva contraseña"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
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
              <Button 
                onClick={sendPasswordChangeConfirmation} 
                disabled={!newPassword || loading}
              >
                Cambiar Contraseña
              </Button>
              <p className="text-sm text-muted-foreground">
                Se enviará un código de verificación a tu correo para confirmar el cambio
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Diálogo de confirmación */}
        <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Verificar cambio de contraseña</AlertDialogTitle>
              <AlertDialogDescription>
                Se ha enviado un código de verificación de 6 dígitos a {profile.email}. 
                Por favor, ingresa el código para confirmar el cambio de contraseña.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <Label htmlFor="verification-code">Código de verificación</Label>
              <Input
                id="verification-code"
                type="text"
                placeholder="000000"
                maxLength={6}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                className="text-center text-2xl tracking-widest"
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {
                setVerificationCode("");
                setNewPassword("");
                setSentCode("");
              }}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={updatePassword}
                disabled={verificationCode.length !== 6 || loading}
              >
                {loading ? "Verificando..." : "Confirmar"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
