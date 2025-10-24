import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Edit, Trash2 } from "lucide-react";
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

interface RiskListProps {
  onEditRisk: (riskId: string) => void;
  organizationId: string | null;
}

export function RiskList({ onEditRisk, organizationId }: RiskListProps) {
  const [risks, setRisks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (organizationId) {
      fetchRisks();
    }
  }, [organizationId]);

  const fetchRisks = async () => {
    if (!organizationId) return;
    
    try {
      const { data: risksData, error } = await supabase
        .from("risks")
        .select("*")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const risksWithDetails = await Promise.all(
        (risksData || []).map(async (risk) => {
          const { data: assessment } = await supabase
            .from("risk_assessments")
            .select("*")
            .eq("risk_id", risk.id)
            .eq("is_current", true)
            .maybeSingle();

          const { data: treatment } = await supabase
            .from("risk_treatments")
            .select("*")
            .eq("risk_id", risk.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          return { ...risk, assessment, treatment };
        })
      );

      setRisks(risksWithDetails);
    } catch (error) {
      console.error("Error fetching risks:", error);
      toast.error("Error al cargar los riesgos");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase.from("risks").delete().eq("id", deleteId);

      if (error) throw error;

      toast.success("Riesgo eliminado exitosamente");
      fetchRisks();
    } catch (error) {
      console.error("Error deleting risk:", error);
      toast.error("Error al eliminar el riesgo");
    } finally {
      setDeleteId(null);
    }
  };

  const getRiskLevelColor = (level?: string) => {
    switch (level) {
      case "low": return "default";
      case "medium": return "secondary";
      case "high": return "destructive";
      case "extreme": return "destructive";
      default: return "outline";
    }
  };

  const getRiskLevelText = (level?: string) => {
    switch (level) {
      case "low": return "Bajo";
      case "medium": return "Medio";
      case "high": return "Alto";
      case "extreme": return "Extremo";
      default: return level;
    }
  };

  const getTreatmentStatusText = (status?: string) => {
    switch (status) {
      case "open": return "Abierto";
      case "in_progress": return "En Progreso";
      case "closed": return "Cerrado";
      case "accepted": return "Aceptado";
      default: return status || "Sin plan";
    }
  };

  if (loading) {
    return <Skeleton className="w-full h-96" />;
  }

  return (
    <>
      <div className="mb-4 p-4 border rounded-lg bg-muted space-y-2">
        <h4 className="font-semibold">Niveles de Riesgo</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-600"></div>
            <span><span className="font-medium">Bajo:</span> 1-6 puntos</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-600"></div>
            <span><span className="font-medium">Medio:</span> 7-12 puntos</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-600"></div>
            <span><span className="font-medium">Alto:</span> 13-20 puntos</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-600"></div>
            <span><span className="font-medium">Extremo:</span> 21-25 puntos</span>
          </div>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Lista de Riesgos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Activo</TableHead>
                <TableHead>Descripción del Riesgo</TableHead>
                <TableHead>Amenaza</TableHead>
                <TableHead>Control Anexo A</TableHead>
                <TableHead>Nivel de Riesgo</TableHead>
                <TableHead>Estado Tratamiento</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {risks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No hay riesgos registrados
                  </TableCell>
                </TableRow>
              ) : (
                risks.map((risk) => (
                  <TableRow key={risk.id}>
                    <TableCell className="font-medium">{risk.asset}</TableCell>
                    <TableCell className="max-w-xs truncate">{risk.risk_description}</TableCell>
                    <TableCell>{risk.threat}</TableCell>
                    <TableCell>{risk.control_reference || "—"}</TableCell>
                    <TableCell>
                      {risk.assessment ? (
                        <Badge variant={getRiskLevelColor(risk.assessment.risk_level)}>
                          {getRiskLevelText(risk.assessment.risk_level)} ({risk.assessment.risk_score})
                        </Badge>
                      ) : (
                        <Badge variant="outline">Sin evaluar</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {risk.treatment ? (
                        <Badge variant="outline">{getTreatmentStatusText(risk.treatment.status)}</Badge>
                      ) : (
                        <Badge variant="outline">Sin plan</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEditRisk(risk.id)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(risk.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar riesgo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminarán todas las evaluaciones y tratamientos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
