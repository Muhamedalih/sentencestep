import Link from "next/link";

import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/lib/i18n/dictionary/types";

export function FreeCta({ isAuthenticated, t }: { isAuthenticated: boolean; t: Dictionary }) {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-24">
      <div className="bg-primary text-primary-foreground relative overflow-hidden rounded-2xl px-8 py-14 text-center sm:px-16">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {isAuthenticated ? t.marketing.ctaWelcomeBack : t.marketing.ctaTryFirst}
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-lg text-balance opacity-90">
          {isAuthenticated ? t.marketing.ctaWelcomeBackBody : t.marketing.ctaTryFirstBody}
        </p>
        <div className="mt-8 flex justify-center">
          <Button size="lg" variant="secondary" className="text-foreground" asChild>
            <Link href="/learn">
              {isAuthenticated ? t.common.continueLearning : t.marketing.startFirstLesson}
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
