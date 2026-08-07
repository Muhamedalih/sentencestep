/**
 * Hand-written foundation for the Supabase schema. Once the project is linked,
 * replace this with `supabase gen types typescript` output and re-export it here
 * so the rest of the app keeps importing from "@/types/database".
 */
import type { LearningMode } from "@/types/content";

export type SubscriptionStatus = "free" | "trialing" | "active" | "canceled" | "past_due";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_id: string;
          display_name: string | null;
          preferred_language: "ar" | "en";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          display_name?: string | null;
          preferred_language?: "ar" | "en";
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
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
      };
      user_progress: {
        Row: {
          id: string;
          user_id: string;
          mode: LearningMode;
          unit_id: string;
          completed_at: string | null;
          accuracy: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          mode: LearningMode;
          unit_id: string;
          completed_at?: string | null;
          accuracy?: number | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["user_progress"]["Insert"]>;
      };
      streaks: {
        Row: {
          id: string;
          user_id: string;
          current_streak: number;
          longest_streak: number;
          last_active_date: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          current_streak?: number;
          longest_streak?: number;
          last_active_date?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["streaks"]["Insert"]>;
      };
    };
  };
}
