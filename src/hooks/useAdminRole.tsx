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

      const { data: isAdmin, error: adminError } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "admin",
      });

      const { data: isModerator, error: moderatorError } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "moderator",
      });

      if (adminError) throw adminError;
      if (moderatorError) throw moderatorError;
      
      setIsAdmin(!!isAdmin);
      setIsModerator(!!isModerator);
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
