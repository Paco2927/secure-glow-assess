import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RefreshCw, Search, Monitor, LogIn, Navigation, Trash2, Users } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

interface ActivityLog {
  id: string;
  user_id: string;
  user_email: string | null;
  user_name: string | null;
  action: string;
  page: string | null;
  details: Record<string, any>;
  user_agent: string | null;
  created_at: string;
}

const ACTION_ICONS: Record<string, React.ReactNode> = {
  "Inicio de Sesión": <LogIn className="h-4 w-4 text-green-500" />,
  "Navegación": <Navigation className="h-4 w-4 text-blue-500" />,
};

const ACTION_COLORS: Record<string, string> = {
  "Inicio de Sesión": "bg-green-500/10 text-green-700 border-green-500/20",
  "Navegación": "bg-blue-500/10 text-blue-700 border-blue-500/20",
};

export const ActivityLogViewer = () => {
  const { toast } = useToast();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [onlineUsers, setOnlineUsers] = useState<{ email: string; name: string; lastSeen: string }[]>([]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("user_activity_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);

      if (actionFilter !== "all") {
        query = query.eq("action", actionFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setLogs((data as unknown as ActivityLog[]) || []);

      // Calculate "online" users (active in last 15 minutes)
      const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
      const recentUsers = new Map<string, { email: string; name: string; lastSeen: string }>();
      (data as unknown as ActivityLog[])?.forEach((log) => {
        if (log.created_at >= fifteenMinAgo && !recentUsers.has(log.user_id)) {
          recentUsers.set(log.user_id, {
            email: log.user_email || "",
            name: log.user_name || "",
            lastSeen: log.created_at,
          });
        }
      });
      setOnlineUsers(Array.from(recentUsers.values()));
    } catch (error) {
      console.error("Error fetching activity logs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter]);

  const handleClearLogs = async () => {
    if (!confirm("¿Estás seguro de que deseas eliminar todos los registros de actividad?")) return;
    try {
      const { error } = await supabase.from("user_activity_log").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      if (error) throw error;
      toast({ title: "Registros eliminados", description: "Se han eliminado todos los registros de actividad." });
      fetchLogs();
    } catch (error) {
      toast({ title: "Error", description: "No se pudieron eliminar los registros.", variant: "destructive" });
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      log.user_email?.toLowerCase().includes(term) ||
      log.user_name?.toLowerCase().includes(term) ||
      log.action.toLowerCase().includes(term) ||
      log.page?.toLowerCase().includes(term)
    );
  });

  const getBrowserInfo = (ua: string | null) => {
    if (!ua) return "Desconocido";
    if (ua.includes("Chrome")) return "Chrome";
    if (ua.includes("Firefox")) return "Firefox";
    if (ua.includes("Safari")) return "Safari";
    if (ua.includes("Edge")) return "Edge";
    return "Otro";
  };

  return (
    <div className="space-y-6">
      {/* Online Users Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-green-500" />
            Usuarios Activos (últimos 15 min)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {onlineUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay usuarios activos recientes.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {onlineUsers.map((u, i) => (
                <Badge key={i} variant="outline" className="bg-green-500/10 border-green-500/30 text-green-700 py-1 px-3">
                  <div className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse" />
                  {u.name || u.email}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por usuario, acción o página..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrar por acción" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las acciones</SelectItem>
            <SelectItem value="Inicio de Sesión">Inicio de Sesión</SelectItem>
            <SelectItem value="Navegación">Navegación</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={fetchLogs} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
        <Button variant="destructive" size="sm" onClick={handleClearLogs}>
          <Trash2 className="h-4 w-4 mr-2" />
          Limpiar
        </Button>
      </div>

      {/* Activity Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha/Hora</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead>Acción</TableHead>
                <TableHead>Página</TableHead>
                <TableHead>Navegador</TableHead>
                <TableHead>Detalles</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No se encontraron registros de actividad.
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs whitespace-nowrap">
                      {format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss", { locale: es })}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">{log.user_name || "—"}</p>
                        <p className="text-xs text-muted-foreground">{log.user_email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {ACTION_ICONS[log.action] || <Monitor className="h-4 w-4 text-muted-foreground" />}
                        <Badge variant="outline" className={ACTION_COLORS[log.action] || ""}>
                          {log.action}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {log.details?.page_name || log.page || "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {getBrowserInfo(log.user_agent)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                      {Object.keys(log.details || {}).length > 0
                        ? JSON.stringify(log.details)
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground text-center">
        Mostrando {filteredLogs.length} de {logs.length} registros (máx. 500)
      </p>
    </div>
  );
};

export default ActivityLogViewer;
