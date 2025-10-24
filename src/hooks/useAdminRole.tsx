import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useAdminRole = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuditor, setIsAuditor] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminRole();
  }, []);

  const checkAdminRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsAdmin(false);
        setIsAuditor(false);
        setLoading(false);
        return;
      }

      const { data: isAdmin, error: adminError } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "admin",
      });

      const { data: isAuditor, error: auditorError } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "auditor",
      });

      if (adminError) throw adminError;
      if (auditorError) throw auditorError;
      
      setIsAdmin(!!isAdmin);
      setIsAuditor(!!isAuditor);
    } catch (error) {
      console.error("Error checking admin role:", error);
      setIsAdmin(false);
      setIsAuditor(false);
    } finally {
      setLoading(false);
    }
  };

  return { 
    isAdmin, 
    isAuditor, 
    canManageOrganizations: isAdmin || isAuditor, 
    loading 
  };
};
