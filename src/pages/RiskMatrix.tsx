import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Plus, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { RiskMatrixGrid } from "@/components/risk/RiskMatrixGrid";
import { RiskList } from "@/components/risk/RiskList";
import { RiskForm } from "@/components/risk/RiskForm";
import { MatrixConfig } from "@/components/risk/MatrixConfig";

export default function RiskMatrix() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const organizationIdParam = searchParams.get("organization");
  const [showRiskForm, setShowRiskForm] = useState(false);
  const [editingRiskId, setEditingRiskId] = useState<string | null>(null);
  const [organizationInfo, setOrganizationInfo] = useState<any>(null);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(organizationIdParam);

  useEffect(() => {
    fetchOrganizations();
  }, []);

  useEffect(() => {
    if (selectedOrgId) {
      fetchOrganizationInfo();
    }
  }, [selectedOrgId]);

  const fetchOrganizations = async () => {
    const { data } = await supabase.from("organizations").select("id, name, logo_url").order("name");

    if (data && data.length > 0) {
      setOrganizations(data);
      if (!selectedOrgId) {
        setSelectedOrgId(data[0].id);
      }
    }
  };

  const fetchOrganizationInfo = async () => {
    if (!selectedOrgId) return;

    const { data } = await supabase.from("organizations").select("*").eq("id", selectedOrgId).single();

    if (data) {
      setOrganizationInfo(data);
    }
  };

  const handleEditRisk = (riskId: string) => {
    setEditingRiskId(riskId);
    setShowRiskForm(true);
  };

  const handleCloseForm = () => {
    setShowRiskForm(false);
    setEditingRiskId(null);
  };

  const selectedOrg = organizations.find(org => org.id === selectedOrgId);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold">Matriz de Riesgos</h1>
              <p className="text-muted-foreground">Gestión integral de riesgos de seguridad de la información</p>
              {organizationInfo && (
                <p className="text-sm text-muted-foreground mt-1">Organización: {organizationInfo.name}</p>
              )}
            </div>
          </div>
          <div className="flex gap-2 items-center">
            {organizations.length > 0 && (
              <Select value={selectedOrgId || ""} onValueChange={setSelectedOrgId}>
                <SelectTrigger className="w-[250px]">
                  <SelectValue placeholder="Seleccionar organización">
                    {selectedOrg && (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={selectedOrg.logo_url || undefined} alt={selectedOrg.name} />
                          <AvatarFallback>
                            <Building2 className="h-3 w-3" />
                          </AvatarFallback>
                        </Avatar>
                        <span>{selectedOrg.name}</span>
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={org.logo_url || undefined} alt={org.name} />
                          <AvatarFallback>
                            <Building2 className="h-3 w-3" />
                          </AvatarFallback>
                        </Avatar>
                        <span>{org.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button onClick={() => setShowRiskForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Riesgo
            </Button>
          </div>
        </div>

        <Tabs defaultValue="matrix" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="matrix">Matriz Visual</TabsTrigger>
            <TabsTrigger value="list">Lista de Riesgos</TabsTrigger>
            <TabsTrigger value="config">Configuración</TabsTrigger>
          </TabsList>

          <TabsContent value="matrix" className="space-y-4">
            <RiskMatrixGrid onEditRisk={handleEditRisk} organizationId={selectedOrgId} />
          </TabsContent>

          <TabsContent value="list" className="space-y-4">
            <RiskList onEditRisk={handleEditRisk} organizationId={selectedOrgId} />
          </TabsContent>

          <TabsContent value="config" className="space-y-4">
            <MatrixConfig />
          </TabsContent>
        </Tabs>

        {showRiskForm && (
          <RiskForm riskId={editingRiskId} onClose={handleCloseForm} organizationId={selectedOrgId || undefined} />
        )}
      </div>
    </div>
  );
}
