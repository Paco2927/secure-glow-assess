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

  useEffect(() => {
    loadAndApplyTheme();
  }, []);

  const loadAndApplyTheme = async () => {
    try {
      const { data, error } = await supabase
        .from("theme_settings")
        .select("colors, logo_url, dashboard_background_url")
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        if (data.colors) {
          applyTheme(data.colors as ThemeColors);
        }
        setLogoUrl(data.logo_url);
        setDashboardBackgroundUrl(data.dashboard_background_url);
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

  return { loaded, logoUrl, dashboardBackgroundUrl };
};
