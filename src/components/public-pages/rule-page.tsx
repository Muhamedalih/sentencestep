import Link from "next/link";

import { ArticleBlocks } from "@/components/public-pages/article-blocks";
import { BracketSentence, Mixed } from "@/components/public-pages/mixed-text";
import { PublicFooterNote } from "@/components/public-pages/public-footer-note";
import { PublicHeader } from "@/components/public-pages/public-header";
import { TryIt } from "@/components/public-pages/try-it";
import { Button } from "@/components/ui/button";
import { SiteFooter } from "@/components/layout/site-footer";
import type { RulePageModel } from "@/lib/public-pages/rule-page-data";

const NOTE_LABEL = {
  mistake: "خطأ شائع عند الناطقين بالعربية",
  detail: "تفصيل مهم",
  exception: "استثناء",
} as const;

/**
 * A public rule page: the answer first (the rule's own one line), then the right and the wrong sentence,
 * the explanation, the mistake Arabic speakers make, six translated sentences, a typing exercise that runs
 * in the page, and one door to the free first lesson. What stays inside the app: the sound, the stories,
 * and the practice on the sentences of the learner's own story.
 */
export function RulePage({ model, locale }: { model: RulePageModel; locale: string }) {
  const { article } = model;
  return (
    <div className="flex min-h-svh flex-col">
      <PublicHeader locale={locale} />
      <main className="flex-1">
        <article className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
          <nav aria-label="مسار الصفحة" className="text-muted-foreground mb-4 flex flex-wrap gap-1.5 text-sm" dir="rtl">
            <Link href={`/${locale}/grammar`} className="hover:text-foreground">
              القواعد
            </Link>
            <span aria-hidden="true">›</span>
            <span>{model.levelLabel}</span>
            <span aria-hidden="true">›</span>
            <span>{model.unitTitleAr}</span>
            <span aria-hidden="true">›</span>
            <bdi dir="ltr" className="text-foreground">
              {model.title}
            </bdi>
          </nav>

          <div className="mb-3 flex flex-wrap gap-2" dir="rtl">
            <span className="bg-brand-muted text-primary rounded-full px-3 py-0.5 text-xs font-semibold">
              {model.levelLabel}
            </span>
            <span className="bg-muted text-muted-foreground rounded-full px-3 py-0.5 text-xs">
              {model.unitTitleAr}
            </span>
          </div>

          <h1 dir="rtl" className="mb-3 text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl">
            <Mixed text={article.h1} />
          </h1>
          <p dir="rtl" className="text-muted-foreground mb-6 leading-8">
            <Mixed text={article.description} />
          </p>

          <section aria-label="الجواب المختصر" className="bg-brand-muted mb-5 rounded-2xl px-5 py-4" dir="rtl">
            <p className="text-primary mb-1 text-xs font-bold">الجواب المختصر</p>
            <p className="text-lg leading-8">
              <Mixed text={model.ideaAr} />
            </p>
          </section>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="bg-success/10 rounded-2xl px-5 py-4">
              <p className="text-success mb-1 text-xs font-bold" dir="rtl">
                صحيح ✓
              </p>
              <p className="text-lg font-medium">
                <BracketSentence text={model.right} tone="good" />
              </p>
            </div>
            <div className="bg-danger/10 rounded-2xl px-5 py-4">
              <p className="text-danger mb-1 text-xs font-bold" dir="rtl">
                خطأ ✗
              </p>
              <p className="text-lg font-medium">
                <BracketSentence text={model.wrong} tone="bad" />
              </p>
            </div>
          </div>

          <ArticleBlocks blocks={article.blocks} />

          {model.notes.map((note, index) => (
            <section
              key={index}
              dir="rtl"
              className="border-border bg-card border-s-primary mt-6 rounded-2xl border border-s-4 px-5 py-4"
            >
              <h2 className="text-primary mb-1.5 text-sm font-bold">{NOTE_LABEL[note.kind]}</h2>
              <p className="mb-2 leading-8">
                <Mixed text={note.say.ar} />
              </p>
              <ul className="space-y-0.5" dir="ltr">
                {note.examples.map((example) => (
                  <li key={example} className="text-left">
                    <BracketSentence text={example} />
                  </li>
                ))}
              </ul>
            </section>
          ))}

          <h2 dir="rtl" className="mt-9 mb-3 text-xl font-semibold">
            أمثلة مترجمة
          </h2>
          <ol className="grid gap-2">
            {model.examples.map((example, index) => (
              <li key={index} className="border-border bg-card rounded-xl border px-4 py-3">
                <p dir="ltr" lang="en" className="text-left font-medium">
                  {example.before}
                  <span className="text-primary font-semibold">{example.answers[0]}</span>
                  {example.after}
                </p>
                <p dir="rtl" className="text-muted-foreground mt-0.5 text-[15px]">
                  {article.examplesAr[index]}
                </p>
              </li>
            ))}
          </ol>

          <h2 dir="rtl" className="mt-9 mb-3 text-xl font-semibold">
            جرّب بنفسك
          </h2>
          <p dir="rtl" className="text-muted-foreground mb-3 text-sm">
            اكتب الكلمة الناقصة في كل جملة. لا حساب ولا حفظ: التمرين يعمل في هذه الصفحة فقط.
          </p>
          <TryIt
            examples={model.examples.map(({ before, answers, after, hint }) => ({
              before,
              answers,
              after,
              hint,
            }))}
          />

          <section className="border-border bg-card mt-8 rounded-2xl border px-5 py-6 text-center sm:px-8" dir="rtl">
            <h2 className="mb-1.5 text-xl font-semibold">طبّق القاعدة على جمل من قصة حقيقية</h2>
            <p className="text-muted-foreground mx-auto mb-4 max-w-lg leading-7">
              الدرس الأول مجاني: تسمع الجملة وتكتبها حرفاً بحرف، وترى ترجمتها مباشرة. بلا حساب وبلا بطاقة.
            </p>
            <Button size="lg" asChild>
              <Link href="/learn" prefetch={false}>
                ابدأ الدرس المجاني
              </Link>
            </Button>
            <p className="text-muted-foreground mt-4 border-t border-dashed pt-3 text-sm">
              يبقى داخل SentenceStep: صوت الدروس، والقصص الكاملة، وتمرين هذه القاعدة على جمل قصتك أنت.
            </p>
          </section>

          <section dir="rtl" className="mt-9">
            <h2 className="mb-3 text-xl font-semibold">أسئلة شائعة</h2>
            <div className="space-y-4">
              {article.faqs.map((faq) => (
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
          </section>

          {(model.related.length > 0 || model.previous || model.next) && (
            <section dir="rtl" className="mt-9">
              <h2 className="mb-3 text-xl font-semibold">قواعد قريبة</h2>
              <ul className="grid gap-2 sm:grid-cols-2">
                {[...model.related, ...(model.previous ? [model.previous] : []), ...(model.next ? [model.next] : [])]
                  .filter((link, index, all) => all.findIndex((other) => other.href === link.href) === index)
                  .map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="border-border bg-card hover:bg-muted block rounded-xl border px-4 py-3 text-left font-medium"
                        dir="ltr"
                      >
                        {link.title}
                      </Link>
                    </li>
                  ))}
              </ul>
              <p className="mt-3 text-sm">
                <Link href={`/${locale}/grammar`} className="text-primary font-semibold">
                  كل القواعد
                </Link>
              </p>
            </section>
          )}

          <PublicFooterNote />
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
