/**
 * Hand-written foundation for the Supabase schema, mirroring
 * supabase/migrations/20250101000000_init_schema.sql. Once the project is
 * linked, replace this with `supabase gen types typescript` output and
 * re-export it here so the rest of the app keeps importing from
 * "@/types/database".
 */
import type { LearningMode } from "@/types/content";
import type { SupportLocale } from "@/lib/i18n/locales";

export type SubscriptionStatus =
  "free" | "trialing" | "active" | "past_due" | "canceled" | "expired";

/** The review state of the value currently stored in a content_translations row — see 20250123000000_translation_lifecycle_foundation.sql. */
export type TranslationStatus = "ai_generated" | "approved" | "failed";

/** A lesson's job within its unit — see 20250146000000_curriculum_units.sql. */
export type LessonRole = "establish" | "build" | "integrate";

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
          /** A handful of standalone example sentences shown on the "Start Simple" homepage preview — not tied to any lesson. Admin-editable (see src/lib/admin/content-actions.ts's updateLevelPreview). */
          preview_sentences: { en: string; ar: string }[];
          created_at: string;
        };
        Insert: {
          id?: string;
          mode: LearningMode;
          index: number;
          title: string;
          title_ar: string;
          preview_sentences?: { en: string; ar: string }[];
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
          /** Short blurb shown on lesson cards — what the lesson is about, not its content. */
          description: string | null;
          description_ar: string | null;
          is_free: boolean;
          status: "draft" | "published" | "archived";
          illustration_url: string | null;
          voice_id: string | null;
          /** The unit this lesson belongs to, if any — see 20250146000000_curriculum_units.sql. Null for lessons not yet assigned to a unit (every Stories/Conversation lesson today, plus any future Normal lesson pending assignment). */
          unit_id: string | null;
          /** This lesson's job within its unit (see LessonRole) — null exactly when unit_id is null. */
          role: LessonRole | null;
          /** Opts this lesson out of the bulk/cron narration-generation sweep (see 20250217000000_voice_generation_exclusion.sql) without unpublishing it. */
          voice_generation_excluded: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          mode: LearningMode;
          level_id: string;
          order_index: number;
          title: string;
          title_ar: string;
          description?: string | null;
          description_ar?: string | null;
          is_free?: boolean;
          status?: "draft" | "published" | "archived";
          illustration_url?: string | null;
          voice_id?: string | null;
          unit_id?: string | null;
          role?: LessonRole | null;
          voice_generation_excluded?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["lessons"]["Insert"]>;
        Relationships: [];
      };
      units: {
        Row: {
          id: string;
          mode: LearningMode;
          level_id: string;
          order_index: number;
          title: string;
          /** One-sentence statement of what the unit's four lessons build toward together — see 20250146000000_curriculum_units.sql. */
          objective: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          mode: LearningMode;
          level_id: string;
          order_index: number;
          title: string;
          objective: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["units"]["Insert"]>;
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
          audio_url: string | null;
          word_translations: { en: string; ar: string }[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          lesson_id: string;
          order_index: number;
          en: string;
          ar: string;
          speaker?: string | null;
          audio_url?: string | null;
          word_translations?: { en: string; ar: string }[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["sentences"]["Insert"]>;
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          /** Learner-support/interface language. Never "en": English is the language being learned, not a support-language option (see supabase/migrations/20250122000000_locale_foundation.sql and 20250125000000_turkish_locale_onboarding.sql). Matches SupportLocale (src/lib/i18n/locales.ts), which is wider than SUPPORT_LOCALES — a value here isn't proof a locale is offered to learners yet. */
          preferred_language: "ar" | "es" | "tr";
          /** IANA timezone (e.g. "Asia/Baghdad"), captured client-side when known. Null until then — never inferred from a user's location. */
          timezone: string | null;
          /** Unused since the header/account-menu redesign replaced the animal-sticker picker with a deterministic initials avatar (see InitialsAvatar) — column kept only so a legacy pre-redesign value isn't lost, never read by the app any more. */
          avatar_id: string | null;
          /** The learner's own daily sentence-count target (see src/lib/progress/daily-goal.ts) — defaults to DEFAULT_DAILY_GOAL (5), editable from Settings. */
          daily_goal: number;
          /** Null until the first-time placement picker has been shown; 0 means "asked, no preference"; a positive integer is the chosen tier level (matching src/data/units.ts) — see StartingLevelOnboarding. */
          starting_level: number | null;
          /** Lowercase ISO 3166-1 alpha-2 code (matching CountryCode, src/lib/i18n/country-codes.ts), or null until CountryOnboarding has been answered. */
          country: string | null;
          role: "user" | "editor" | "admin";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          preferred_language?: "ar" | "es" | "tr";
          timezone?: string | null;
          avatar_id?: string | null;
          daily_goal?: number;
          starting_level?: number | null;
          country?: string | null;
          role?: "user" | "editor" | "admin";
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      push_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["push_subscriptions"]["Insert"]>;
        Relationships: [];
      };
      email_preferences: {
        Row: {
          user_id: string;
          learning_reminders: boolean;
          progress_emails: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          learning_reminders?: boolean;
          progress_emails?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["email_preferences"]["Insert"]>;
        Relationships: [];
      };
      notification_events: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          dedupe_key: string;
          payload: unknown;
          email_status: "queued" | "sent" | "skipped";
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          dedupe_key: string;
          payload: unknown;
          email_status?: "queued" | "sent" | "skipped";
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["notification_events"]["Insert"]>;
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          plan: "free" | "premium";
          status: SubscriptionStatus;
          current_period_start: string | null;
          current_period_end: string | null;
          cancel_at_period_end: boolean;
          provider: string | null;
          provider_customer_id: string | null;
          provider_subscription_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan?: "free" | "premium";
          status?: SubscriptionStatus;
          current_period_start?: string | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          provider?: string | null;
          provider_customer_id?: string | null;
          provider_subscription_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["subscriptions"]["Insert"]>;
        Relationships: [];
      };
      billing_events: {
        Row: {
          id: string;
          provider: string;
          type: string;
          payload: unknown;
          processed_at: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          provider: string;
          type: string;
          payload: unknown;
          processed_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["billing_events"]["Insert"]>;
        Relationships: [];
      };
      payment_orders: {
        Row: {
          id: string;
          user_id: string;
          reference_id: string;
          provider: string;
          provider_env: "live" | "test";
          provider_payment_id: string | null;
          pricing_tier: "A" | "B";
          pricing_country: string | null;
          pricing_country_source: "netlify_geo" | "default";
          price_usd_cents: number;
          fx_rate_per_usd: number;
          charge_amount: number;
          charge_currency: string;
          premium_days: number;
          status:
            | "created"
            | "pending"
            | "fulfilled"
            | "failed"
            | "cancelled"
            | "expired"
            | "needs_review";
          provider_status: string | null;
          checkout_url: string | null;
          link_expires_at: string | null;
          paid_at: string | null;
          fulfilled_at: string | null;
          premium_period_start: string | null;
          premium_period_end: string | null;
          failure_reason: string | null;
          last_verified_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          reference_id: string;
          provider: string;
          provider_env: "live" | "test";
          provider_payment_id?: string | null;
          pricing_tier: "A" | "B";
          pricing_country?: string | null;
          pricing_country_source: "netlify_geo" | "default";
          price_usd_cents: number;
          fx_rate_per_usd: number;
          charge_amount: number;
          charge_currency: string;
          premium_days: number;
          status?: Database["public"]["Tables"]["payment_orders"]["Row"]["status"];
          provider_status?: string | null;
          checkout_url?: string | null;
          link_expires_at?: string | null;
          paid_at?: string | null;
          fulfilled_at?: string | null;
          premium_period_start?: string | null;
          premium_period_end?: string | null;
          failure_reason?: string | null;
          last_verified_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["payment_orders"]["Insert"]>;
        Relationships: [];
      };
      access_settings: {
        Row: {
          id: number;
          /** Sitewide "everything is free" promotion switch — see src/lib/billing/access.ts. */
          free_for_all: boolean;
          /** Bonus days added to every purchase while the launch offer runs; 0 means no offer — see src/lib/billing/launch-offer.ts. */
          launch_offer_bonus_days: number;
          /** The last day of the launch offer (it runs through the end of that day, UTC). */
          launch_offer_ends_on: string | null;
          updated_at: string;
        };
        Insert: {
          id?: number;
          free_for_all?: boolean;
          launch_offer_bonus_days?: number;
          launch_offer_ends_on?: string | null;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["access_settings"]["Insert"]>;
        Relationships: [];
      };
      activity_days: {
        Row: {
          user_id: string;
          day: string;
          sentences: number;
          xp: number;
          /** 'active' = practiced; 'grace'/'frozen' = a missed day the streak was carried across (see src/lib/features/streak-freeze.ts). */
          kind: "active" | "grace" | "frozen";
          updated_at: string;
        };
        Insert: {
          user_id: string;
          day: string;
          sentences?: number;
          xp?: number;
          kind?: "active" | "grace" | "frozen";
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["activity_days"]["Insert"]>;
        Relationships: [];
      };
      streak_freeze_usage: {
        Row: {
          user_id: string;
          /** 'YYYY-MM' the `used` count applies to. */
          period: string;
          used: number;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          period: string;
          used?: number;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["streak_freeze_usage"]["Insert"]>;
        Relationships: [];
      };
      daily_quests: {
        Row: {
          user_id: string;
          quest_date: string;
          slot: number;
          quest_type: string;
          target: number;
          xp: number;
          progress: number;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          quest_date: string;
          slot: number;
          quest_type: string;
          target: number;
          xp?: number;
          progress?: number;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["daily_quests"]["Insert"]>;
        Relationships: [];
      };
      user_badges: {
        Row: {
          user_id: string;
          badge_id: string;
          earned_at: string;
          seen_at: string | null;
        };
        Insert: {
          user_id: string;
          badge_id: string;
          earned_at?: string;
          seen_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["user_badges"]["Insert"]>;
        Relationships: [];
      };
      saved_words: {
        Row: {
          id: string;
          user_id: string;
          word: string;
          meaning: string;
          mode: "normal" | "stories";
          lesson_id: string;
          lesson_title: string;
          sentence_id: string | null;
          sentence_en: string;
          word_index: number;
          review_stage: number;
          next_review_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          word: string;
          meaning: string;
          mode: "normal" | "stories";
          lesson_id: string;
          lesson_title: string;
          sentence_id?: string | null;
          sentence_en: string;
          word_index: number;
          review_stage?: number;
          next_review_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["saved_words"]["Insert"]>;
        Relationships: [];
      };
      daily_sessions: {
        Row: {
          user_id: string;
          session_date: string;
          completed_at: string;
          xp: number;
        };
        Insert: {
          user_id: string;
          session_date: string;
          completed_at?: string;
          xp?: number;
        };
        Update: Partial<Database["public"]["Tables"]["daily_sessions"]["Insert"]>;
        Relationships: [];
      };
      feature_settings: {
        Row: {
          id: number;
          /** The whole feature-availability document — validated by sanitizeFeatureConfig (src/lib/features/config.ts), never trusted as-is. */
          config: unknown;
          updated_at: string;
        };
        Insert: {
          id?: number;
          config?: unknown;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["feature_settings"]["Insert"]>;
        Relationships: [];
      };
      analytics_events: {
        Row: {
          id: string;
          user_id: string | null;
          event_name: string;
          event_properties: unknown;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          event_name: string;
          event_properties?: unknown;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["analytics_events"]["Insert"]>;
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
      tts_settings: {
        Row: {
          id: number;
          voice_name: string | null;
          voice_lang: string | null;
          rate: number;
          pitch: number;
          volume: number;
          default_voice_id: string | null;
          /** Default voice for Word Lists (Cartesia) — separate from default_voice_id (Stories/Conversation's own default) and from elevenlabs_settings.default_story_voice_id (Stories/Books' own default). See 20250222000000_pronunciation_default_voice.sql. */
          default_pronunciation_voice_id: string | null;
          /** Default voice for Normal lessons / Daily Lessons (Hume AI) — see 20250225000000_normal_lesson_default_voice.sql. */
          default_normal_lesson_voice_id: string | null;
          updated_at: string;
        };
        Insert: {
          id?: number;
          voice_name?: string | null;
          voice_lang?: string | null;
          rate?: number;
          pitch?: number;
          volume?: number;
          default_voice_id?: string | null;
          default_pronunciation_voice_id?: string | null;
          default_normal_lesson_voice_id?: string | null;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["tts_settings"]["Insert"]>;
        Relationships: [];
      };
      voices: {
        Row: {
          id: string;
          name: string;
          source: string;
          provider_voice_id: string;
          gender: "female" | "male";
          accent: string;
          language: string;
          description: string | null;
          collection: string;
          sample_audio_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          name: string;
          source?: string;
          provider_voice_id: string;
          gender: "female" | "male";
          accent: string;
          language?: string;
          description?: string | null;
          collection: string;
          sample_audio_url?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["voices"]["Insert"]>;
        Relationships: [];
      };
      voice_audio_cache: {
        Row: {
          id: string;
          voice_id: string;
          text_hash: string;
          normalized_text: string;
          generation_version: string;
          audio_url: string | null;
          status: "generating" | "ready" | "failed";
          provider: string;
          model: string | null;
          voice_direction: unknown;
          duration_ms: number | null;
          attempts: number;
          last_error: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          voice_id: string;
          text_hash: string;
          normalized_text: string;
          generation_version: string;
          audio_url?: string | null;
          status?: "generating" | "ready" | "failed";
          provider?: string;
          model?: string | null;
          voice_direction?: unknown;
          duration_ms?: number | null;
          attempts?: number;
          last_error?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["voice_audio_cache"]["Insert"]>;
        Relationships: [];
      };
      sentence_word_timings: {
        Row: {
          id: string;
          content_type: "sentence" | "book_sentence";
          content_id: string;
          voice_id: string;
          words: unknown;
          status: "ready" | "skipped";
          created_at: string;
        };
        Insert: {
          id?: string;
          content_type: "sentence" | "book_sentence";
          content_id: string;
          voice_id: string;
          words: unknown;
          status?: "ready" | "skipped";
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["sentence_word_timings"]["Insert"]>;
        Relationships: [];
      };
      lesson_speaker_voices: {
        Row: {
          lesson_id: string;
          speaker: string;
          voice_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          lesson_id: string;
          speaker: string;
          voice_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["lesson_speaker_voices"]["Insert"]>;
        Relationships: [];
      };
      elevenlabs_settings: {
        Row: {
          id: number;
          model: string;
          default_story_voice_id: string | null;
          stability: number;
          similarity_boost: number;
          style: number;
          speed: number;
          use_speaker_boost: boolean;
          updated_at: string;
        };
        Insert: {
          id?: number;
          model?: string;
          default_story_voice_id?: string | null;
          stability?: number;
          similarity_boost?: number;
          style?: number;
          speed?: number;
          use_speaker_boost?: boolean;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["elevenlabs_settings"]["Insert"]>;
        Relationships: [];
      };
      typing_sound_settings: {
        Row: {
          id: number;
          enabled: boolean;
          sound_pack: string;
          volume: number;
          sentence_complete_sound: string;
          /** Only the LearningSection keys an admin has overridden (see src/lib/admin/typing-sound-settings.ts) — a missing key means "use sentence_complete_sound above." */
          section_sentence_complete_sounds: Record<string, unknown>;
          /** Independent of `enabled` above — gates the whole-lesson-completion sound (see src/lib/lesson-end-sounds.ts), which is itself desktop-only by design regardless of this flag. */
          lesson_end_sound_enabled: boolean;
          lesson_end_sound: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          enabled?: boolean;
          sound_pack?: string;
          volume?: number;
          sentence_complete_sound?: string;
          section_sentence_complete_sounds?: Record<string, unknown>;
          lesson_end_sound_enabled?: boolean;
          lesson_end_sound?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["typing_sound_settings"]["Insert"]>;
        Relationships: [];
      };
      onboarding_intro_card: {
        Row: {
          id: number;
          /** Admin-uploaded cover image (Supabase Storage, "onboarding-card" bucket) shown by the get-started flow's third step, before a first-time learner enters their opening lesson — null means "no image set yet" (see src/components/app/onboarding-intro-card.tsx's fallback). */
          image_url: string | null;
          /** Admin-uploaded image (same "onboarding-card" bucket) shown on the screen a learner sees right after finishing the opening lesson — independent of image_url above, null means "no image set yet" (see src/components/learning/onboarding-lesson-complete.tsx's fallback). */
          completion_image_url: string | null;
          title: string;
          /** Learner-facing headline for Arabic/Spanish/Turkish support locales — see title's own doc comment; these three, not title, are what OnboardingIntroCard actually renders. */
          title_ar: string;
          title_es: string;
          title_tr: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          image_url?: string | null;
          completion_image_url?: string | null;
          title?: string;
          title_ar?: string;
          title_es?: string;
          title_tr?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["onboarding_intro_card"]["Insert"]>;
        Relationships: [];
      };
      lesson_completion_theme: {
        Row: {
          id: number;
          /** The full LessonCompletionTheme object (see src/lib/admin/lesson-completion-theme.ts) — stored as jsonb since it's a large, presentation-only, purely additive set of fields. */
          theme: Record<string, unknown>;
          updated_at: string;
        };
        Insert: {
          id?: number;
          theme?: Record<string, unknown>;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["lesson_completion_theme"]["Insert"]>;
        Relationships: [];
      };
      lesson_color_settings: {
        Row: {
          id: number;
          /** Only the LessonColorRole keys an admin has overridden (see src/lib/admin/lesson-color-settings.ts) — stored as jsonb since a missing key deliberately means "use the code default." */
          colors: Record<string, unknown>;
          updated_at: string;
        };
        Insert: {
          id?: number;
          colors?: Record<string, unknown>;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["lesson_color_settings"]["Insert"]>;
        Relationships: [];
      };
      lesson_font_settings: {
        Row: {
          id: number;
          /** Only the LearningSection keys an admin has assigned a font to (see src/lib/admin/lesson-font-settings.ts) — a missing key means "keep that section's current default font." */
          fonts: Record<string, unknown>;
          updated_at: string;
        };
        Insert: {
          id?: number;
          fonts?: Record<string, unknown>;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["lesson_font_settings"]["Insert"]>;
        Relationships: [];
      };
      user_xp: {
        Row: {
          id: string;
          user_id: string;
          xp: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          xp?: number;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["user_xp"]["Insert"]>;
        Relationships: [];
      };
      daily_progress: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          sentences_completed: number;
          goal: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          sentences_completed?: number;
          goal?: number;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["daily_progress"]["Insert"]>;
        Relationships: [];
      };
      word_groups: {
        Row: {
          id: string;
          level: number;
          order_index: number;
          title: string;
          title_ar: string;
          description: string | null;
          description_ar: string | null;
          is_free: boolean;
          status: "draft" | "published" | "archived";
          /** Per-group narration voice override — mirrors books.voice_id (see 20250311000000_word_group_voice_override.sql). Null falls back to tts_settings.default_pronunciation_voice_id, exactly like a group with no override. Must resolve to an Edge-TTS voice; generateWordGroupVoiceDraft ignores it otherwise. */
          voice_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          level: number;
          order_index: number;
          title: string;
          title_ar: string;
          description?: string | null;
          description_ar?: string | null;
          is_free?: boolean;
          status?: "draft" | "published" | "archived";
          voice_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["word_groups"]["Insert"]>;
        Relationships: [];
      };
      vocabulary_words: {
        Row: {
          id: string;
          group_id: string;
          order_index: number;
          target_word: string;
          /** English context sentence containing a literal "___" in place of target_word — see BLANK_TOKEN in src/types/word-lists.ts. */
          sentence: string;
          hint_ar: string;
          /** Bare IPA pronunciation without slashes ("ænt"), set from Admin -> Word Lists. Null means "use the generated fallback in src/data/word-lists/ipa.ts". */
          ipa: string | null;
          /** Extra answers this word accepts besides target_word (British spellings, synonyms that fit the sentence), lower-case. Empty = only target_word. Absent on a project that has not applied 20250324000000_word_accepted_answers.sql yet. */
          accepted_answers?: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          group_id: string;
          order_index: number;
          target_word: string;
          sentence: string;
          hint_ar: string;
          ipa?: string | null;
          accepted_answers?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["vocabulary_words"]["Insert"]>;
        Relationships: [];
      };
      word_progress: {
        Row: {
          id: string;
          user_id: string;
          word_id: string;
          completed_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          word_id: string;
          completed_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["word_progress"]["Insert"]>;
        Relationships: [];
      };
      word_mastery: {
        Row: {
          user_id: string;
          word_id: string;
          /** 0 = new or just missed ... 5 = passed the 30-day review. */
          strength: number;
          /** The learner-local day this word is next due ("YYYY-MM-DD"). */
          due_on: string;
          last_outcome: "clean" | "assisted" | "missed";
          last_reviewed_on: string;
          reviews: number;
          clean_reviews: number;
          misses: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          word_id: string;
          strength?: number;
          due_on: string;
          last_outcome: "clean" | "assisted" | "missed";
          last_reviewed_on: string;
          reviews?: number;
          clean_reviews?: number;
          misses?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["word_mastery"]["Insert"]>;
        Relationships: [];
      };
      lesson_attempts: {
        Row: {
          id: string;
          user_id: string;
          lesson_id: string;
          mode: LearningMode;
          accuracy: number | null;
          wpm: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          lesson_id: string;
          mode: LearningMode;
          accuracy?: number | null;
          wpm?: number | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["lesson_attempts"]["Insert"]>;
        Relationships: [];
      };
      content_translations: {
        Row: {
          content_type:
            | "level"
            | "lesson"
            | "sentence"
            | "word_group"
            | "vocabulary_word"
            | "category"
            | "book"
            | "book_section"
            | "book_sentence";
          content_id: string;
          /** e.g. "title" | "description" | "text" | "hint" | "preview_sentences" | "word_translations" — which slot of the content item this row translates. See src/lib/i18n/content-translations.ts for the fields each content_type actually uses. */
          field: string;
          /** References locales(code) — see 20250123000000_translation_lifecycle_foundation.sql. Still typed as SupportLocale, not string: the app only actually understands the locales in that union today, and widening this would lose the compile-time exhaustiveness checking the union exists for. Widens the same day a new locale is added to SupportLocale. */
          locale: SupportLocale;
          /** A plain string for scalar fields, or a `{en, text}[]` array for word-by-word/preview-sentence fields — always in this row's own locale, never a mixed-language payload. */
          value: unknown;
          /** The review state of `value` — defaults to "approved" for pre-pipeline rows (existing human-authored content), "ai_generated" for anything the future generation pipeline writes. Independent of is_stale. */
          status: TranslationStatus;
          /** True when `source_snapshot` no longer matches the current English source text — independent of status, since an approved translation can go stale without losing its approved standing (see the migration's doc comment for why). */
          is_stale: boolean;
          /** The exact English source text `value` was generated/approved against, used to detect staleness by direct text comparison rather than a timestamp (sentences are deleted+reinserted on every lesson save, so updated_at alone isn't a reliable staleness signal — see saveLesson in src/lib/admin/content-actions.ts). Null for rows predating this column. */
          source_snapshot: string | null;
          /** The prior approved value, preserved only when a regenerate action overwrites an approved row with a new AI draft — so the previous approved text isn't lost before the new draft is itself approved. */
          previous_value: unknown;
          generated_at: string | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          /** Free text ('manual', 'gpt-4o', ...), not an enum — a provider change should never need a migration. */
          provider: string | null;
          last_attempt_error: string | null;
          last_attempt_at: string | null;
          attempts: number;
          updated_at: string;
        };
        Insert: {
          content_type:
            | "level"
            | "lesson"
            | "sentence"
            | "word_group"
            | "vocabulary_word"
            | "category"
            | "book"
            | "book_section"
            | "book_sentence";
          content_id: string;
          field: string;
          locale: SupportLocale;
          value: unknown;
          status?: TranslationStatus;
          is_stale?: boolean;
          source_snapshot?: string | null;
          previous_value?: unknown;
          generated_at?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          provider?: string | null;
          last_attempt_error?: string | null;
          last_attempt_at?: string | null;
          attempts?: number;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["content_translations"]["Insert"]>;
        Relationships: [];
      };
      locales: {
        Row: {
          code: string;
          display_name: string;
          native_name: string;
          dir: "ltr" | "rtl";
          enabled: boolean;
          created_at: string;
        };
        Insert: {
          code: string;
          display_name: string;
          native_name: string;
          dir: "ltr" | "rtl";
          enabled?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["locales"]["Insert"]>;
        Relationships: [];
      };
      mistakes: {
        Row: {
          id: string;
          user_id: string;
          word: string;
          /** Null for a Word-List-originated mistake, which has no owning row in `sentences` — see 20250226000000_word_list_mistakes_nullable_sentence.sql. */
          sentence_id: string | null;
          status: "active" | "corrected";
          mistake_count: number;
          corrected_at: string | null;
          /** Clean (error-free) reviews in a row since the last mistake or reset — see 20250130000000_mistake_review_scheduling.sql. */
          review_stage: number;
          /** Next spaced-review due time; null = not scheduled (still active, or mastered). */
          next_review_at: string | null;
          /** Character offsets, within the mistyped word's own raw text, of every wrong keystroke from the most recent attempt. Empty/null = unknown — see 20250219000000_mistake_error_indexes.sql (supersedes the old single error_index column). */
          error_indexes: number[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          word: string;
          sentence_id?: string | null;
          status?: "active" | "corrected";
          mistake_count?: number;
          corrected_at?: string | null;
          review_stage?: number;
          next_review_at?: string | null;
          error_indexes?: number[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["mistakes"]["Insert"]>;
        Relationships: [];
      };
      vocabulary_encounters: {
        Row: {
          id: string;
          user_id: string;
          /** Always lowercase — see 20250306000000_vocabulary_recall.sql's doc comment. Also the dedup identity (unique per user). */
          word: string;
          ar: string;
          mode: "normal" | "stories";
          lesson_id: string;
          lesson_title: string;
          /** Live FK to `sentences` — used to resolve real (never browser-fallback) pronunciation via the "sentence_word" isolated-word pipeline. */
          sentence_id: string;
          sentence_en: string;
          /** Index into sentence_en's whitespace-split words — where `word` sits. */
          word_index: number;
          review_stage: number;
          /** Next spaced-review due time; null = mastered (schedule exhausted). */
          next_review_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          word: string;
          ar: string;
          mode: "normal" | "stories";
          lesson_id: string;
          lesson_title: string;
          sentence_id: string;
          sentence_en: string;
          word_index: number;
          review_stage?: number;
          next_review_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["vocabulary_encounters"]["Insert"]>;
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          /** English source name — translated names live in content_translations (content_type: 'category'), same as lessons.title, not a future phase yet. */
          name: string;
          description: string | null;
          order_index: number;
          /** Soft delete — see 20250127000000_library_foundation.sql's doc comment on this column for why a category is never hard-deleted. */
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          description?: string | null;
          order_index?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["categories"]["Insert"]>;
        Relationships: [];
      };
      books: {
        Row: {
          id: string;
          title: string;
          author: string;
          description: string | null;
          cover_image_url: string | null;
          /** Same 1/2/3 Beginner/Intermediate/Advanced tier scale as levels.index / word_groups.level — see src/lib/levels.ts's difficultyForLevel. */
          difficulty_level: number;
          is_featured: boolean;
          /** All books are free while this is true; see this migration's header comment for the future-premium design this and free_preview_sentence_count exist to support. Not enforced anywhere yet. */
          is_free: boolean;
          free_preview_sentence_count: number;
          status: "draft" | "published" | "archived";
          order_index: number;
          /** Opts this book out of the bulk/cron narration-generation sweep (see 20250217000000_voice_generation_exclusion.sql) without unpublishing it. */
          voice_generation_excluded: boolean;
          /** Per-book narration voice override — mirrors lessons.voice_id (see 20250218000000_book_voice_override.sql). Null falls back to elevenlabs_settings.default_story_voice_id, exactly like a Story with no override. */
          voice_id: string | null;
          /** 'book' (default) or 'novel' — a Novel is a copyright-safe summary of a famous novel, reusing the same Book Learning Engine. See 20250307000000_book_novel_type.sql. */
          type: "book" | "novel";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          title: string;
          author: string;
          description?: string | null;
          cover_image_url?: string | null;
          difficulty_level?: number;
          is_featured?: boolean;
          is_free?: boolean;
          free_preview_sentence_count?: number;
          status?: "draft" | "published" | "archived";
          order_index?: number;
          voice_generation_excluded?: boolean;
          voice_id?: string | null;
          type?: "book" | "novel";
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["books"]["Insert"]>;
        Relationships: [];
      };
      book_categories: {
        Row: {
          book_id: string;
          category_id: string;
          /** At most one true per book_id, enforced by a partial unique index — see the migration. */
          is_primary: boolean;
          created_at: string;
        };
        Insert: {
          book_id: string;
          category_id: string;
          is_primary?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["book_categories"]["Insert"]>;
        Relationships: [];
      };
      book_sections: {
        Row: {
          id: string;
          book_id: string;
          order_index: number;
          title: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          book_id: string;
          order_index: number;
          title: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["book_sections"]["Insert"]>;
        Relationships: [];
      };
      book_sentences: {
        Row: {
          id: string;
          section_id: string;
          order_index: number;
          en: string;
          audio_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          section_id: string;
          order_index: number;
          en: string;
          audio_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["book_sentences"]["Insert"]>;
        Relationships: [];
      };
      /** One row per (user, book) — a moving pointer, not a completion log. See 20250128000000_book_learning_engine.sql's header comment. */
      book_progress: {
        Row: {
          user_id: string;
          book_id: string;
          current_section_id: string | null;
          current_sentence_id: string | null;
          completed_sentence_count: number;
          last_read_at: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          book_id: string;
          current_section_id?: string | null;
          current_sentence_id?: string | null;
          completed_sentence_count?: number;
          last_read_at?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["book_progress"]["Insert"]>;
        Relationships: [];
      };
      /** One row per (user, sentence) — a bookmark flag and a note share the row, since both are the same private per-reader annotation identity. See 20250129000000_book_reading_marks.sql. */
      book_sentence_marks: {
        Row: {
          user_id: string;
          book_id: string;
          sentence_id: string;
          is_bookmarked: boolean;
          note: string | null;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          book_id: string;
          sentence_id: string;
          is_bookmarked?: boolean;
          note?: string | null;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["book_sentence_marks"]["Insert"]>;
        Relationships: [];
      };
      /** One row per (user, book) — a 1-5 star rating, publicly readable (see book_rating_summaries) but only ever written by its own owner. See 20250308000000_book_ratings.sql. */
      book_ratings: {
        Row: {
          user_id: string;
          book_id: string;
          rating: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          book_id: string;
          rating: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["book_ratings"]["Insert"]>;
        Relationships: [];
      };
      /** A learner-submitted problem report, surfaced in Admin > Reports. See 20250212000000_problem_reports.sql. */
      problem_reports: {
        Row: {
          id: string;
          user_id: string | null;
          user_email: string;
          page_path: string;
          message: string;
          status: "new" | "in_progress" | "resolved" | "dismissed";
          created_at: string;
          updated_at: string;
          resolved_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          user_email: string;
          page_path: string;
          message: string;
          status?: "new" | "in_progress" | "resolved" | "dismissed";
          created_at?: string;
          updated_at?: string;
          resolved_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["problem_reports"]["Insert"]>;
        Relationships: [];
      };
      /** A reply a learner emailed to our support address, surfaced in Admin > Inbox. See 20250326000000_inbound_emails.sql. */
      inbound_emails: {
        Row: {
          id: string;
          provider_email_id: string;
          message_id: string | null;
          from_email: string;
          from_name: string | null;
          to_email: string;
          subject: string;
          body_text: string;
          attachment_names: string[];
          status: "new" | "read" | "replied" | "archived";
          received_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          provider_email_id: string;
          message_id?: string | null;
          from_email: string;
          from_name?: string | null;
          to_email: string;
          subject?: string;
          body_text?: string;
          attachment_names?: string[];
          status?: "new" | "read" | "replied" | "archived";
          received_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["inbound_emails"]["Insert"]>;
        Relationships: [];
      };
      /** A learner's 1-5 star rating of the whole app plus optional comment, listed in Admin > Ratings. Written only by the service role. See 20250331000000_app_ratings.sql. */
      app_ratings: {
        Row: {
          id: string;
          rating: number;
          comment: string;
          lesson_id: string;
          mode: string;
          locale: string;
          user_type: "member" | "guest";
          user_id: string | null;
          contact_email: string | null;
          anon_id: string;
          status: "new" | "read" | "replied" | "archived";
          is_public: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          rating: number;
          comment?: string;
          lesson_id?: string;
          mode?: string;
          locale?: string;
          user_type: "member" | "guest";
          user_id?: string | null;
          contact_email?: string | null;
          anon_id?: string;
          status?: "new" | "read" | "replied" | "archived";
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["app_ratings"]["Insert"]>;
        Relationships: [];
      };
      /** Service-role-only sign-in attempt ledger backing signIn's lockout. See 20250216000000_login_attempt_lockout.sql. */
      login_attempts: {
        Row: {
          id: string;
          email: string;
          success: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          success: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["login_attempts"]["Insert"]>;
        Relationships: [];
      };
      /** Append-only "who changed what" record for the admin panel. See 20250214000000_admin_audit_log.sql. */
      admin_audit_log: {
        Row: {
          id: string;
          admin_id: string | null;
          admin_email: string;
          action: string;
          entity_type: string;
          entity_id: string | null;
          metadata: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          admin_id?: string | null;
          admin_email: string;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          metadata?: Record<string, unknown>;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["admin_audit_log"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      add_quest_progress: {
        Args: { p_type: string; p_amount: number; p_date?: string | null };
        Returns: {
          out_slot: number;
          out_type: string;
          out_xp: number;
          out_progress: number;
          out_target: number;
          out_completed_now: boolean;
        }[];
      };
      award_badges: {
        Args: { p_ids: string[] };
        Returns: { out_badge_id: string }[];
      };
      mark_badges_seen: {
        Args: Record<string, never>;
        Returns: undefined;
      };
      badge_metrics: {
        Args: Record<string, never>;
        Returns: {
          out_longest_streak: number;
          out_total_sentences: number;
          out_lesson_count: number;
          out_perfect_lessons: number;
          out_max_wpm: number;
          out_xp: number;
          out_fixed_words: number;
        }[];
      };
      record_card_review: {
        Args: { p_word: string; p_had_errors: boolean };
        Returns: undefined;
      };
      complete_daily_session: {
        Args: { p_date: string; p_xp: number };
        Returns: boolean;
      };
      record_activity_day: {
        Args: { p_day: string; p_sentences: number; p_xp: number };
        Returns: undefined;
      };
      record_streak_bridge_days: {
        Args: { p_days: string[]; p_kinds: string[] };
        Returns: undefined;
      };
      consume_streak_freezes: {
        Args: { p_period: string; p_count: number; p_monthly: number };
        Returns: number;
      };
      record_mistake: {
        Args: { p_word: string; p_sentence_id: string | null; p_error_indexes?: number[] | null };
        Returns: undefined;
      };
      record_mistake_review: {
        Args: { p_word: string; p_had_errors: boolean };
        Returns: undefined;
      };
      record_word_review: {
        Args: { p_word_id: string; p_outcome: string; p_today: string };
        Returns: { out_strength: number; out_due_on: string; out_advanced: boolean }[];
      };
      record_vocabulary_encounter: {
        Args: {
          p_word: string;
          p_ar: string;
          p_mode: string;
          p_lesson_id: string;
          p_lesson_title: string;
          p_sentence_id: string;
          p_sentence_en: string;
          p_word_index: number;
        };
        Returns: undefined;
      };
      record_vocabulary_review: {
        Args: { p_word: string; p_had_errors: boolean };
        Returns: undefined;
      };
      complete_book_sentence: {
        Args: { p_book_id: string; p_sentence_id: string };
        Returns: {
          out_completed_sentence_count: number;
          out_current_section_id: string | null;
          out_current_sentence_id: string | null;
          out_advanced: boolean;
        }[];
      };
      book_rating_summaries: {
        Args: { p_book_ids: string[] };
        Returns: { book_id: string; average: number; rating_count: number }[];
      };
      app_rating_distribution: {
        Args: Record<string, never>;
        Returns: { rating: number; rating_count: number }[];
      };
      increment_xp: {
        Args: { p_delta: number };
        Returns: { previous_xp: number; xp: number }[];
      };
      increment_daily_progress: {
        Args: { p_date: string; p_delta: number; p_default_goal: number };
        Returns: { sentences_completed: number; goal: number }[];
      };
      complete_lesson: {
        Args: { p_lesson_id: string; p_mode: string; p_accuracy: number };
        Returns: { is_first_completion: boolean; attempt_count: number }[];
      };
      fulfill_payment_order: {
        Args: {
          p_reference_id: string;
          p_provider_payment_id: string;
          p_charge_amount: number;
          p_charge_currency: string;
          p_paid_at: string;
          p_provider_status: string;
        };
        Returns: {
          result:
            | "fulfilled"
            | "already_fulfilled"
            | "not_found"
            | "needs_review"
            | "mismatch"
            | "missing_paid_at"
            | "user_not_found";
          premium_period_end?: string | null;
        };
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
