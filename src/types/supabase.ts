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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_settings: {
        Row: {
          admin_email: string
          business_name: string
          created_at: string
          id: string
          logo_url: string | null
          updated_at: string
          whatsapp_template_en: string
          whatsapp_template_te: string
        }
        Insert: {
          admin_email: string
          business_name: string
          created_at?: string
          id?: string
          logo_url?: string | null
          updated_at?: string
          whatsapp_template_en: string
          whatsapp_template_te: string
        }
        Update: {
          admin_email?: string
          business_name?: string
          created_at?: string
          id?: string
          logo_url?: string | null
          updated_at?: string
          whatsapp_template_en?: string
          whatsapp_template_te?: string
        }
        Relationships: []
      }
      chit_groups: {
        Row: {
          chit_amount: number
          created_at: string
          duration_months: number
          grace_period_days: number
          id: string
          installment_amount: number
          max_members: number
          monthly_penalty_rate: number
          name: string
          penalty_calculation_mode: Database["public"]["Enums"]["penalty_mode_enum"]
          start_date: string
          status: Database["public"]["Enums"]["group_status_enum"]
          updated_at: string
        }
        Insert: {
          chit_amount: number
          created_at?: string
          duration_months: number
          grace_period_days?: number
          id?: string
          installment_amount: number
          max_members?: number
          monthly_penalty_rate: number
          name: string
          penalty_calculation_mode?: Database["public"]["Enums"]["penalty_mode_enum"]
          start_date: string
          status?: Database["public"]["Enums"]["group_status_enum"]
          updated_at?: string
        }
        Update: {
          chit_amount?: number
          created_at?: string
          duration_months?: number
          grace_period_days?: number
          id?: string
          installment_amount?: number
          max_members?: number
          monthly_penalty_rate?: number
          name?: string
          penalty_calculation_mode?: Database["public"]["Enums"]["penalty_mode_enum"]
          start_date?: string
          status?: Database["public"]["Enums"]["group_status_enum"]
          updated_at?: string
        }
        Relationships: []
      }
      chit_releases: {
        Row: {
          amount: number
          created_at: string
          group_id: string
          id: string
          member_id: string
          payment_mode: Database["public"]["Enums"]["payment_mode_enum"]
          release_month: string
          released_at: string
          remarks: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          group_id: string
          id?: string
          member_id: string
          payment_mode: Database["public"]["Enums"]["payment_mode_enum"]
          release_month: string
          released_at?: string
          remarks?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          group_id?: string
          id?: string
          member_id?: string
          payment_mode?: Database["public"]["Enums"]["payment_mode_enum"]
          release_month?: string
          released_at?: string
          remarks?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chit_releases_group_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "chit_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chit_releases_member_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      deleted_payments_audit: {
        Row: {
          delete_reason: string
          deleted_at: string
          deleted_by: string
          due_date: string
          group_id: string
          id: string
          installment_amount: number
          installment_month: string
          member_id: string
          original_payment_id: string
          paid_at: string
          payment_mode: Database["public"]["Enums"]["payment_mode_enum"]
          penalty_amount: number
          penalty_override_reason: string | null
          penalty_was_overridden: boolean
          receipt_number: string
          remarks: string | null
          total_paid: number
          void_reason: string | null
          voided_at: string | null
          voided_by: string | null
        }
        Insert: {
          delete_reason: string
          deleted_at?: string
          deleted_by: string
          due_date: string
          group_id: string
          id?: string
          installment_amount: number
          installment_month: string
          member_id: string
          original_payment_id: string
          paid_at: string
          payment_mode: Database["public"]["Enums"]["payment_mode_enum"]
          penalty_amount: number
          penalty_override_reason?: string | null
          penalty_was_overridden?: boolean
          receipt_number: string
          remarks?: string | null
          total_paid: number
          void_reason?: string | null
          voided_at?: string | null
          voided_by?: string | null
        }
        Update: {
          delete_reason?: string
          deleted_at?: string
          deleted_by?: string
          due_date?: string
          group_id?: string
          id?: string
          installment_amount?: number
          installment_month?: string
          member_id?: string
          original_payment_id?: string
          paid_at?: string
          payment_mode?: Database["public"]["Enums"]["payment_mode_enum"]
          penalty_amount?: number
          penalty_override_reason?: string | null
          penalty_was_overridden?: boolean
          receipt_number?: string
          remarks?: string | null
          total_paid?: number
          void_reason?: string | null
          voided_at?: string | null
          voided_by?: string | null
        }
        Relationships: []
      }
      members: {
        Row: {
          address: string | null
          created_at: string
          group_id: string
          id: string
          name: string
          phone: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          group_id: string
          id?: string
          name: string
          phone: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          group_id?: string
          id?: string
          name?: string
          phone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "members_group_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "chit_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          due_date: string
          group_id: string
          id: string
          installment_amount: number
          installment_month: string
          member_id: string
          paid_at: string
          payment_mode: Database["public"]["Enums"]["payment_mode_enum"]
          penalty_amount: number
          penalty_override_reason: string | null
          penalty_was_overridden: boolean
          receipt_number: string
          remarks: string | null
          total_paid: number
          void_reason: string | null
          voided_at: string | null
          voided_by: string | null
        }
        Insert: {
          due_date: string
          group_id: string
          id?: string
          installment_amount: number
          installment_month: string
          member_id: string
          paid_at?: string
          payment_mode: Database["public"]["Enums"]["payment_mode_enum"]
          penalty_amount?: number
          penalty_override_reason?: string | null
          penalty_was_overridden?: boolean
          receipt_number: string
          remarks?: string | null
          total_paid: number
          void_reason?: string | null
          voided_at?: string | null
          voided_by?: string | null
        }
        Update: {
          due_date?: string
          group_id?: string
          id?: string
          installment_amount?: number
          installment_month?: string
          member_id?: string
          paid_at?: string
          payment_mode?: Database["public"]["Enums"]["payment_mode_enum"]
          penalty_amount?: number
          penalty_override_reason?: string | null
          penalty_was_overridden?: boolean
          receipt_number?: string
          remarks?: string | null
          total_paid?: number
          void_reason?: string | null
          voided_at?: string | null
          voided_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_group_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "chit_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_member_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      receipt_counters: {
        Row: {
          last_value: number
          year: number
        }
        Insert: {
          last_value?: number
          year: number
        }
        Update: {
          last_value?: number
          year?: number
        }
        Relationships: []
      }
    }
    Views: {
      active_payments_view: {
        Row: {
          due_date: string | null
          group_id: string | null
          id: string | null
          installment_amount: number | null
          installment_month: string | null
          member_id: string | null
          paid_at: string | null
          payment_mode: Database["public"]["Enums"]["payment_mode_enum"] | null
          penalty_amount: number | null
          penalty_override_reason: string | null
          penalty_was_overridden: boolean | null
          receipt_number: string | null
          remarks: string | null
          total_paid: number | null
          void_reason: string | null
          voided_at: string | null
          voided_by: string | null
        }
        Insert: {
          due_date?: string | null
          group_id?: string | null
          id?: string | null
          installment_amount?: number | null
          installment_month?: string | null
          member_id?: string | null
          paid_at?: string | null
          payment_mode?: Database["public"]["Enums"]["payment_mode_enum"] | null
          penalty_amount?: number | null
          penalty_override_reason?: string | null
          penalty_was_overridden?: boolean | null
          receipt_number?: string | null
          remarks?: string | null
          total_paid?: number | null
          void_reason?: string | null
          voided_at?: string | null
          voided_by?: string | null
        }
        Update: {
          due_date?: string | null
          group_id?: string | null
          id?: string | null
          installment_amount?: number | null
          installment_month?: string | null
          member_id?: string | null
          paid_at?: string | null
          payment_mode?: Database["public"]["Enums"]["payment_mode_enum"] | null
          penalty_amount?: number | null
          penalty_override_reason?: string | null
          penalty_was_overridden?: boolean | null
          receipt_number?: string | null
          remarks?: string | null
          total_paid?: number | null
          void_reason?: string | null
          voided_at?: string | null
          voided_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_group_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "chit_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_member_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      dashboard_metrics_view: {
        Row: {
          active_groups_count: number | null
          active_members_count: number | null
          month_collections: number | null
          month_pending: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      delete_payment: {
        Args: { p_delete_reason: string; p_payment_id: string }
        Returns: {
          due_date: string
          group_id: string
          id: string
          installment_amount: number
          installment_month: string
          member_id: string
          paid_at: string
          payment_mode: Database["public"]["Enums"]["payment_mode_enum"]
          penalty_amount: number
          penalty_override_reason: string | null
          penalty_was_overridden: boolean
          receipt_number: string
          remarks: string | null
          total_paid: number
          void_reason: string | null
          voided_at: string | null
          voided_by: string | null
        }
        SetofOptions: {
          from: "*"
          to: "payments"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_admin_email: { Args: never; Returns: string }
      record_payment: {
        Args: {
          p_amount_paid: number
          p_installment_month: string
          p_member_id: string
          p_override_reason?: string
          p_payment_mode: Database["public"]["Enums"]["payment_mode_enum"]
          p_penalty_override?: number
          p_remarks?: string
        }
        Returns: {
          due_date: string
          group_id: string
          id: string
          installment_amount: number
          installment_month: string
          member_id: string
          paid_at: string
          payment_mode: Database["public"]["Enums"]["payment_mode_enum"]
          penalty_amount: number
          penalty_override_reason: string | null
          penalty_was_overridden: boolean
          receipt_number: string
          remarks: string | null
          total_paid: number
          void_reason: string | null
          voided_at: string | null
          voided_by: string | null
        }
        SetofOptions: {
          from: "*"
          to: "payments"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      void_payment: {
        Args: { p_payment_id: string; p_void_reason: string }
        Returns: {
          due_date: string
          group_id: string
          id: string
          installment_amount: number
          installment_month: string
          member_id: string
          paid_at: string
          payment_mode: Database["public"]["Enums"]["payment_mode_enum"]
          penalty_amount: number
          penalty_override_reason: string | null
          penalty_was_overridden: boolean
          receipt_number: string
          remarks: string | null
          total_paid: number
          void_reason: string | null
          voided_at: string | null
          voided_by: string | null
        }
        SetofOptions: {
          from: "*"
          to: "payments"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      group_status_enum: "active" | "archived"
      payment_mode_enum: "cash" | "upi" | "bank_transfer"
      penalty_mode_enum: "flat_per_month" | "linear_escalating"
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
      group_status_enum: ["active", "archived"],
      payment_mode_enum: ["cash", "upi", "bank_transfer"],
      penalty_mode_enum: ["flat_per_month", "linear_escalating"],
    },
  },
} as const
