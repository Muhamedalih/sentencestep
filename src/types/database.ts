/**
 * Hand-written foundation for the Supabase schema, mirroring
 * supabase/migrations/20250101000000_init_schema.sql. Once the project is
 * linked, replace this with `supabase gen types typescript` output and
 * re-export it here so the rest of the app keeps importing from
 * "@/types/database".
 */
import type { LearningMode } from "@/types/content";

export type SubscriptionStatus = "free" | "trialing" | "active" | "canceled" | "past_due";

export interface Database {
  public: {
    Tables: {
      levels: {
        Row: {
          id: string;
          mode: LearningMode;
          index: number;
          title: string;
          title_ar: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          mode: LearningMode;
          index: number;
          title: string;
          title_ar: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["levels"]["Insert"]>;
        Relationships: [];
      };
      lessons: {
        Row: {
          id: string;
          mode: LearningMode;
          level_id: string;
          order_index: number;
          title: string;
          title_ar: string;
          is_free: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          mode: LearningMode;
          level_id: string;
          order_index: number;
          title: string;
          title_ar: string;
          is_free?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["lessons"]["Insert"]>;
        Relationships: [];
      };
      sentences: {
        Row: {
          id: string;
          lesson_id: string;
          order_index: number;
          en: string;
          ar: string;
          speaker: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          lesson_id: string;
          order_index: number;
          en: string;
          ar: string;
          speaker?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["sentences"]["Insert"]>;
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          preferred_language: "ar" | "en";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          preferred_language?: "ar" | "en";
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          status: SubscriptionStatus;
          current_period_end: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          status?: SubscriptionStatus;
          current_period_end?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["subscriptions"]["Insert"]>;
        Relationships: [];
      };
      user_progress: {
        Row: {
          id: string;
          user_id: string;
          lesson_id: string;
          mode: LearningMode;
          completed_at: string | null;
          accuracy: number | null;
          attempt_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          lesson_id: string;
          mode: LearningMode;
          completed_at?: string | null;
          accuracy?: number | null;
          attempt_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["user_progress"]["Insert"]>;
        Relationships: [];
      };
      streaks: {
        Row: {
          id: string;
          user_id: string;
          current_streak: number;
          longest_streak: number;
          last_active_date: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          current_streak?: number;
          longest_streak?: number;
          last_active_date?: string | null;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["streaks"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
