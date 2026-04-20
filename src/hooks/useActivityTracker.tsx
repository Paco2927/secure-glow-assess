import { useEffect, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const PAGE_NAMES: Record<string, string> = {
  "/": "Landing",
  "/dashboard": "Dashboard",
  "/auth": "Autenticación",
  "/admin": "Panel Admin",
  "/assessment/iso27001": "Evaluación ISO 27001",
  "/assessment/nist": "Evaluación NIST",
  "/results": "Resultados",
  "/reportes": "Reportes",
  "/organizations": "Organizaciones",
  "/profile": "Perfil",
  "/risk-matrix": "Matriz de Riesgos",
  "/improvement-plans": "Planes de Mejora",
  "/kpis": "Indicadores KPI",
  "/contact": "Contacto",
};

export const useActivityTracker = () => {
  const location = useLocation();
  const lastPage = useRef<string>("");
  const sessionLogged = useRef(false);

  const logSignInActivity = useCallback(async (sessionUser: any, currentPath: string) => {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("name, email")
        .eq("id", sessionUser.id)
        .maybeSingle();

      await supabase.from("user_activity_log").insert({
        user_id: sessionUser.id,
        user_email: profile?.email || sessionUser.email,
        user_name: profile?.name || "Usuario",
        action: "Inicio de Sesión",
        page: currentPath,
        details: { method: sessionUser.app_metadata?.provider || "email" },
        user_agent: navigator.userAgent,
      });
    } catch (error) {
      console.error("Activity tracking error:", error);
    }
  }, []);

  const logActivity = useCallback(async (action: string, page?: string, details?: Record<string, any>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("name, email")
        .eq("id", user.id)
        .single();

      await supabase.from("user_activity_log").insert({
        user_id: user.id,
        user_email: profile?.email || user.email,
        user_name: profile?.name || "Usuario",
        action,
        page: page || location.pathname,
        details: details || {},
        user_agent: navigator.userAgent,
      });
    } catch (error) {
      // Silent fail - don't break the app for tracking
      console.error("Activity tracking error:", error);
    }
  }, [location.pathname]);

  // Track page navigation
  useEffect(() => {
    const currentPath = location.pathname;
    if (currentPath === lastPage.current) return;
    lastPage.current = currentPath;

    const pageName = PAGE_NAMES[currentPath] || currentPath;

    const trackNavigation = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await logActivity("Navegación", currentPath, { page_name: pageName });
    };

    trackNavigation();
  }, [location.pathname, logActivity]);

  // Track login/logout
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user && !sessionLogged.current) {
        sessionLogged.current = true;
        void logSignInActivity(session.user, location.pathname);
      }

      if (event === "SIGNED_OUT") {
        sessionLogged.current = false;
      }
    });

    return () => subscription.unsubscribe();
  }, [location.pathname, logSignInActivity]);

  return { logActivity };
};
