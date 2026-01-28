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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      contact_submissions: {
        Row: {
          created_at: string | null
          email: string
          id: string
          message: string
          name: string
          subject: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          message: string
          name: string
          subject?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          message?: string
          name?: string
          subject?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      error_logs: {
        Row: {
          created_at: string | null
          error_message: string | null
          error_step: string | null
          guest_count: number | null
          id: string
          party_code: string | null
          party_id: string | null
          stack_trace: string | null
          url: string | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          error_step?: string | null
          guest_count?: number | null
          id?: string
          party_code?: string | null
          party_id?: string | null
          stack_trace?: string | null
          url?: string | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          error_step?: string | null
          guest_count?: number | null
          id?: string
          party_code?: string | null
          party_id?: string | null
          stack_trace?: string | null
          url?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      game_completions: {
        Row: {
          completed_at: string | null
          completed_by_google_id: string | null
          id: string
          notes: string | null
          party_id: string
          photo_url: string | null
          station_id: string
        }
        Insert: {
          completed_at?: string | null
          completed_by_google_id?: string | null
          id?: string
          notes?: string | null
          party_id: string
          photo_url?: string | null
          station_id: string
        }
        Update: {
          completed_at?: string | null
          completed_by_google_id?: string | null
          id?: string
          notes?: string | null
          party_id?: string
          photo_url?: string | null
          station_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_completions_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["party_id"]
          },
          {
            foreignKeyName: "game_completions_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_completions_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "game_stations"
            referencedColumns: ["station_id"]
          },
        ]
      }
      game_stations: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          requires_upload: boolean | null
          station_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order: number
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          requires_upload?: boolean | null
          station_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          requires_upload?: boolean | null
          station_id?: string
        }
        Relationships: []
      }
      gift_submissions: {
        Row: {
          amount: string | null
          id: string
          message: string | null
          party_id: string | null
          party_name: string
          screenshot_url: string
          submitted_at: string | null
        }
        Insert: {
          amount?: string | null
          id?: string
          message?: string | null
          party_id?: string | null
          party_name: string
          screenshot_url: string
          submitted_at?: string | null
        }
        Update: {
          amount?: string | null
          id?: string
          message?: string | null
          party_id?: string | null
          party_name?: string
          screenshot_url?: string
          submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gift_submissions_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["party_id"]
          },
          {
            foreignKeyName: "gift_submissions_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
        ]
      }
      guests: {
        Row: {
          age_group: string | null
          attendance_probability: number | null
          created_at: string
          dietary_requirements: string | null
          drinks_alcohol: boolean | null
          email: string | null
          first_name: string | null
          food_preference: string | null
          id: string
          internal_name: string | null
          party_id: string | null
          phone: string | null
          rsvp_status: string | null
          table_number: string | null
        }
        Insert: {
          age_group?: string | null
          attendance_probability?: number | null
          created_at?: string
          dietary_requirements?: string | null
          drinks_alcohol?: boolean | null
          email?: string | null
          first_name?: string | null
          food_preference?: string | null
          id?: string
          internal_name?: string | null
          party_id?: string | null
          phone?: string | null
          rsvp_status?: string | null
          table_number?: string | null
        }
        Update: {
          age_group?: string | null
          attendance_probability?: number | null
          created_at?: string
          dietary_requirements?: string | null
          drinks_alcohol?: boolean | null
          email?: string | null
          first_name?: string | null
          food_preference?: string | null
          id?: string
          internal_name?: string | null
          party_id?: string | null
          phone?: string | null
          rsvp_status?: string | null
          table_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guests_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["party_id"]
          },
          {
            foreignKeyName: "guests_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
        ]
      }
      live_quiz_answers: {
        Row: {
          answer: string
          answered_at: string | null
          id: string
          is_correct: boolean
          party_id: string
          points_earned: number | null
          question_id: string
          session_id: string
          time_taken_ms: number | null
        }
        Insert: {
          answer: string
          answered_at?: string | null
          id?: string
          is_correct?: boolean
          party_id: string
          points_earned?: number | null
          question_id: string
          session_id: string
          time_taken_ms?: number | null
        }
        Update: {
          answer?: string
          answered_at?: string | null
          id?: string
          is_correct?: boolean
          party_id?: string
          points_earned?: number | null
          question_id?: string
          session_id?: string
          time_taken_ms?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "live_quiz_answers_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["party_id"]
          },
          {
            foreignKeyName: "live_quiz_answers_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_quiz_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_quiz_answers_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "live_quiz_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      live_quiz_participants: {
        Row: {
          correct_answers: number | null
          has_games_bonus: boolean | null
          id: string
          joined_at: string | null
          party_id: string
          party_name: string
          session_id: string
          total_score: number | null
        }
        Insert: {
          correct_answers?: number | null
          has_games_bonus?: boolean | null
          id?: string
          joined_at?: string | null
          party_id: string
          party_name: string
          session_id: string
          total_score?: number | null
        }
        Update: {
          correct_answers?: number | null
          has_games_bonus?: boolean | null
          id?: string
          joined_at?: string | null
          party_id?: string
          party_name?: string
          session_id?: string
          total_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "live_quiz_participants_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["party_id"]
          },
          {
            foreignKeyName: "live_quiz_participants_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_quiz_participants_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "live_quiz_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      live_quiz_sessions: {
        Row: {
          created_at: string | null
          current_question_id: string | null
          current_question_index: number | null
          ended_at: string | null
          id: string
          question_set: string | null
          question_started_at: string | null
          started_at: string | null
          status: string
          time_limit_seconds: number | null
        }
        Insert: {
          created_at?: string | null
          current_question_id?: string | null
          current_question_index?: number | null
          ended_at?: string | null
          id?: string
          question_set?: string | null
          question_started_at?: string | null
          started_at?: string | null
          status?: string
          time_limit_seconds?: number | null
        }
        Update: {
          created_at?: string | null
          current_question_id?: string | null
          current_question_index?: number | null
          ended_at?: string | null
          id?: string
          question_set?: string | null
          question_started_at?: string | null
          started_at?: string | null
          status?: string
          time_limit_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "live_quiz_sessions_current_question_id_fkey"
            columns: ["current_question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      logistics: {
        Row: {
          accommodation_name: string | null
          created_at: string
          flight_number: string | null
          has_own_transport: boolean | null
          id: string
          notes: string | null
          party_id: string | null
          pickup_location: string | null
          pickup_time: string | null
          pickup_type: string | null
          updated_at: string
        }
        Insert: {
          accommodation_name?: string | null
          created_at?: string
          flight_number?: string | null
          has_own_transport?: boolean | null
          id?: string
          notes?: string | null
          party_id?: string | null
          pickup_location?: string | null
          pickup_time?: string | null
          pickup_type?: string | null
          updated_at?: string
        }
        Update: {
          accommodation_name?: string | null
          created_at?: string
          flight_number?: string | null
          has_own_transport?: boolean | null
          id?: string
          notes?: string | null
          party_id?: string | null
          pickup_location?: string | null
          pickup_time?: string | null
          pickup_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "logistics_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: true
            referencedRelation: "leaderboard"
            referencedColumns: ["party_id"]
          },
          {
            foreignKeyName: "logistics_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: true
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
        ]
      }
      parties: {
        Row: {
          code: string | null
          created_at: string
          from_side: string | null
          google_email: string | null
          google_user_id: string | null
          id: string
          legacy_id: number | null
          name: string
          status: string | null
          type: string | null
        }
        Insert: {
          code?: string | null
          created_at?: string
          from_side?: string | null
          google_email?: string | null
          google_user_id?: string | null
          id?: string
          legacy_id?: number | null
          name: string
          status?: string | null
          type?: string | null
        }
        Update: {
          code?: string | null
          created_at?: string
          from_side?: string | null
          google_email?: string | null
          google_user_id?: string | null
          id?: string
          legacy_id?: number | null
          name?: string
          status?: string | null
          type?: string | null
        }
        Relationships: []
      }
      quiz_questions: {
        Row: {
          correct_answer: string
          created_at: string | null
          display_order: number
          id: string
          image_url: string | null
          is_active: boolean | null
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          points: number | null
          question: string
          question_set: string | null
        }
        Insert: {
          correct_answer: string
          created_at?: string | null
          display_order: number
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          points?: number | null
          question: string
          question_set?: string | null
        }
        Update: {
          correct_answer?: string
          created_at?: string | null
          display_order?: number
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          option_a?: string
          option_b?: string
          option_c?: string
          option_d?: string
          points?: number | null
          question?: string
          question_set?: string | null
        }
        Relationships: []
      }
      quiz_submissions: {
        Row: {
          answers: Json | null
          completed_at: string | null
          id: string
          party_id: string
          started_at: string | null
          submitted_by_google_id: string | null
          time_taken_seconds: number | null
          total_questions: number | null
          total_score: number | null
        }
        Insert: {
          answers?: Json | null
          completed_at?: string | null
          id?: string
          party_id: string
          started_at?: string | null
          submitted_by_google_id?: string | null
          time_taken_seconds?: number | null
          total_questions?: number | null
          total_score?: number | null
        }
        Update: {
          answers?: Json | null
          completed_at?: string | null
          id?: string
          party_id?: string
          started_at?: string | null
          submitted_by_google_id?: string | null
          time_taken_seconds?: number | null
          total_questions?: number | null
          total_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_submissions_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: true
            referencedRelation: "leaderboard"
            referencedColumns: ["party_id"]
          },
          {
            foreignKeyName: "quiz_submissions_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: true
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
        ]
      }
      rsvp_submissions: {
        Row: {
          accommodation: boolean | null
          attendance: string
          created_at: string | null
          dietary: string | null
          email: string
          first_thought: string | null
          guests: number | null
          id: string
          line: string | null
          love_song: string | null
          message: string | null
          name: string
          nickname: string | null
          phone: string | null
          transportation: boolean | null
          updated_at: string | null
        }
        Insert: {
          accommodation?: boolean | null
          attendance: string
          created_at?: string | null
          dietary?: string | null
          email: string
          first_thought?: string | null
          guests?: number | null
          id?: string
          line?: string | null
          love_song?: string | null
          message?: string | null
          name: string
          nickname?: string | null
          phone?: string | null
          transportation?: boolean | null
          updated_at?: string | null
        }
        Update: {
          accommodation?: boolean | null
          attendance?: string
          created_at?: string | null
          dietary?: string | null
          email?: string
          first_thought?: string | null
          guests?: number | null
          id?: string
          line?: string | null
          love_song?: string | null
          message?: string | null
          name?: string
          nickname?: string | null
          phone?: string | null
          transportation?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      leaderboard: {
        Row: {
          completed_at: string | null
          from_side: string | null
          games_completed: number | null
          party_id: string | null
          party_name: string | null
          rank: number | null
          time_taken_seconds: number | null
          total_questions: number | null
          total_score: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      bulk_update_guests: { Args: { guest_updates: Json }; Returns: Json }
      increment_participant_score: {
        Args: {
          p_is_correct?: boolean
          p_party_id: string
          p_points: number
          p_session_id: string
        }
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
