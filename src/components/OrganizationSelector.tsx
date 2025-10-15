import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface Organization {
  id: string;
  name: string;
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
        .select("id, name")
        .order("name");

      if (error) throw error;
      setOrganizations(data || []);
    } catch (error) {
      console.error("Error loading organizations:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2 mb-6">
      <Label htmlFor="organization">Organización *</Label>
      <Select value={value} onValueChange={onChange} disabled={loading}>
        <SelectTrigger id="organization">
          <SelectValue placeholder="Selecciona una organización" />
        </SelectTrigger>
        <SelectContent>
          {organizations.map((org) => (
            <SelectItem key={org.id} value={org.id}>
              {org.name}
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
