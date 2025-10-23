import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useAdminRole = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isModerator, setIsModerator] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminRole();
  }, []);

  const checkAdminRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsAdmin(false);
        setIsModerator(false);
        setLoading(false);
        return;
      }

      const { data: adminData, error: adminError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      const { data: moderatorData, error: moderatorError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "moderator")
        .maybeSingle();

      if (adminError) throw adminError;
      if (moderatorError) throw moderatorError;
      
      setIsAdmin(!!adminData);
      setIsModerator(!!moderatorData);
    } catch (error) {
      console.error("Error checking admin role:", error);
      setIsAdmin(false);
      setIsModerator(false);
    } finally {
      setLoading(false);
    }
  };

  return { 
    isAdmin, 
    isModerator, 
    canManageOrganizations: isAdmin || isModerator, 
    loading 
  };
};
