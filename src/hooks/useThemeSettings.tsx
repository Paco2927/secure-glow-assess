import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

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

export const useThemeSettings = () => {
  const [loaded, setLoaded] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [dashboardBackgroundUrl, setDashboardBackgroundUrl] = useState<string | null>(null);
  const [faviconUrl, setFaviconUrl] = useState<string | null>(null);
  const [backgroundFit, setBackgroundFit] = useState<string>("cover");
  const [companyName, setCompanyName] = useState<string>("TechSecureAI");

  useEffect(() => {
    loadAndApplyTheme();
  }, []);

  const loadAndApplyTheme = async () => {
    try {
      const { data, error } = await supabase
        .from("theme_settings")
        .select("colors, logo_url, dashboard_background_url, favicon_url, background_fit, name")
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        if (data.colors) {
          applyTheme(data.colors as ThemeColors);
        }
        setLogoUrl(data.logo_url);
        setDashboardBackgroundUrl(data.dashboard_background_url);
        setFaviconUrl(data.favicon_url);
        setBackgroundFit(data.background_fit || "cover");
        setCompanyName(data.name || "TechSecureAI");
        
        // Actualizar el favicon dinámicamente
        if (data.favicon_url) {
          updateFavicon(data.favicon_url);
        }
      }
    } catch (error) {
      console.error("Error loading theme:", error);
    } finally {
      setLoaded(true);
    }
  };

  const applyTheme = (colors: ThemeColors) => {
    const root = document.documentElement;
    Object.entries(colors).forEach(([key, value]) => {
      if (value) {
        root.style.setProperty(`--${key}`, value);
      }
    });
  };

  const updateFavicon = (url: string) => {
    // Eliminar favicons existentes
    const existingLinks = document.querySelectorAll("link[rel*='icon']");
    existingLinks.forEach(link => link.remove());

    // Agregar nuevo favicon
    const link = document.createElement("link");
    link.rel = "icon";
    link.href = url;
    document.head.appendChild(link);
  };

  return { loaded, logoUrl, dashboardBackgroundUrl, faviconUrl, backgroundFit, companyName };
};
