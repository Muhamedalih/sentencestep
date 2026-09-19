-- The onboarding intro card's headline (src/components/app/onboarding-intro-card.tsx,
-- the get-started flow's fifth and last step) used to be a single English-only
-- `title` column, rendered unchanged regardless of the visitor's chosen
-- support locale — the one piece of learner-support text in that flow that
-- wasn't actually localized, even though English is never a selectable
-- support locale in this app (see SupportLocale in src/lib/i18n/locales.ts).
-- Adds one title per support locale, matching the ar/es/tr shape TierConfig
-- already uses in src/lib/levels.ts, and backfills the existing singleton
-- row with hand-translated copy so no learner ever sees English there again.
-- The original `title` column is kept as the admin's own English reference
-- copy (shown in the admin form, never rendered to a learner).
alter table onboarding_intro_card
  add column if not exists title_ar text not null default 'رحلتك مع الإنجليزية تبدأ من هنا',
  add column if not exists title_es text not null default 'Tu viaje con el inglés comienza aquí',
  add column if not exists title_tr text not null default 'İngilizce yolculuğun burada başlıyor';
