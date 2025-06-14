export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      alerts: {
        Row: {
          alert_type: string
          condition_type: string
          cooldown_minutes: number | null
          created_at: string | null
          current_value: number | null
          id: string
          is_active: boolean | null
          last_triggered: string | null
          metadata: Json | null
          symbol: string
          target_value: number
          trigger_count: number | null
          triggered_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          alert_type: string
          condition_type: string
          cooldown_minutes?: number | null
          created_at?: string | null
          current_value?: number | null
          id?: string
          is_active?: boolean | null
          last_triggered?: string | null
          metadata?: Json | null
          symbol: string
          target_value: number
          trigger_count?: number | null
          triggered_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          alert_type?: string
          condition_type?: string
          cooldown_minutes?: number | null
          created_at?: string | null
          current_value?: number | null
          id?: string
          is_active?: boolean | null
          last_triggered?: string | null
          metadata?: Json | null
          symbol?: string
          target_value?: number
          trigger_count?: number | null
          triggered_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_pinned: boolean | null
          metadata: Json | null
          title: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_pinned?: boolean | null
          metadata?: Json | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_pinned?: boolean | null
          metadata?: Json | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      dashboard_layouts: {
        Row: {
          created_at: string | null
          grid_config: Json | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          layout_name: string
          updated_at: string | null
          user_id: string
          widgets: Json
        }
        Insert: {
          created_at?: string | null
          grid_config?: Json | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          layout_name: string
          updated_at?: string | null
          user_id: string
          widgets: Json
        }
        Update: {
          created_at?: string | null
          grid_config?: Json | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          layout_name?: string
          updated_at?: string | null
          user_id?: string
          widgets?: Json
        }
        Relationships: []
      }
      exported_files: {
        Row: {
          content_type: string | null
          created_at: string | null
          download_count: number | null
          expires_at: string | null
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          content_type?: string | null
          created_at?: string | null
          download_count?: number | null
          expires_at?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          file_type: string
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          content_type?: string | null
          created_at?: string | null
          download_count?: number | null
          expires_at?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      market_cache: {
        Row: {
          created_at: string | null
          data: Json
          data_type: string
          expires_at: string
          market: string
          symbol: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          data: Json
          data_type: string
          expires_at: string
          market?: string
          symbol: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          data?: Json
          data_type?: string
          expires_at?: string
          market?: string
          symbol?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          model_used: string | null
          role: string
          tokens_used: number | null
        }
        Insert: {
          content: string
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          model_used?: string | null
          role: string
          tokens_used?: number | null
        }
        Update: {
          content?: string
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          model_used?: string | null
          role?: string
          tokens_used?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          alert_notifications: boolean | null
          created_at: string | null
          email_enabled: boolean | null
          id: string
          market_notifications: boolean | null
          news_notifications: boolean | null
          push_enabled: boolean | null
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          system_notifications: boolean | null
          timezone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          alert_notifications?: boolean | null
          created_at?: string | null
          email_enabled?: boolean | null
          id?: string
          market_notifications?: boolean | null
          news_notifications?: boolean | null
          push_enabled?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          system_notifications?: boolean | null
          timezone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          alert_notifications?: boolean | null
          created_at?: string | null
          email_enabled?: boolean | null
          id?: string
          market_notifications?: boolean | null
          news_notifications?: boolean | null
          push_enabled?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          system_notifications?: boolean | null
          timezone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          data: Json | null
          expires_at: string | null
          id: string
          message: string
          priority: string | null
          read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          expires_at?: string | null
          id?: string
          message: string
          priority?: string | null
          read?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          expires_at?: string | null
          id?: string
          message?: string
          priority?: string | null
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          first_name: string | null
          full_name: string | null
          id: string
          last_name: string | null
          preferences: Json | null
          subscription_tier: string | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          first_name?: string | null
          full_name?: string | null
          id: string
          last_name?: string | null
          preferences?: Json | null
          subscription_tier?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          first_name?: string | null
          full_name?: string | null
          id?: string
          last_name?: string | null
          preferences?: Json | null
          subscription_tier?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      saved_analysis: {
        Row: {
          analysis_type: string
          created_at: string | null
          data: Json
          id: string
          is_public: boolean | null
          market: string | null
          symbol: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          analysis_type: string
          created_at?: string | null
          data: Json
          id?: string
          is_public?: boolean | null
          market?: string | null
          symbol?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          analysis_type?: string
          created_at?: string | null
          data?: Json
          id?: string
          is_public?: boolean | null
          market?: string | null
          symbol?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      sentiment_cache: {
        Row: {
          confidence: number
          created_at: string | null
          expires_at: string | null
          id: string
          language: string
          model_used: string
          score: number
          sentiment: string
          text_hash: string
        }
        Insert: {
          confidence: number
          created_at?: string | null
          expires_at?: string | null
          id?: string
          language?: string
          model_used?: string
          score: number
          sentiment: string
          text_hash: string
        }
        Update: {
          confidence?: number
          created_at?: string | null
          expires_at?: string | null
          id?: string
          language?: string
          model_used?: string
          score?: number
          sentiment?: string
          text_hash?: string
        }
        Relationships: []
      }
      user_alerts: {
        Row: {
          alert_type: string
          condition_type: string
          created_at: string | null
          id: string
          is_active: boolean | null
          market: string | null
          metadata: Json | null
          symbol: string
          target_value: number | null
          triggered_at: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          alert_type: string
          condition_type: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          market?: string | null
          metadata?: Json | null
          symbol: string
          target_value?: number | null
          triggered_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          alert_type?: string
          condition_type?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          market?: string | null
          metadata?: Json | null
          symbol?: string
          target_value?: number | null
          triggered_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      watchlist: {
        Row: {
          alerts: Json | null
          created_at: string | null
          id: string
          market: string | null
          name: string | null
          notes: string | null
          position: number | null
          symbol: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          alerts?: Json | null
          created_at?: string | null
          id?: string
          market?: string | null
          name?: string | null
          notes?: string | null
          position?: number | null
          symbol: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          alerts?: Json | null
          created_at?: string | null
          id?: string
          market?: string | null
          name?: string | null
          notes?: string | null
          position?: number | null
          symbol?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_price_alerts: {
        Args: { symbol_param: string; current_price: number }
        Returns: {
          alert_id: string
          user_id: string
          alert_type: string
          condition_type: string
          target_value: number
        }[]
      }
      cleanup_expired_cache: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_expired_files: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      cleanup_expired_notifications: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      create_default_dashboard_layout: {
        Args: { user_id_param: string }
        Returns: string
      }
      trigger_alert: {
        Args: { alert_id_param: string; current_price: number }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

