-- A second, independent image slot on the same singleton row: the get-started
-- flow's cover card (OnboardingIntroCard) and the opening-lesson completion
-- screen (OnboardingLessonComplete) used to share image_url, but an admin
-- wants to picture them differently now that both exist. Nullable, same
-- fallback-to-icon behavior as image_url when unset.
alter table onboarding_intro_card add column if not exists completion_image_url text;
