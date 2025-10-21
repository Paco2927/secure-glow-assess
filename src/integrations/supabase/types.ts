export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      assessment_results: {
        Row: {
          assessment_id: string | null
          comments: string | null
          conformity_status: Database["public"]["Enums"]["conformity_status"]
          control_id: string | null
          evidence: string | null
          id: string
          improvement_action: string | null
          maturity_level_id: string | null
          proof_image_url: string | null
        }
        Insert: {
          assessment_id?: string | null
          comments?: string | null
          conformity_status?: Database["public"]["Enums"]["conformity_status"]
          control_id?: string | null
          evidence?: string | null
          id?: string
          improvement_action?: string | null
          maturity_level_id?: string | null
          proof_image_url?: string | null
        }
        Update: {
          assessment_id?: string | null
          comments?: string | null
          conformity_status?: Database["public"]["Enums"]["conformity_status"]
          control_id?: string | null
          evidence?: string | null
          id?: string
          improvement_action?: string | null
          maturity_level_id?: string | null
          proof_image_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assessment_results_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "accessible_assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_results_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_results_control_id_fkey"
            columns: ["control_id"]
            isOneToOne: false
            referencedRelation: "controls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_results_maturity_level_id_fkey"
            columns: ["maturity_level_id"]
            isOneToOne: false
            referencedRelation: "maturity_levels"
            referencedColumns: ["id"]
          },
        ]
      }
      assessments: {
        Row: {
          assessment_date: string | null
          assessor_name: string | null
          comments: string | null
          id: string
          organization_id: string | null
          standard: string
          status: Database["public"]["Enums"]["assessment_status"]
          user_id: string
        }
        Insert: {
          assessment_date?: string | null
          assessor_name?: string | null
          comments?: string | null
          id?: string
          organization_id?: string | null
          standard: string
          status?: Database["public"]["Enums"]["assessment_status"]
          user_id: string
        }
        Update: {
          assessment_date?: string | null
          assessor_name?: string | null
          comments?: string | null
          id?: string
          organization_id?: string | null
          standard?: string
          status?: Database["public"]["Enums"]["assessment_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_settings: {
        Row: {
          company_location: string | null
          company_phone: string | null
          created_at: string | null
          destination_email: string
          id: string
          updated_at: string | null
        }
        Insert: {
          company_location?: string | null
          company_phone?: string | null
          created_at?: string | null
          destination_email: string
          id?: string
          updated_at?: string | null
        }
        Update: {
          company_location?: string | null
          company_phone?: string | null
          created_at?: string | null
          destination_email?: string
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      controls: {
        Row: {
          code: string
          description: string | null
          domain_id: string | null
          id: string
          name: string
        }
        Insert: {
          code: string
          description?: string | null
          domain_id?: string | null
          id?: string
          name: string
        }
        Update: {
          code?: string
          description?: string | null
          domain_id?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "controls_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "domains"
            referencedColumns: ["id"]
          },
        ]
      }
      domains: {
        Row: {
          description: string | null
          id: string
          name: string
          standard: string
        }
        Insert: {
          description?: string | null
          id?: string
          name: string
          standard: string
        }
        Update: {
          description?: string | null
          id?: string
          name?: string
          standard?: string
        }
        Relationships: []
      }
      improvement_plan_templates: {
        Row: {
          control_id: string
          created_at: string | null
          id: string
          maturity_level_id: string
          template_text: string
          updated_at: string | null
        }
        Insert: {
          control_id: string
          created_at?: string | null
          id?: string
          maturity_level_id: string
          template_text: string
          updated_at?: string | null
        }
        Update: {
          control_id?: string
          created_at?: string | null
          id?: string
          maturity_level_id?: string
          template_text?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "improvement_plan_templates_control_id_fkey"
            columns: ["control_id"]
            isOneToOne: false
            referencedRelation: "controls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "improvement_plan_templates_maturity_level_id_fkey"
            columns: ["maturity_level_id"]
            isOneToOne: false
            referencedRelation: "maturity_levels"
            referencedColumns: ["id"]
          },
        ]
      }
      improvement_plans: {
        Row: {
          action_description: string
          control_id: string | null
          id: string
          organization_id: string | null
          responsible: string | null
          status: Database["public"]["Enums"]["plan_status"] | null
          target_date: string | null
        }
        Insert: {
          action_description: string
          control_id?: string | null
          id?: string
          organization_id?: string | null
          responsible?: string | null
          status?: Database["public"]["Enums"]["plan_status"] | null
          target_date?: string | null
        }
        Update: {
          action_description?: string
          control_id?: string | null
          id?: string
          organization_id?: string | null
          responsible?: string | null
          status?: Database["public"]["Enums"]["plan_status"] | null
          target_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "improvement_plans_control_id_fkey"
            columns: ["control_id"]
            isOneToOne: false
            referencedRelation: "controls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "improvement_plans_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      maturity_levels: {
        Row: {
          description: string | null
          id: string
          level: number
          name: string
        }
        Insert: {
          description?: string | null
          id?: string
          level: number
          name: string
        }
        Update: {
          description?: string | null
          id?: string
          level?: number
          name?: string
        }
        Relationships: []
      }
      organization_members: {
        Row: {
          created_at: string | null
          id: string
          invited_at: string | null
          invited_by: string | null
          organization_id: string
          organization_role: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          organization_id: string
          organization_role?: string | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          organization_id?: string
          organization_role?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          contact_email: string | null
          country: string | null
          created_at: string | null
          id: string
          name: string
          sector: string | null
          user_id: string | null
        }
        Insert: {
          contact_email?: string | null
          country?: string | null
          created_at?: string | null
          id?: string
          name: string
          sector?: string | null
          user_id?: string | null
        }
        Update: {
          contact_email?: string | null
          country?: string | null
          created_at?: string | null
          id?: string
          name?: string
          sector?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          dni: string | null
          email: string
          id: string
          name: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          dni?: string | null
          email: string
          id: string
          name: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          dni?: string | null
          email?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      accessible_assessments: {
        Row: {
          access_type: string | null
          assessment_date: string | null
          assessor_name: string | null
          comments: string | null
          id: string | null
          organization_id: string | null
          standard: string | null
          status: Database["public"]["Enums"]["assessment_status"] | null
          user_id: string | null
        }
        Insert: {
          access_type?: never
          assessment_date?: string | null
          assessor_name?: string | null
          comments?: string | null
          id?: string | null
          organization_id?: string | null
          standard?: string | null
          status?: Database["public"]["Enums"]["assessment_status"] | null
          user_id?: string | null
        }
        Update: {
          access_type?: never
          assessment_date?: string | null
          assessor_name?: string | null
          comments?: string | null
          id?: string | null
          organization_id?: string | null
          standard?: string | null
          status?: Database["public"]["Enums"]["assessment_status"] | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assessments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_organization_member: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user" | "moderator"
      assessment_status: "pending" | "completed"
      conformity_status:
        | "conforme"
        | "no_conformidad"
        | "no_conformidad_menor"
        | "punto_de_mejora"
      maturity_level_name:
        | "Inicial"
        | "Repetible"
        | "Definido"
        | "Gestionado"
        | "Optimizado"
      plan_status: "Pendiente" | "En Progreso" | "Completado"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user", "moderator"],
      assessment_status: ["pending", "completed"],
      conformity_status: [
        "conforme",
        "no_conformidad",
        "no_conformidad_menor",
        "punto_de_mejora",
      ],
      maturity_level_name: [
        "Inicial",
        "Repetible",
        "Definido",
        "Gestionado",
        "Optimizado",
      ],
      plan_status: ["Pendiente", "En Progreso", "Completado"],
    },
  },
} as const
