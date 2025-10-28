import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Mail, Phone, MapPin } from "lucide-react";

interface ContactSettings {
  id: string;
  destination_email: string;
  company_phone: string | null;
  company_location: string | null;
}

const ContactSettingsManager = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<ContactSettings | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("contact_settings")
        .select("*")
        .limit(1)
        .single();

      if (error) throw error;

      setSettings(data);
    } catch (error: any) {
      console.error("Error fetching contact settings:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las configuraciones de contacto.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("contact_settings")
        .update({
          destination_email: settings.destination_email,
          company_phone: settings.company_phone,
          company_location: settings.company_location,
        })
        .eq("id", settings.id);

      if (error) throw error;

      toast({
        title: "¡Guardado!",
        description: "Las configuraciones de contacto se han actualizado correctamente.",
      });
    } catch (error: any) {
      console.error("Error updating contact settings:", error);
      toast({
        title: "Error",
        description: "No se pudieron guardar las configuraciones.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!settings) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-center">No se encontraron configuraciones de contacto.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuración de Contacto</CardTitle>
        <CardDescription>
          Gestiona el correo electrónico de destino y la información de contacto que se muestra en la página de contacto.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="destination_email" className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Correo Electrónico de Destino
          </Label>
          <Input
            id="destination_email"
            type="email"
            value={settings.destination_email}
            onChange={(e) =>
              setSettings({ ...settings, destination_email: e.target.value })
            }
            placeholder="correo@empresa.com"
          />
          <p className="text-xs text-muted-foreground">
            Los mensajes del formulario de contacto se enviarán a este correo electrónico.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="company_phone" className="flex items-center gap-2">
            <Phone className="w-4 h-4" />
            Teléfono de la Empresa
          </Label>
          <Input
            id="company_phone"
            type="tel"
            value={settings.company_phone || ""}
            onChange={(e) =>
              setSettings({ ...settings, company_phone: e.target.value })
            }
            placeholder="+(506) 62979402"
          />
          <p className="text-xs text-muted-foreground">
            Número de teléfono que se muestra en la página de contacto.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="company_location" className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Ubicación de la Empresa
          </Label>
          <Input
            id="company_location"
            type="text"
            value={settings.company_location || ""}
            onChange={(e) =>
              setSettings({ ...settings, company_location: e.target.value })
            }
            placeholder="San José, Costa Rica"
          />
          <p className="text-xs text-muted-foreground">
            Dirección o ubicación que se muestra en la página de contacto.
          </p>
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Guardar Configuración
        </Button>
      </CardContent>
    </Card>
  );
};

export default ContactSettingsManager;
