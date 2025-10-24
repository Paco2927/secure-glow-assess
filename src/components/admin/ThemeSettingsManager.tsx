import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { RefreshCw, Save, Pipette, Upload, X } from "lucide-react";
import { HslColorPicker } from "react-colorful";

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
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [dashboardBackgroundUrl, setDashboardBackgroundUrl] = useState<string | null>(null);
  const [faviconUrl, setFaviconUrl] = useState<string | null>(null);
  const [backgroundFit, setBackgroundFit] = useState<string>("cover");
  const [companyName, setCompanyName] = useState<string>("");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBackground, setUploadingBackground] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);

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
        setLogoUrl(data.logo_url);
        setDashboardBackgroundUrl(data.dashboard_background_url);
        setFaviconUrl(data.favicon_url);
        setBackgroundFit(data.background_fit || "cover");
        setCompanyName(data.name || "");
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

  const hslToObject = (hslString: string) => {
    const match = hslString.match(/(\d+\.?\d*)\s+(\d+\.?\d*)%\s+(\d+\.?\d*)%/);
    if (!match) return { h: 0, s: 0, l: 0 };
    return {
      h: parseFloat(match[1]),
      s: parseFloat(match[2]),
      l: parseFloat(match[3])
    };
  };

  const objectToHsl = (hsl: { h: number; s: number; l: number }) => {
    return `${hsl.h.toFixed(1)} ${hsl.s.toFixed(1)}% ${hsl.l.toFixed(1)}%`;
  };

  const validateImageFile = (file: File, maxSizeMB: number): { valid: boolean; error?: string } => {
    // Validate MIME type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      return { 
        valid: false, 
        error: 'Formato no válido. Use JPG, PNG, WEBP o SVG' 
      };
    }
    
    // Validate file size
    const maxSize = maxSizeMB * 1024 * 1024;
    if (file.size > maxSize) {
      return { 
        valid: false, 
        error: `Archivo muy grande. Máximo ${maxSizeMB}MB` 
      };
    }
    
    return { valid: true };
  };

  const validateImageDimensions = (file: File, maxWidth: number, maxHeight: number): Promise<{ valid: boolean; error?: string }> => {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(url);
        if (img.width > maxWidth || img.height > maxHeight) {
          resolve({ 
            valid: false, 
            error: `Dimensiones muy grandes. Máximo ${maxWidth}x${maxHeight}px` 
          });
        } else {
          resolve({ valid: true });
        }
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve({ valid: false, error: 'No se pudo cargar la imagen' });
      };
      
      img.src = url;
    });
  };

  const handleUploadLogo = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type and size
    const fileValidation = validateImageFile(file, 5);
    if (!fileValidation.valid) {
      toast.error(fileValidation.error);
      return;
    }

    // Validate dimensions (logo: 800x800px max)
    const dimValidation = await validateImageDimensions(file, 800, 800);
    if (!dimValidation.valid) {
      toast.error(dimValidation.error);
      return;
    }

    setUploadingLogo(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `logo-${Date.now()}.${fileExt}`;
      const filePath = `theme/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("organization-logos")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("organization-logos")
        .getPublicUrl(filePath);

      setLogoUrl(publicUrl);
      toast.success("Logo cargado correctamente");
    } catch (error) {
      console.error("Error uploading logo:", error);
      toast.error("Error al cargar el logo");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleUploadBackground = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type and size (10MB for background)
    const fileValidation = validateImageFile(file, 10);
    if (!fileValidation.valid) {
      toast.error(fileValidation.error);
      return;
    }

    // Validate dimensions (background: 1920x1080px max)
    const dimValidation = await validateImageDimensions(file, 1920, 1080);
    if (!dimValidation.valid) {
      toast.error(dimValidation.error);
      return;
    }

    setUploadingBackground(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `background-${Date.now()}.${fileExt}`;
      const filePath = `theme/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("organization-logos")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("organization-logos")
        .getPublicUrl(filePath);

      setDashboardBackgroundUrl(publicUrl);
      toast.success("Imagen de fondo cargada correctamente");
    } catch (error) {
      console.error("Error uploading background:", error);
      toast.error("Error al cargar la imagen de fondo");
    } finally {
      setUploadingBackground(false);
    }
  };

  const handleUploadFavicon = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type and size (favicon: 1MB max)
    const fileValidation = validateImageFile(file, 1);
    if (!fileValidation.valid) {
      toast.error(fileValidation.error);
      return;
    }

    // Validate dimensions (favicon: 512x512px max)
    const dimValidation = await validateImageDimensions(file, 512, 512);
    if (!dimValidation.valid) {
      toast.error(dimValidation.error);
      return;
    }

    setUploadingFavicon(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `favicon-${Date.now()}.${fileExt}`;
      const filePath = `theme/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("organization-logos")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("organization-logos")
        .getPublicUrl(filePath);

      setFaviconUrl(publicUrl);
      toast.success("Favicon cargado correctamente");
    } catch (error) {
      console.error("Error uploading favicon:", error);
      toast.error("Error al cargar el favicon");
    } finally {
      setUploadingFavicon(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updateData = {
        colors: colors as any,
        logo_url: logoUrl,
        dashboard_background_url: dashboardBackgroundUrl,
        favicon_url: faviconUrl,
        background_fit: backgroundFit,
        name: companyName || "TechSecureAI",
        updated_at: new Date().toISOString()
      };

      if (themeId) {
        const { error } = await supabase
          .from("theme_settings")
          .update(updateData)
          .eq("id", themeId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("theme_settings")
          .insert({ ...updateData, is_active: true });

        if (error) throw error;
      }

      toast.success("Tema actualizado correctamente. Todos los usuarios verán estos cambios.");
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      console.error("Error saving theme:", error);
      toast.error("Error al guardar el tema");
    } finally {
      setSaving(false);
    }
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
      {/* Nombre de la empresa */}
      <Card>
        <CardHeader>
          <CardTitle>Información de la Empresa</CardTitle>
          <CardDescription>
            Configura el nombre de tu empresa para documentos y reportes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Label htmlFor="companyName">Nombre de la Empresa</Label>
            <Input
              id="companyName"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="TechSecureAI"
            />
            <p className="text-sm text-muted-foreground">
              Este nombre aparecerá en los documentos PDF y reportes generados por la plataforma.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Imágenes personalizadas */}
      <Card>
        <CardHeader>
          <CardTitle>Personalización de Imágenes</CardTitle>
          <CardDescription>
            Configura el logo y la imagen de fondo del dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Logo */}
            <div className="space-y-3">
              <Label>Logo de la Empresa</Label>
              <p className="text-sm text-muted-foreground">
                Este logo aparecerá en la esquina superior izquierda del dashboard. Máximo 5MB, 800x800px.
              </p>
              {logoUrl && (
                <div className="relative w-32 h-32 border rounded-lg p-2 bg-muted/30">
                  <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6"
                    onClick={() => setLogoUrl(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <div>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleUploadLogo}
                  disabled={uploadingLogo}
                  className="cursor-pointer"
                />
                {uploadingLogo && <p className="text-sm text-muted-foreground mt-2">Subiendo...</p>}
              </div>
            </div>

            {/* Imagen de fondo del dashboard */}
            <div className="space-y-3">
              <Label>Imagen de Fondo del Dashboard</Label>
              <p className="text-sm text-muted-foreground">
                Esta imagen aparecerá como fondo en el dashboard. Máximo 10MB, 1920x1080px.
              </p>
              {dashboardBackgroundUrl && (
                <div className="relative w-full h-32 border rounded-lg overflow-hidden bg-muted/30">
                  <img 
                    src={dashboardBackgroundUrl} 
                    alt="Fondo" 
                    className="w-full h-full"
                    style={{ objectFit: backgroundFit as any }}
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6"
                    onClick={() => setDashboardBackgroundUrl(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <div>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleUploadBackground}
                  disabled={uploadingBackground}
                  className="cursor-pointer"
                />
                {uploadingBackground && <p className="text-sm text-muted-foreground mt-2">Subiendo...</p>}
              </div>
              <div className="space-y-2">
                <Label>Ajuste de Imagen</Label>
                <Select value={backgroundFit} onValueChange={setBackgroundFit}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cover">Cubrir (Cover) - Llena todo el espacio</SelectItem>
                    <SelectItem value="contain">Contener (Contain) - Muestra toda la imagen sin recortar</SelectItem>
                    <SelectItem value="fill">Rellenar (Fill) - Estira la imagen</SelectItem>
                    <SelectItem value="scale-down">Reducir (Scale-down) - Reduce si es necesario</SelectItem>
                    <SelectItem value="none">Ninguno (None) - Tamaño original</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {backgroundFit === "cover" && "La imagen cubrirá todo el espacio, puede recortarse"}
                  {backgroundFit === "contain" && "La imagen completa será visible, puede haber espacios vacíos"}
                  {backgroundFit === "fill" && "La imagen se estirará para llenar el espacio"}
                  {backgroundFit === "scale-down" && "La imagen se reducirá si es más grande que el contenedor"}
                  {backgroundFit === "none" && "La imagen se mostrará en su tamaño original"}
                </p>
              </div>
            </div>
          </div>

          {/* Favicon */}
          <div className="space-y-3 pt-4 border-t">
            <Label>Favicon (Icono de la Página)</Label>
            <p className="text-sm text-muted-foreground">
              Este icono aparecerá en la pestaña del navegador. Recomendado: 32x32px o 64x64px. Máximo 1MB, 512x512px.
            </p>
            {faviconUrl && (
              <div className="relative w-16 h-16 border rounded-lg p-2 bg-muted/30">
                <img src={faviconUrl} alt="Favicon" className="w-full h-full object-contain" />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6"
                  onClick={() => setFaviconUrl(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            <div>
              <Input
                type="file"
                accept="image/png,image/x-icon,image/svg+xml,image/jpeg"
                onChange={handleUploadFavicon}
                disabled={uploadingFavicon}
                className="cursor-pointer"
              />
              {uploadingFavicon && <p className="text-sm text-muted-foreground mt-2">Subiendo...</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Colores */}
      <Card>
        <CardHeader>
          <CardTitle>Personalización de Colores</CardTitle>
          <CardDescription>
            Configura los colores del tema de la plataforma. Estos cambios serán visibles para todos los usuarios.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {colorFields.map(({ key, label, description }) => {
              const currentColor = colors[key as keyof ThemeColors] || "0 0% 50%";
              const hslObject = hslToObject(currentColor);
              
              return (
                <div key={key} className="space-y-2">
                  <Label htmlFor={key}>{label}</Label>
                  <div className="flex gap-2 items-start">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-10 h-10 p-0 shrink-0"
                          style={{ backgroundColor: `hsl(${currentColor})` }}
                        >
                          <Pipette className="w-4 h-4 opacity-0 hover:opacity-100 transition-opacity" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-3">
                        <HslColorPicker
                          color={hslObject}
                          onChange={(newColor) => {
                            const hslString = objectToHsl(newColor);
                            handleColorChange(key as keyof ThemeColors, hslString);
                          }}
                        />
                        <div className="mt-2 p-2 bg-muted rounded text-xs font-mono text-center">
                          {currentColor}
                        </div>
                      </PopoverContent>
                    </Popover>
                    <div className="flex-1">
                      <Input
                        id={key}
                        value={currentColor}
                        onChange={(e) => handleColorChange(key as keyof ThemeColors, e.target.value)}
                        placeholder="222.2 47.4% 11.2%"
                      />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </div>
              );
            })}
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
