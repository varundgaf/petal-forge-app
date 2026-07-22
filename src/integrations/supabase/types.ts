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
      activity_logs: {
        Row: {
          action: string
          created_at: string
          detail: string | null
          id: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          detail?: string | null
          id?: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          detail?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      ad_units: {
        Row: {
          adsterra_zone_id: string | null
          created_at: string
          format: Database["public"]["Enums"]["ad_format"]
          id: string
          is_active: boolean
          name: string
          site_id: string
          size: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          adsterra_zone_id?: string | null
          created_at?: string
          format: Database["public"]["Enums"]["ad_format"]
          id?: string
          is_active?: boolean
          name: string
          site_id: string
          size?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          adsterra_zone_id?: string | null
          created_at?: string
          format?: Database["public"]["Enums"]["ad_format"]
          id?: string
          is_active?: boolean
          name?: string
          site_id?: string
          size?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_units_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          id: string
          ip: string | null
          meta: Json | null
          target_id: string | null
          target_type: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          id?: string
          ip?: string | null
          meta?: Json | null
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          id?: string
          ip?: string | null
          meta?: Json | null
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          kind: string
          read: boolean
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          kind?: string
          read?: boolean
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          kind?: string
          read?: boolean
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          destination: string | null
          id: string
          method: Database["public"]["Enums"]["payment_method"]
          notes: string | null
          paid_at: string | null
          reference_id: string | null
          requested_at: string
          status: Database["public"]["Enums"]["payment_status"]
          tx_hash: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          destination?: string | null
          id?: string
          method: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          paid_at?: string | null
          reference_id?: string | null
          requested_at?: string
          status?: Database["public"]["Enums"]["payment_status"]
          tx_hash?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          destination?: string | null
          id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          paid_at?: string | null
          reference_id?: string | null
          requested_at?: string
          status?: Database["public"]["Enums"]["payment_status"]
          tx_hash?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          admin_notes: string | null
          avatar_url: string | null
          company: string | null
          country: string | null
          created_at: string
          discord: string | null
          email: string
          id: string
          kyc_status: Database["public"]["Enums"]["kyc_status"]
          min_payout: number
          name: string | null
          payment_email: string | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          phone: string | null
          publisher_id: string | null
          revenue_share: number
          status: Database["public"]["Enums"]["profile_status"]
          telegram: string | null
          timezone: string | null
          two_factor_enabled: boolean
          updated_at: string
          website: string | null
        }
        Insert: {
          admin_notes?: string | null
          avatar_url?: string | null
          company?: string | null
          country?: string | null
          created_at?: string
          discord?: string | null
          email: string
          id: string
          kyc_status?: Database["public"]["Enums"]["kyc_status"]
          min_payout?: number
          name?: string | null
          payment_email?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          phone?: string | null
          publisher_id?: string | null
          revenue_share?: number
          status?: Database["public"]["Enums"]["profile_status"]
          telegram?: string | null
          timezone?: string | null
          two_factor_enabled?: boolean
          updated_at?: string
          website?: string | null
        }
        Update: {
          admin_notes?: string | null
          avatar_url?: string | null
          company?: string | null
          country?: string | null
          created_at?: string
          discord?: string | null
          email?: string
          id?: string
          kyc_status?: Database["public"]["Enums"]["kyc_status"]
          min_payout?: number
          name?: string | null
          payment_email?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          phone?: string | null
          publisher_id?: string | null
          revenue_share?: number
          status?: Database["public"]["Enums"]["profile_status"]
          telegram?: string | null
          timezone?: string | null
          two_factor_enabled?: boolean
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      revenue_events: {
        Row: {
          ad_unit_id: string | null
          clicks: number
          country: string | null
          cpm: number
          created_at: string
          date: string
          id: string
          impressions: number
          revenue: number
          site_id: string | null
          user_id: string
        }
        Insert: {
          ad_unit_id?: string | null
          clicks?: number
          country?: string | null
          cpm?: number
          created_at?: string
          date: string
          id?: string
          impressions?: number
          revenue?: number
          site_id?: string | null
          user_id: string
        }
        Update: {
          ad_unit_id?: string | null
          clicks?: number
          country?: string | null
          cpm?: number
          created_at?: string
          date?: string
          id?: string
          impressions?: number
          revenue?: number
          site_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "revenue_events_ad_unit_id_fkey"
            columns: ["ad_unit_id"]
            isOneToOne: false
            referencedRelation: "ad_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revenue_events_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      sites: {
        Row: {
          category: string | null
          created_at: string
          domain: string
          id: string
          monthly_visitors: number | null
          status: Database["public"]["Enums"]["site_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          domain: string
          id?: string
          monthly_visitors?: number | null
          status?: Database["public"]["Enums"]["site_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          domain?: string
          id?: string
          monthly_visitors?: number | null
          status?: Database["public"]["Enums"]["site_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      ad_format:
        | "banner"
        | "native"
        | "popunder"
        | "social_bar"
        | "interstitial"
        | "video"
      app_role: "admin" | "publisher" | "advertiser"
      kyc_status: "unverified" | "pending" | "verified" | "rejected"
      payment_method:
        | "paypal"
        | "wire"
        | "crypto_btc"
        | "crypto_usdt"
        | "payoneer"
      payment_status:
        | "pending"
        | "processing"
        | "paid"
        | "failed"
        | "approved"
        | "rejected"
      profile_status: "active" | "suspended" | "banned"
      site_status: "pending" | "active" | "paused" | "rejected"
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
      ad_format: [
        "banner",
        "native",
        "popunder",
        "social_bar",
        "interstitial",
        "video",
      ],
      app_role: ["admin", "publisher", "advertiser"],
      kyc_status: ["unverified", "pending", "verified", "rejected"],
      payment_method: [
        "paypal",
        "wire",
        "crypto_btc",
        "crypto_usdt",
        "payoneer",
      ],
      payment_status: [
        "pending",
        "processing",
        "paid",
        "failed",
        "approved",
        "rejected",
      ],
      profile_status: ["active", "suspended", "banned"],
      site_status: ["pending", "active", "paused", "rejected"],
    },
  },
} as const
