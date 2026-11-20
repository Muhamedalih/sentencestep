import Link from "next/link";

import { Mixed } from "@/components/public-pages/mixed-text";
import { PublicFooterNote } from "@/components/public-pages/public-footer-note";
import { PublicHeader } from "@/components/public-pages/public-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";
import { ABOUT, ABOUT_FAQS } from "@/lib/public-pages/about-content";

/** "What is SentenceStep": plain facts, each under the question a person (or an assistant answering for one) asks. */
export function AboutPage({ locale }: { locale: string }) {
  return (
    <div className="flex min-h-svh flex-col">
      <PublicHeader locale={locale} />
      <main className="flex-1">
        <article dir="rtl" className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
          <h1 className="mb-4 text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl">
            <Mixed text={ABOUT.title} />
          </h1>

          <section aria-label="الجواب المختصر" className="bg-brand-muted mb-8 rounded-2xl px-5 py-4">
            <p className="text-lg leading-8">
              <Mixed text={ABOUT.answer} />
            </p>
          </section>

          <h2 className="mt-8 mb-3 text-xl font-semibold">كيف يعمل؟</h2>
          <ol className="list-decimal space-y-2 ps-6 leading-8">
            {ABOUT.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>

          <h2 className="mt-8 mb-3 text-xl font-semibold">ماذا فيه؟</h2>
          <ul className="list-disc space-y-2 ps-6 leading-8">
            {ABOUT.contents().map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <h2 className="mt-8 mb-3 text-xl font-semibold">لمن هو؟</h2>
          <p className="leading-8">{ABOUT.forWhom}</p>

          <h2 className="mt-8 mb-3 text-xl font-semibold">ما المجاني وما المدفوع؟</h2>
          <p className="leading-8">{ABOUT.free}</p>

          <h2 className="mt-8 mb-3 text-xl font-semibold">لماذا الكتابة؟</h2>
          <p className="leading-8">
            <Mixed text={ABOUT.whyTyping} />
          </p>

          <section className="border-border bg-card mt-8 rounded-2xl border px-5 py-6 text-center sm:px-8">
            <h2 className="mb-1.5 text-xl font-semibold">جرّب أول درس الآن</h2>
            <p className="text-muted-foreground mx-auto mb-4 max-w-lg leading-7">
              بلا حساب وبلا بطاقة: تسمع جملة، وتكتبها حرفاً بحرف، وترى ترجمتها.
            </p>
            <Button size="lg" asChild>
              <Link href="/learn" prefetch={false}>
                ابدأ مجاناً
              </Link>
            </Button>
          </section>

          <h2 className="mt-10 mb-3 text-xl font-semibold">أسئلة شائعة</h2>
          <div className="space-y-4">
            {ABOUT_FAQS.map((faq) => (
              <div key={faq.q}>
                <h3 className="font-semibold">
                  <Mixed text={faq.q} />
                </h3>
                <p className="text-muted-foreground mt-1 leading-8">
                  <Mixed text={faq.a} />
                </p>
              </div>
            ))}
          </div>

          <section dir="ltr" lang="en" className="border-border mt-10 border-t pt-6">
            <h2 className="mb-2 text-lg font-semibold">In English</h2>
            <p className="text-muted-foreground leading-7">{ABOUT.english}</p>
          </section>

          <PublicFooterNote />
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
