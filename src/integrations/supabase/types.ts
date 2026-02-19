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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      holdings: {
        Row: {
          avg_cost: number
          created_at: string
          id: string
          shares: number
          ticker: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avg_cost?: number
          created_at?: string
          id?: string
          shares?: number
          ticker: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avg_cost?: number
          created_at?: string
          id?: string
          shares?: number
          ticker?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          created_at: string
          id: string
          quantity: number
          side: string
          status: string
          ticker: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          quantity: number
          side: string
          status?: string
          ticker: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          quantity?: number
          side?: string
          status?: string
          ticker?: string
          user_id?: string
        }
        Relationships: []
      }
      portfolio_history: {
        Row: {
          created_at: string
          date: string
          id: string
          total_net_liquidity: number
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          total_net_liquidity?: number
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          total_net_liquidity?: number
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          cash_balance: number
          created_at: string
          email: string | null
          full_name: string | null
          id: string
        }
        Insert: {
          cash_balance?: number
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
        }
        Update: {
          cash_balance?: number
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
        }
        Relationships: []
      }
      spy_daily_cache: {
        Row: {
          close_price: number
          date: string
          fetched_at: string
        }
        Insert: {
          close_price: number
          date: string
          fetched_at?: string
        }
        Update: {
          close_price?: number
          date?: string
          fetched_at?: string
        }
        Relationships: []
      }
      stock_scores: {
        Row: {
          fundamentals: number | null
          industry: string | null
          momentum: number | null
          name: string | null
          rank_ic: number | null
          risk: number | null
          sector: string | null
          sentiment: number | null
          style: string | null
          ticker: string
          updated_at: string
          v_score: number | null
          weights: string | null
          why_explanation: string | null
        }
        Insert: {
          fundamentals?: number | null
          industry?: string | null
          momentum?: number | null
          name?: string | null
          rank_ic?: number | null
          risk?: number | null
          sector?: string | null
          sentiment?: number | null
          style?: string | null
          ticker: string
          updated_at?: string
          v_score?: number | null
          weights?: string | null
          why_explanation?: string | null
        }
        Update: {
          fundamentals?: number | null
          industry?: string | null
          momentum?: number | null
          name?: string | null
          rank_ic?: number | null
          risk?: number | null
          sector?: string | null
          sentiment?: number | null
          style?: string | null
          ticker?: string
          updated_at?: string
          v_score?: number | null
          weights?: string | null
          why_explanation?: string | null
        }
        Relationships: []
      }
      stock_universe: {
        Row: {
          added_at: string
          industry: string | null
          market_cap: string | null
          name: string | null
          sector: string | null
          ticker: string
        }
        Insert: {
          added_at?: string
          industry?: string | null
          market_cap?: string | null
          name?: string | null
          sector?: string | null
          ticker: string
        }
        Update: {
          added_at?: string
          industry?: string | null
          market_cap?: string | null
          name?: string | null
          sector?: string | null
          ticker?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          created_at: string
          id: string
          price: number
          shares: number
          ticker: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          price: number
          shares: number
          ticker: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          price?: number
          shares?: number
          ticker?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      execute_trade: {
        Args: {
          p_price: number
          p_shares: number
          p_ticker: string
          p_type: string
        }
        Returns: undefined
      }
      fill_queued_order: {
        Args: { p_order_id: string; p_price: number }
        Returns: string
      }
      rebuild_holdings_from_transactions: { Args: never; Returns: string }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
