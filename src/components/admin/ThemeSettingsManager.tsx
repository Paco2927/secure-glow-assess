import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { RefreshCw, Save } from "lucide-react";

interface ThemeColors {
  primary?: string;
  "primary-foreground"?: string;
  secondary?: string;
  "secondary-foreground"?: string;
  accent?: string;
  "accent-foreground"?: string;
  destructive?: string;
  "destructive-foreground"?: string;
  muted?: string;
  "muted-foreground"?: string;
  background?: string;
  foreground?: string;
}

export const ThemeSettingsManager = () => {
  const [colors, setColors] = useState<ThemeColors>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [themeId, setThemeId] = useState<string | null>(null);

  useEffect(() => {
    loadThemeSettings();
  }, []);

  const loadThemeSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("theme_settings")
        .select("*")
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setThemeId(data.id);
        setColors(data.colors as ThemeColors);
      }
    } catch (error) {
      console.error("Error loading theme settings:", error);
      toast.error("Error al cargar la configuración del tema");
    } finally {
      setLoading(false);
    }
  };

  const handleColorChange = (key: keyof ThemeColors, value: string) => {
    setColors((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (themeId) {
        const { error } = await supabase
          .from("theme_settings")
          .update({ colors: colors as any, updated_at: new Date().toISOString() })
          .eq("id", themeId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("theme_settings")
          .insert({ name: "custom", colors: colors as any, is_active: true });

        if (error) throw error;
      }

      toast.success("Tema actualizado correctamente");
      applyTheme();
    } catch (error) {
      console.error("Error saving theme:", error);
      toast.error("Error al guardar el tema");
    } finally {
      setSaving(false);
    }
  };

  const applyTheme = () => {
    const root = document.documentElement;
    Object.entries(colors).forEach(([key, value]) => {
      if (value) {
        root.style.setProperty(`--${key}`, value);
      }
    });
  };

  const handleReset = () => {
    const defaultColors: ThemeColors = {
      primary: "222.2 47.4% 11.2%",
      "primary-foreground": "210 40% 98%",
      secondary: "210 40% 96.1%",
      "secondary-foreground": "222.2 47.4% 11.2%",
      accent: "210 40% 96.1%",
      "accent-foreground": "222.2 47.4% 11.2%",
      destructive: "0 84.2% 60.2%",
      "destructive-foreground": "210 40% 98%",
    };
    setColors(defaultColors);
  };

  if (loading) {
    return <div className="flex justify-center p-8">Cargando configuración...</div>;
  }

  const colorFields = [
    { key: "primary", label: "Color Primario", description: "Color principal de la marca" },
    { key: "primary-foreground", label: "Texto Primario", description: "Color de texto sobre primario" },
    { key: "secondary", label: "Color Secundario", description: "Color secundario" },
    { key: "secondary-foreground", label: "Texto Secundario", description: "Color de texto sobre secundario" },
    { key: "accent", label: "Color de Acento", description: "Color de énfasis" },
    { key: "accent-foreground", label: "Texto de Acento", description: "Color de texto sobre acento" },
    { key: "destructive", label: "Color Destructivo", description: "Color para acciones peligrosas" },
    { key: "destructive-foreground", label: "Texto Destructivo", description: "Color de texto sobre destructivo" },
    { key: "muted", label: "Color Silenciado", description: "Color de fondo sutil" },
    { key: "muted-foreground", label: "Texto Silenciado", description: "Color de texto silenciado" },
    { key: "background", label: "Fondo", description: "Color de fondo principal" },
    { key: "foreground", label: "Texto Principal", description: "Color de texto principal" },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Personalización de Colores</CardTitle>
          <CardDescription>
            Configura los colores del tema de la plataforma. Los valores deben estar en formato HSL (ej: "222.2 47.4% 11.2%")
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {colorFields.map(({ key, label, description }) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={key}>{label}</Label>
                <div className="flex gap-2 items-center">
                  <div
                    className="w-10 h-10 rounded border shrink-0"
                    style={{ backgroundColor: `hsl(${colors[key as keyof ThemeColors] || "0 0% 50%"})` }}
                  />
                  <Input
                    id={key}
                    value={colors[key as keyof ThemeColors] || ""}
                    onChange={(e) => handleColorChange(key as keyof ThemeColors, e.target.value)}
                    placeholder="222.2 47.4% 11.2%"
                  />
                </div>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-4">
            <Button onClick={handleSave} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Guardando..." : "Guardar Cambios"}
            </Button>
            <Button onClick={handleReset} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Restablecer por Defecto
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
