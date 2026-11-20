import Link from "next/link";

import { PublicFooterNote } from "@/components/public-pages/public-footer-note";
import { PublicHeader } from "@/components/public-pages/public-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";
import { ALL_RULES } from "@/lib/daily-rule/levels";
import { UNITS } from "@/lib/daily-rule/units";
import { publicRulesByLevel } from "@/lib/public-pages/rule-page-data";

export const GRAMMAR_INDEX = {
  title: "قواعد الإنجليزية بالعربي: شرح مبسّط وأمثلة وتمارين",
  description:
    "قواعد الإنجليزية مشروحة للناطقين بالعربية، مع الأخطاء الشائعة عندهم وأمثلة مترجمة وتمرين كتابة لكل قاعدة. من المستوى A1 إلى B2.",
};

/** The grammar index: the rules that have a page, by level. The rest of the course is named but not linked until its page exists. */
export function GrammarIndexPage({ locale }: { locale: string }) {
  const groups = publicRulesByLevel();
  return (
    <div className="flex min-h-svh flex-col">
      <PublicHeader locale={locale} />
      <main className="flex-1">
        <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
          <h1 dir="rtl" className="mb-3 text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl">
            {GRAMMAR_INDEX.title}
          </h1>
          <p dir="rtl" className="text-muted-foreground mb-8 leading-8">
            {`كل قاعدة في سطر واحد، ثم الخطأ الذي يقع فيه الناطقون بالعربية، وستة أمثلة مترجمة، وتمرين تكتب فيه الجواب بنفسك. هذه قواعد مسار SentenceStep: ${ALL_RULES.length} قاعدة في ${UNITS.length} وحدة، من A1 إلى B2، وتُضاف صفحاتها تباعاً.`}
          </p>

          {groups.map((group) => (
            <section key={group.level} className="mb-8">
              <h2 dir="rtl" className="mb-3 text-xl font-semibold">
                {`المستوى ${group.levelLabel}`}
              </h2>
              <ul className="grid gap-2 sm:grid-cols-2">
                {group.rules.map((rule) => (
                  <li key={rule.id}>
                    <Link
                      href={`/${locale}/grammar/${rule.slug}`}
                      className="border-border bg-card hover:bg-muted block rounded-xl border px-4 py-3"
                    >
                      <span dir="ltr" lang="en" className="block text-left font-medium">
                        {rule.title}
                      </span>
                      <span dir="rtl" className="text-muted-foreground block text-sm">
                        {rule.unitTitleAr}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}

          <section className="border-border bg-card rounded-2xl border px-5 py-6 text-center sm:px-8" dir="rtl">
            <h2 className="mb-1.5 text-xl font-semibold">تعلّم القواعد داخل القصص</h2>
            <p className="text-muted-foreground mx-auto mb-4 max-w-lg leading-7">
              في SentenceStep تظهر القاعدة في جمل القصة التي تقرؤها أنت، وتكتب أمثلتها حرفاً بحرف. الدرس الأول مجاني بلا حساب.
            </p>
            <Button size="lg" asChild>
              <Link href="/learn" prefetch={false}>
                ابدأ الدرس المجاني
              </Link>
            </Button>
          </section>

          <PublicFooterNote />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
