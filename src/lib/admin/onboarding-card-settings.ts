/** Shared type/defaults for the get-started flow's admin-configurable intro card — see onboarding-card-queries.ts (read) and onboarding-card-actions.ts (write). */
export interface OnboardingCardSettings {
  imageUrl: string | null;
  title: string;
}

export const DEFAULT_ONBOARDING_CARD_SETTINGS: OnboardingCardSettings = {
  imageUrl: null,
  title: "Your English Journey Starts Here",
};

export const ONBOARDING_CARD_TITLE_MAX_LENGTH = 120;
