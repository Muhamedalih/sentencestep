"use client";

import Link from "next/link";

import { useLocale } from "@/components/providers/locale-provider";
import { premiumStripStrings } from "@/lib/premium-strip/strings";

/**
 * The Premium strip at the foot of the new Home page (permission premiumStrip): one wide dark strip
 * with a small yellow PREMIUM badge, one line and a yellow Upgrade button to the plans page. Its colours
 * are fixed (the same in light and dark) and the page chrome stays left-to-right, also in Arabic.
 */
export function PremiumStrip({ className }: { className?: string }) {
  const { locale } = useLocale();
  const copy = premiumStripStrings(locale);
  return (
    <section
      dir="ltr"
      aria-label={copy.line}
      className={`flex items-center justify-between gap-4 rounded-xl border border-[#3b3220] bg-[#1c1a15] px-5 py-[23px] max-sm:flex-col max-sm:items-stretch max-sm:gap-4 sm:px-8 ${className ?? ""}`}
    >
      <div className="flex min-w-0 items-center gap-4 max-sm:flex-col max-sm:items-start max-sm:gap-3">
        <span className="shrink-0 rounded-[5px] bg-[#f2c744] px-2.5 py-1 text-[13px] leading-none font-extrabold tracking-wider text-[#2b2410]">
          {copy.badge}
        </span>
        <p className="min-w-0 text-[18px] leading-snug text-[#f3f0e8]">
          <span dir="auto">{copy.line}</span>
        </p>
      </div>
      <Link
        href="/upgrade"
        className="shrink-0 rounded-lg bg-[#f2c744] px-7 py-3.5 text-center text-[17px] leading-none font-bold text-[#2b2410] transition-colors outline-none hover:bg-[#f7d35f] focus-visible:ring-2 focus-visible:ring-[#f2c744] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1c1a15]"
      >
        {copy.cta}
      </Link>
    </section>
  );
}
