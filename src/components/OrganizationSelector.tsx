import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Building2 } from "lucide-react";

interface Organization {
  id: string;
  name: string;
  logo_url: string | null;
}

interface OrganizationSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export const OrganizationSelector = ({ value, onChange }: OrganizationSelectorProps) => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrganizations();
  }, []);

  const loadOrganizations = async () => {
    try {
      const { data, error } = await supabase
        .from("organizations")
        .select("id, name, logo_url")
        .order("name");

      if (error) throw error;
      setOrganizations(data || []);
    } catch (error) {
      console.error("Error loading organizations:", error);
    } finally {
      setLoading(false);
    }
  };

  const selectedOrg = organizations.find(org => org.id === value);

  return (
    <div className="space-y-2 mb-6">
      <Label htmlFor="organization">Organización *</Label>
      <Select value={value} onValueChange={onChange} disabled={loading}>
        <SelectTrigger id="organization">
          <SelectValue placeholder="Selecciona una organización">
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
      {organizations.length === 0 && !loading && (
        <p className="text-sm text-muted-foreground">
          No tienes organizaciones. Crea una primero en la sección Organizaciones.
        </p>
      )}
    </div>
  );
};
