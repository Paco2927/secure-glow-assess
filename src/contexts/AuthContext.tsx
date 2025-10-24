import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

interface Profile {
  id: string;
  name: string | null;
  avatar_url: string | null;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  isAdmin: boolean;
  isModerator: boolean;
  canManageOrganizations: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isModerator, setIsModerator] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    checkUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT") {
        setUser(null);
        setProfile(null);
        setIsAdmin(false);
        setIsModerator(false);
        navigate("/auth");
      } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        await checkUser();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUser = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setUser(null);
        setProfile(null);
        setIsAdmin(false);
        setIsModerator(false);
        setLoading(false);
        return;
      }

      setUser(session.user);

      // Fetch user profile and roles in parallel
      const [profileResponse, adminResponse, moderatorResponse] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", session.user.id).single(),
        supabase.rpc("has_role", {
          _user_id: session.user.id,
          _role: "admin",
        }),
        supabase.rpc("has_role", {
          _user_id: session.user.id,
          _role: "moderator",
        }),
      ]);

      setProfile(profileResponse.data);
      setIsAdmin(adminResponse.data || false);
      setIsModerator(moderatorResponse.data || false);
    } catch (error) {
      console.error("Error checking user:", error);
      setUser(null);
      setProfile(null);
      setIsAdmin(false);
      setIsModerator(false);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setIsAdmin(false);
    setIsModerator(false);
  };

  const value = {
    user,
    profile,
    isAdmin,
    isModerator,
    canManageOrganizations: isAdmin || isModerator,
    loading,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
