import type { Metadata } from "next";

import { SUPPORT_LOCALES, type SupportLocale } from "@/lib/i18n/locales";

/**
 * The landing page's own title and description in each language. Before this every language shared the
 * English ones (SITE_METADATA), so "/ar" showed an English title in an Arabic search. The unprefixed "/"
 * (the English chrome a first-time visitor sees) keeps the site-wide English text.
 */
const HOME_TEXT: Record<SupportLocale, { title: string; description: string }> = {
  ar: {
    title: "SentenceStep — تعلّم الإنجليزية بالكتابة، حرفًا بحرف",
    description:
      "موقع لتعلّم الإنجليزية لمتحدثي العربية: استمع إلى الجملة واكتبها حرفًا بحرف وشاهد ترجمتها فورًا. قصص ودروس وقوائم كلمات وقواعد، والدرس الأول مجاني.",
  },
  es: {
    title: "SentenceStep — Aprende inglés escribiendo, letra por letra",
    description:
      "Una web para aprender inglés: escuchas una frase, la escribes letra por letra y ves su traducción al instante. Historias, lecciones, listas de palabras y gramática. La primera lección es gratis.",
  },
  tr: {
    title: "SentenceStep — İngilizceyi yazarak öğren, harf harf",
    description:
      "İngilizce öğrenmek için bir site: bir cümleyi dinler, harf harf yazar ve çevirisini hemen görürsün. Hikâyeler, dersler, kelime listeleri ve dil bilgisi. İlk ders ücretsiz.",
  },
};

const OPEN_GRAPH_LOCALE: Record<SupportLocale, string> = { ar: "ar_AR", es: "es_ES", tr: "tr_TR" };

/** The address of the landing page in a language ("/ar"), or "/" for the unprefixed one. */
function homePath(locale: SupportLocale | null): string {
  return locale ? `/${locale}` : "/";
}

/** Canonical address plus the hreflang set (every language, and "/" as the default), for every landing page. */
export function homeMetadata(locale: SupportLocale | null): Metadata {
  const alternates: Metadata["alternates"] = {
    canonical: homePath(locale),
    languages: {
      ...Object.fromEntries(SUPPORT_LOCALES.map((code) => [code, `/${code}`])),
      "x-default": "/",
    },
  };
  if (!locale) return { alternates };
  const text = HOME_TEXT[locale];
  return {
    title: { absolute: text.title },
    description: text.description,
    alternates,
    openGraph: {
      title: text.title,
      description: text.description,
      url: homePath(locale),
      siteName: "SentenceStep",
      type: "website",
      locale: OPEN_GRAPH_LOCALE[locale],
    },
  };
}
