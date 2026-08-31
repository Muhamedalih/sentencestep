import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { NotConfiguredNotice } from "@/components/admin/not-configured-notice";
import { TranslationFieldReview } from "@/components/admin/translation-field-review";
import { LessonTranslationField } from "@/components/admin/lesson-translation-field";
import { getLessonTranslationDetail } from "@/lib/admin/translation-dashboard-queries";
import { listEnabledLocales } from "@/lib/admin/translation-queries";
import { isSupportLocale } from "@/lib/i18n/locales";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Review translation" };

export default async function TranslationReviewPage({
  params,
}: {
  params: Promise<{ lessonId: string; locale: string }>;
}) {
  if (!isSupabaseConfigured()) return <NotConfiguredNotice />;

  const { lessonId, locale } = await params;
  if (!isSupportLocale(locale)) notFound();

  const [detail, enabledLocales] = await Promise.all([
    getLessonTranslationDetail(lessonId, locale),
    listEnabledLocales(),
  ]);
  if (!detail) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/translations" className="text-muted-foreground text-sm hover:underline">
          ← Translations
        </Link>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">{detail.lessonTitle}</h1>
        <p className="text-muted-foreground mt-1">
          Locale: {enabledLocales.find((l) => l.code === locale)?.displayName ?? locale}
        </p>
      </div>

      <LessonTranslationField
        lessonId={lessonId}
        locales={enabledLocales.filter((l) => l.code === locale)}
      />

      <div className="flex flex-col gap-4">
        {detail.fields.map((field) => (
          <TranslationFieldReview
            key={`${field.contentType}:${field.contentId}:${field.field}`}
            lessonId={lessonId}
            locale={locale}
            field={field}
          />
        ))}
      </div>
    </div>
  );
}
