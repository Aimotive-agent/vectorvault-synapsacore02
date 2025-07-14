export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      ai_chat_messages: {
        Row: {
          content: string
          created_at: string
          file_attachments: Json | null
          id: string
          model_used: string | null
          provider_used: string | null
          role: string
          session_id: string
          tool_calls: Json | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          file_attachments?: Json | null
          id?: string
          model_used?: string | null
          provider_used?: string | null
          role: string
          session_id: string
          tool_calls?: Json | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          file_attachments?: Json | null
          id?: string
          model_used?: string | null
          provider_used?: string | null
          role?: string
          session_id?: string
          tool_calls?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "ai_chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_chat_sessions: {
        Row: {
          created_at: string
          id: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_settings: {
        Row: {
          created_at: string
          id: string
          max_tokens: number | null
          openai_api_key: string | null
          openrouter_api_key: string | null
          provider: string
          selected_model: string
          system_prompt: string | null
          temperature: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          max_tokens?: number | null
          openai_api_key?: string | null
          openrouter_api_key?: string | null
          provider?: string
          selected_model?: string
          system_prompt?: string | null
          temperature?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          max_tokens?: number | null
          openai_api_key?: string | null
          openrouter_api_key?: string | null
          provider?: string
          selected_model?: string
          system_prompt?: string | null
          temperature?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          goal_id: string
          id: string
          sender: string
          timestamp: number
        }
        Insert: {
          content: string
          created_at?: string
          goal_id: string
          id?: string
          sender: string
          timestamp: number
        }
        Update: {
          content?: string
          created_at?: string
          goal_id?: string
          id?: string
          sender?: string
          timestamp?: number
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      files: {
        Row: {
          created_at: string
          file_size: number | null
          file_type: string | null
          goal_id: string | null
          id: string
          name: string
          step_id: string | null
          task_id: string | null
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          file_size?: number | null
          file_type?: string | null
          goal_id?: string | null
          id?: string
          name: string
          step_id?: string | null
          task_id?: string | null
          url: string
          user_id: string
        }
        Update: {
          created_at?: string
          file_size?: number | null
          file_type?: string | null
          goal_id?: string | null
          id?: string
          name?: string
          step_id?: string | null
          task_id?: string | null
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "files_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "files_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "steps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "files_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          category: string | null
          created_at: string
          current_step: number | null
          description: string | null
          id: string
          progress: number | null
          start_date: string | null
          title: string
          total_steps: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          current_step?: number | null
          description?: string | null
          id?: string
          progress?: number | null
          start_date?: string | null
          title: string
          total_steps?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          current_step?: number | null
          description?: string | null
          id?: string
          progress?: number | null
          start_date?: string | null
          title?: string
          total_steps?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notes: {
        Row: {
          content: string
          created_at: string
          id: string
          step_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          step_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          step_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "steps"
            referencedColumns: ["id"]
          },
        ]
      }
      resources: {
        Row: {
          created_at: string
          id: string
          name: string | null
          step_id: string
          task_id: string | null
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string | null
          step_id: string
          task_id?: string | null
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string | null
          step_id?: string
          task_id?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "resources_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "steps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resources_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      steps: {
        Row: {
          created_at: string
          description: string | null
          goal_id: string
          id: string
          is_completed: boolean | null
          step_order: number
          title: string
          unlocked: boolean | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          goal_id: string
          id?: string
          is_completed?: boolean | null
          step_order: number
          title: string
          unlocked?: boolean | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          goal_id?: string
          id?: string
          is_completed?: boolean | null
          step_order?: number
          title?: string
          unlocked?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "steps_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          completed: boolean | null
          created_at: string
          due_date: string | null
          goal_id: string | null
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          created_at?: string
          due_date?: string | null
          goal_id?: string | null
          id?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean | null
          created_at?: string
          due_date?: string | null
          goal_id?: string | null
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      user_api_keys: {
        Row: {
          created_at: string
          id: string
          key_name: string
          key_value: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          key_name: string
          key_value: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          key_name?: string
          key_value?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          created_at: string
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          is_trial: boolean | null
          subscription_end_date: string | null
          subscription_start_date: string | null
          subscription_tier: string | null
          trial_end_date: string | null
          trial_start_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_trial?: boolean | null
          subscription_end_date?: string | null
          subscription_start_date?: string | null
          subscription_tier?: string | null
          trial_end_date?: string | null
          trial_start_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_trial?: boolean | null
          subscription_end_date?: string | null
          subscription_start_date?: string | null
          subscription_tier?: string | null
          trial_end_date?: string | null
          trial_start_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
