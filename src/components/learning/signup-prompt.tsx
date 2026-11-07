"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { motion } from "framer-motion";

import { GoogleIcon } from "@/components/auth/google-icon";
import { useAuthUserId } from "@/components/providers/auth-user-provider";
import { useLocale } from "@/components/providers/locale-provider";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { signInWithGoogle } from "@/lib/supabase/auth-actions";

/**
 * The page after the opening lesson in the short first run (it replaces OnboardingLessonComplete
 * there): one calm column on the lesson's black canvas that asks a visitor without an account to
 * save what they just did — Google in one tap, an email account, signing in to an account they
 * already have, or "Later" — and every one of those ends on Home. The visitor's own result (the
 * lesson's words and their accuracy) sits under the headline, since that is what an account keeps.
 *
 * A learner who is already signed in has nothing to save, so they get the same top half with the
 * long run's headline and one button to Home.
 *
 * The Google button is the same form as on the sign-up page. Inside Facebook's and Instagram's own
 * browsers that page can swap it for the "open in your browser" strip (the inAppStrip permission);
 * that strip opens the CURRENT page in the outside browser, which here would be the lesson without
 * the visitor's progress (it lives in this browser), so it is not used on this page.
 */
export function SignupPrompt({ words, accuracy }: { words: number; accuracy: number }) {
  const { t } = useLocale();
  const userId = useAuthUserId();
  const s = t.signupPrompt;
  const result = s.result
    .replace("{words}", String(words))
    .replace("{accuracy}", String(Math.round(accuracy * 100)));

  return (
    <div
      className="bg-background fixed inset-0 z-100 flex flex-col overflow-y-auto p-6"
      role="dialog"
      aria-modal="true"
      aria-label={userId ? t.onboardingComplete.headline : s.headline}
    >
      <div className="flex shrink-0 items-center justify-between">
        <Logo />
      </div>

      <div className="flex flex-1 items-center justify-center py-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="flex w-full max-w-sm flex-col items-center text-center"
        >
          <span className="border-primary/40 text-primary flex size-12 items-center justify-center rounded-full border">
            <Check aria-hidden="true" className="size-6" />
          </span>
          <p dir="auto" className="text-primary mt-4 text-sm font-medium">
            {s.eyebrow}
          </p>
          <h1 dir="auto" className="mt-1.5 text-2xl font-semibold tracking-tight text-balance">
            {userId ? t.onboardingComplete.headline : s.headline}
          </h1>
          <p dir="auto" className="text-muted-foreground mt-2 text-sm">
            {result}
          </p>

          {userId ? (
            <Button size="lg" asChild className="mt-8 h-12 w-full">
              <Link href="/learn">{t.onboardingComplete.cta}</Link>
            </Button>
          ) : (
            <>
              <ul className="border-border bg-card mt-6 flex w-full flex-col gap-3 rounded-2xl border p-4 text-sm">
                {[s.point1, s.point2, s.point3].map((point) => (
                  <li key={point} dir="auto" className="flex items-center gap-2.5 text-start">
                    <Check aria-hidden="true" className="text-primary size-4 shrink-0" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>

              <form action={signInWithGoogle} className="mt-6 w-full">
                <Button
                  type="submit"
                  size="lg"
                  className="h-12 w-full bg-white text-neutral-900 hover:bg-white/90"
                >
                  <GoogleIcon className="size-5" />
                  {t.auth.googleSignIn}
                </Button>
              </form>
              <Button size="lg" variant="outline" asChild className="mt-3 h-12 w-full">
                <Link href="/register">{s.emailCta}</Link>
              </Button>

              <p dir="auto" className="mt-5 text-sm">
                <span className="text-muted-foreground">{s.haveAccount}</span>{" "}
                <Link
                  href="/login"
                  className="text-primary font-medium underline-offset-4 hover:underline"
                >
                  {s.signIn}
                </Link>
              </p>
              <Link
                href="/learn"
                className="text-foreground/80 hover:bg-muted hover:text-foreground mt-3 flex h-11 w-full items-center justify-center rounded-xl text-[15px] font-medium transition-colors"
              >
                {s.later}
              </Link>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
