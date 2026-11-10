"use client";

import { Globe, Keyboard, RefreshCw } from "lucide-react";

import { useLocale } from "@/components/providers/locale-provider";

/**
 * The opening lesson's two quiet helps (permission openerHelp), drawn right under the translation
 * line: they never cover the sentence and never stop the typing. Sizes are the mock-up's: a 14px box
 * with a 1px border, a 14px corner radius and the card's own background, its keyboard icon in the
 * brand colour.
 */

/**
 * «لوحة المفاتيح عندك عربية»: shown after two wrong Arabic letters in a row (see
 * src/lib/opener/help.ts), with how to switch the keyboard to English — the globe key on a phone,
 * Alt + Shift on a laptop.
 */
export function KeyboardHint({ phone }: { phone: boolean }) {
  const { t } = useLocale();
  const body = phone ? t.lesson.keyboardHintPhone : t.lesson.keyboardHintDesktop;
  const [before, after] = body.split("{icon}");
  return (
    <div
      role="status"
      dir="auto"
      className="border-border bg-card text-muted-foreground mt-4 flex items-start gap-3 rounded-[14px] border px-[14px] py-3 text-[14px] leading-[1.55] select-none"
    >
      <Keyboard aria-hidden="true" className="mt-0.5 size-[22px] shrink-0 text-[var(--brand)]" />
      <div>
        <b className="text-foreground block text-[14.5px] font-semibold">
          {t.lesson.keyboardHintTitle}
        </b>
        {before}
        {after !== undefined && (
          <>
            <Globe
              aria-hidden="true"
              className="mx-0.5 inline-block size-[18px] align-[-4px] text-[var(--brand)]"
            />
            {after}
          </>
        )}
      </div>
    </div>
  );
}

/**
 * «تعذّر تشغيل الصوت. تقدر تكمل بالكتابة.» with a try-again button: shown only when every existing way
 * of hearing the sentence failed (see PronunciationButton's onAllAudioFailed). The button keeps the
 * typing input focused, like the replay buttons do.
 */
export function AudioFailedNote({ onRetry }: { onRetry: () => void }) {
  const { t } = useLocale();
  return (
    <div
      role="status"
      dir="auto"
      className="text-muted-foreground mt-3 flex flex-wrap items-center gap-2.5 text-[14px] leading-[1.5] select-none"
    >
      <span>{t.lesson.audioFailedNote}</span>
      <button
        type="button"
        onMouseDown={(event) => event.preventDefault()}
        onClick={onRetry}
        className="inline-flex items-center gap-1.5 font-semibold text-[var(--brand)]"
      >
        <RefreshCw aria-hidden="true" className="size-3.5" />
        {t.lesson.audioRetry}
      </button>
    </div>
  );
}
