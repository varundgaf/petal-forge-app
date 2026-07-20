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
      payments: {
        Row: {
          amount: number
          created_at: string
          destination: string | null
          id: string
          method: Database["public"]["Enums"]["payment_method"]
          notes: string | null
          paid_at: string | null
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
          avatar_url: string | null
          company: string | null
          created_at: string
          email: string
          id: string
          kyc_status: Database["public"]["Enums"]["kyc_status"]
          name: string | null
          two_factor_enabled: boolean
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          email: string
          id: string
          kyc_status?: Database["public"]["Enums"]["kyc_status"]
          name?: string | null
          two_factor_enabled?: boolean
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          email?: string
          id?: string
          kyc_status?: Database["public"]["Enums"]["kyc_status"]
          name?: string | null
          two_factor_enabled?: boolean
          updated_at?: string
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
      payment_status: "pending" | "processing" | "paid" | "failed"
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
      payment_status: ["pending", "processing", "paid", "failed"],
      site_status: ["pending", "active", "paused", "rejected"],
    },
  },
} as const
