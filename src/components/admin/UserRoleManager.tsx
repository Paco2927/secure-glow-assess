import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Shield, ShieldOff, Trash2, Search, UserPlus, Loader2, CheckCircle2, AlertCircle, Key, Copy, Check } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAdminRole } from "@/hooks/useAdminRole";
import { z } from "zod";

// Schema for signup (includes name and dni)
const signupSchema = z.object({
  email: z.string().trim().email({ message: "Correo electrónico inválido" }),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres" }),
  name: z.string().trim().min(2, { message: "El nombre debe tener al menos 2 caracteres" }),
  dni: z.string().trim().min(9, { message: "La cédula debe tener al menos 9 dígitos" }),
});

interface Profile {
  id: string;
  name: string;
  email: string;
}

interface UserRole {
  user_id: string;
  role: 'admin' | 'user' | 'auditor' | 'moderator'; // moderator included for backward compatibility
}

export const UserRoleManager = () => {
  const { toast } = useToast();
  const { isAdmin: isCurrentUserAdmin } = useAdminRole();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "auditor" | "user">("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [signupData, setSignupData] = useState({
    email: "",
    password: "",
    dni: "",
    name: "",
  });
  const [isValidatingDni, setIsValidatingDni] = useState(false);
  const [dniValidationMessage, setDniValidationMessage] = useState("");
  const [isDniValidated, setIsDniValidated] = useState(false);
  const dniTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [passwordCopied, setPasswordCopied] = useState(false);

  useEffect(() => {
    fetchData();
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  };

  const fetchData = async () => {
    try {
      // Fetch all profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at');

      if (profilesError) throw profilesError;

      // Fetch all user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      setProfiles(profilesData || []);
      setUserRoles(rolesData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los usuarios",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const isAuditor = (userId: string) => {
    return userRoles.some(role => role.user_id === userId && role.role === 'auditor');
  };

  const isAdmin = (userId: string) => {
    return userRoles.some(role => role.user_id === userId && role.role === 'admin');
  };

  const toggleAuditorRole = async (userId: string) => {
    try {
      const currentlyAuditor = isAuditor(userId);

      if (currentlyAuditor) {
        // Remove auditor role
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', 'auditor');

        if (error) throw error;

        toast({
          title: "Rol actualizado",
          description: "Se han removido los permisos de auditor"
        });
      } else {
        // Add auditor role
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: 'auditor' });

        if (error) throw error;

        toast({
          title: "Rol actualizado",
          description: "Se han otorgado permisos de auditor"
        });
      }

      fetchData();
    } catch (error: any) {
      console.error("Error updating role:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el rol",
        variant: "destructive"
      });
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
      const { data, error } = await supabase.functions.invoke("validate-cedula-cr", {
        body: { cedula },
      });

      if (error) {
        console.error("Error calling validate-cedula-cr:", error);
        setDniValidationMessage("Error al validar cédula. Puedes ingresar el nombre manualmente.");
        setIsDniValidated(false);
        return;
      }

      if (data.success && data.name) {
        setSignupData((prev) => ({ ...prev, name: data.name }));
        setDniValidationMessage(`✓ Nombre encontrado: ${data.name}`);
        setIsDniValidated(true);
      } else {
        setDniValidationMessage(data.error || "Cédula no encontrada. Ingresa el nombre manualmente.");
        setIsDniValidated(false);
      }
    } catch (error) {
      console.error("Error validating cedula:", error);
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

  const generateSecurePassword = () => {
    const length = 12;
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const symbols = "!@#$%^&*";
    const allChars = uppercase + lowercase + numbers + symbols;
    
    let password = "";
    // Asegurar al menos un carácter de cada tipo
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];
    
    // Rellenar el resto
    for (let i = password.length; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Mezclar la contraseña
    password = password.split('').sort(() => Math.random() - 0.5).join('');
    
    setSignupData({ ...signupData, password });
    toast({
      title: "Contraseña generada",
      description: "Se ha generado una contraseña segura de 12 caracteres",
    });
  };

  const copyPasswordToClipboard = async () => {
    if (!signupData.password) {
      toast({
        title: "No hay contraseña",
        description: "Primero genera una contraseña",
        variant: "destructive",
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(signupData.password);
      setPasswordCopied(true);
      toast({
        title: "¡Copiado!",
        description: "La contraseña se copió al portapapeles",
      });
      setTimeout(() => setPasswordCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo copiar la contraseña",
        variant: "destructive",
      });
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingUser(true);

    try {
      const validatedData = signupSchema.parse(signupData);
      const redirectUrl = `${window.location.origin}/`;

      const { data, error } = await supabase.auth.signUp({
        email: validatedData.email,
        password: validatedData.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name: validatedData.name,
            dni: validatedData.dni,
          },
        },
      });

      if (error) {
        if (error.message.includes("User already registered")) {
          toast({
            title: "Usuario existente",
            description: "Este correo ya está registrado.",
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
          title: "¡Usuario creado!",
          description: "El usuario ha sido creado exitosamente.",
        });
        setSignupData({ email: "", password: "", name: "", dni: "" });
        setDniValidationMessage("");
        setIsDniValidated(false);
        setCreateDialogOpen(false);
        fetchData();
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
      setIsCreatingUser(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteUserId) return;

    try {
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { userId: deleteUserId }
      });

      if (error) {
        throw error;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      toast({
        title: "Usuario eliminado",
        description: "El usuario ha sido eliminado exitosamente"
      });

      fetchData();
    } catch (error: any) {
      console.error("Error deleting user:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el usuario",
        variant: "destructive"
      });
    } finally {
      setDeleteUserId(null);
    }
  };

  const getRolePriority = (userId: string) => {
    if (isAdmin(userId)) return 1;
    if (isAuditor(userId)) return 2;
    return 3;
  };

  const filteredAndSortedProfiles = profiles
    .filter((profile) => {
      // Filter by search term
      const matchesSearch = 
        profile.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        profile.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Filter by role
      if (roleFilter === "all") return matchesSearch;
      if (roleFilter === "admin") return matchesSearch && isAdmin(profile.id);
      if (roleFilter === "auditor") return matchesSearch && isAuditor(profile.id);
      if (roleFilter === "user") return matchesSearch && !isAdmin(profile.id) && !isAuditor(profile.id);
      
      return matchesSearch;
    })
    .sort((a, b) => {
      // Sort by role priority
      const priorityA = getRolePriority(a.id);
      const priorityB = getRolePriority(b.id);
      
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      
      // If same role, sort by name
      return a.name.localeCompare(b.name);
    });

  if (loading) {
    return <div className="text-center py-8">Cargando usuarios...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Gestión de Usuarios y Roles</h2>
      </div>

      <div className="flex gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={roleFilter} onValueChange={(value: any) => setRoleFilter(value)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrar por rol" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los roles</SelectItem>
            <SelectItem value="admin">Administradores</SelectItem>
            <SelectItem value="auditor">Auditores</SelectItem>
            <SelectItem value="user">Usuarios</SelectItem>
          </SelectContent>
        </Select>
        
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Crear Usuario
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Usuario</DialogTitle>
              <DialogDescription>
                Complete el formulario para crear una nueva cuenta de usuario.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-dni">Cédula</Label>
                <div className="relative">
                  <Input
                    id="signup-dni"
                    type="text"
                    placeholder="Introduce la cédula"
                    value={signupData.dni}
                    onChange={handleDniChange}
                    className={isDniValidated ? "pr-10 border-green-500" : ""}
                    required
                  />
                  {isValidatingDni && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                  )}
                  {isDniValidated && (
                    <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                  )}
                </div>
                {dniValidationMessage && (
                  <p
                    className={`text-sm flex items-center gap-1 ${
                      isDniValidated ? "text-green-600" : "text-muted-foreground"
                    }`}
                  >
                    {isDniValidated ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                    {dniValidationMessage}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-name">Nombre Completo</Label>
                <Input
                  id="signup-name"
                  type="text"
                  placeholder="Ingresa el nombre"
                  value={signupData.name}
                  onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
                  required
                  className={isDniValidated ? "bg-muted/50" : ""}
                />
                {isDniValidated && (
                  <p className="text-xs text-muted-foreground">Puedes editar el nombre si es necesario</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-email">Correo Electrónico</Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="usuario@email.com"
                  value={signupData.email}
                  onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password">Contraseña</Label>
                <div className="flex gap-2">
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={signupData.password}
                    onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                    required
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={generateSecurePassword}
                    title="Generar contraseña segura"
                  >
                    <Key className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={copyPasswordToClipboard}
                    disabled={!signupData.password}
                    title="Copiar contraseña"
                  >
                    {passwordCopied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Usa el botón 🔑 para generar una contraseña segura de 12 caracteres
                </p>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setCreateDialogOpen(false);
                    setSignupData({ email: "", password: "", name: "", dni: "" });
                    setDniValidationMessage("");
                    setIsDniValidated(false);
                    setPasswordCopied(false);
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isCreatingUser}>
                  {isCreatingUser ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creando...
                    </>
                  ) : (
                    "Crear Usuario"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-4">Nombre</th>
              <th className="text-left p-4">Email</th>
              <th className="text-left p-4">Rol</th>
              <th className="text-left p-4">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedProfiles.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-muted-foreground">
                  No se encontraron usuarios
                </td>
              </tr>
            ) : (
              filteredAndSortedProfiles.map((profile) => (
              <tr key={profile.id} className="border-b last:border-0">
                <td className="p-4">{profile.name}</td>
                <td className="p-4">{profile.email}</td>
                <td className="p-4">
                  <div className="flex gap-2">
                    {isAdmin(profile.id) && (
                      <span className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
                        <Shield className="h-4 w-4" />
                        Administrador
                      </span>
                    )}
                    {isAuditor(profile.id) && (
                      <span className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full text-sm">
                        <Shield className="h-4 w-4" />
                        Auditor
                      </span>
                    )}
                    {!isAdmin(profile.id) && !isAuditor(profile.id) && (
                      <span className="inline-flex items-center gap-2 bg-muted px-3 py-1 rounded-full text-sm">
                        Usuario
                      </span>
                    )}
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex gap-2">
                    {!isAdmin(profile.id) && (
                      <Button
                        variant={isAuditor(profile.id) ? "destructive" : "default"}
                        size="sm"
                        onClick={() => toggleAuditorRole(profile.id)}
                      >
                        {isAuditor(profile.id) ? (
                          <>
                            <ShieldOff className="h-4 w-4 mr-2" />
                            Remover Auditor
                          </>
                        ) : (
                          <>
                            <Shield className="h-4 w-4 mr-2" />
                            Hacer Auditor
                          </>
                        )}
                      </Button>
                    )}
                    {isCurrentUserAdmin && profile.id !== currentUserId && !isAdmin(profile.id) && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDeleteUserId(profile.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Eliminar
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            )))}
          </tbody>
        </table>
      </div>

      <AlertDialog open={!!deleteUserId} onOpenChange={() => setDeleteUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará el usuario permanentemente junto con todos sus datos asociados (roles, evaluaciones, organizaciones, etc.).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
