"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { MouseEvent, ReactNode } from "react";
import { Ellipsis, EllipsisVertical, ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/providers/locale-provider";
import { trackInAppStripAction } from "@/lib/analytics/track-actions";
import {
  copyText,
  readBucketCookie,
  readFirstTouchCookie,
  writeBucketCookie,
} from "@/lib/in-app-strip/browser";
import { buildExternalUrl, buildIntentUrl, newBucket } from "@/lib/in-app-strip/strip";
import type { StripDecision, StripPage } from "@/lib/in-app-strip/strip";
import { cn } from "@/lib/utils";

/** The strip's own button: tinted with the brand colour, quieter than the page's one filled button. */
const TINTED_BUTTON =
  "h-10 rounded-md border-primary/50 bg-primary/[.18] text-primary hover:bg-primary/25 dark:text-[#c7d0ff]";

/** `text` with the first `token` swapped for an icon (the menu button the learner is told to press). */
function withIcon(text: string, token: string, icon: ReactNode): ReactNode {
  const at = text.indexOf(token);
  if (at < 0) return text;
  return (
    <>
      {text.slice(0, at)}
      {icon}
      {text.slice(at + token.length)}
    </>
  );
}

/** One row per browser session and page: reloading the page does not count the visitor again. */
function reportShown(
  decision: Pick<StripDecision, "app" | "platform" | "forced">,
  page: StripPage,
  bucket: number | null,
  shown: boolean,
) {
  try {
    const key = `looma:inAppStripShown:${page}`;
    if (window.sessionStorage.getItem(key)) return;
    window.sessionStorage.setItem(key, "1");
  } catch {
    // Storage blocked: a reload may count twice, in both groups alike.
  }
  void trackInAppStripAction({
    kind: "shown",
    app: decision.app,
    platform: decision.platform,
    page,
    shown,
    forced: decision.forced,
    bucket,
  });
}

/**
 * Where the sign-up and sign-in pages put their "Continue with Google" button (`children`). For a
 * visitor in Facebook's or Instagram's built-in browser who is given the strip (see strip.ts) it is
 * replaced by the strip, because Google does not serve its sign-in page inside those browsers; every
 * other visitor, and the comparison group of the test, gets the button as before. With the test on, it
 * also records that a visitor in one of those browsers was here, and which group they are in.
 */
export function InAppStripSlot({
  decision,
  page,
  children,
}: {
  decision: StripDecision | null;
  page: StripPage;
  children: ReactNode;
}) {
  const [bucket, setBucket] = useState(decision?.bucket ?? null);
  const [show, setShow] = useState(decision?.show ?? false);
  const app = decision?.app;
  const platform = decision?.platform;
  const forced = decision?.forced ?? false;
  const share = decision?.share ?? 0;
  const initialBucket = decision?.bucket ?? null;
  const initialShow = decision?.show ?? false;

  useEffect(() => {
    if (!app || !platform) return;
    let current = initialBucket;
    let shown = initialShow;
    if (current === null && !forced) {
      // Landed here directly, so nothing has given this browser a bucket yet (see InAppBucketCookie).
      current = readBucketCookie();
      if (current === null) {
        current = newBucket(Math.random());
        writeBucketCookie(current);
      }
      shown = share > 0 && current < share;
    }
    setBucket(current);
    setShow(shown);
    if (share > 0 || forced) reportShown({ app, platform, forced }, page, current, shown);
  }, [app, platform, forced, share, initialBucket, initialShow, page]);

  if (!decision || !show) return <>{children}</>;
  return <InAppStrip decision={decision} page={page} bucket={bucket} />;
}

function InAppStrip({
  decision,
  page,
  bucket,
}: {
  decision: StripDecision;
  page: StripPage;
  bucket: number | null;
}) {
  const { t } = useLocale();
  const s = t.auth.inAppStrip;
  const titleId = useId();
  const [urls, setUrls] = useState<{ external: string; intent: string | null } | null>(null);
  const [copied, setCopied] = useState(false);
  const [retry, setRetry] = useState(false);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const external = buildExternalUrl({
      href: window.location.href,
      bucket,
      firstTouch: readFirstTouchCookie(),
    });
    setUrls({ external, intent: buildIntentUrl(external) });
    const pending = timers.current;
    return () => pending.forEach((timer) => window.clearTimeout(timer));
  }, [bucket]);

  function report(kind: "open" | "copy") {
    void trackInAppStripAction({
      kind,
      app: decision.app,
      platform: decision.platform,
      page,
      bucket,
    });
  }

  function handleOpen(event: MouseEvent<HTMLAnchorElement>) {
    if (!urls?.intent) {
      event.preventDefault();
      return;
    }
    report("open");
    // The address opens Chrome and this page goes to the background. If it is still on screen a
    // moment later, nothing opened, so say what to do by hand.
    timers.current.push(
      window.setTimeout(() => {
        if (document.visibilityState === "visible") setRetry(true);
      }, 1500),
    );
  }

  async function handleCopy() {
    if (!urls) return;
    if (!(await copyText(urls.external))) return;
    report("copy");
    setCopied(true);
    timers.current.push(window.setTimeout(() => setCopied(false), 2000));
  }

  const appName = decision.app === "facebook" ? s.appFacebook : s.appInstagram;
  const android = decision.platform === "android";

  return (
    <div
      role="group"
      aria-labelledby={titleId}
      className="border-primary/35 bg-primary/10 rounded-lg border px-3.5 py-3"
    >
      <div className="mb-1.5 flex items-center gap-2">
        <ExternalLink className="text-primary size-[18px] shrink-0" aria-hidden="true" />
        <span id={titleId} dir="auto" className="text-sm font-medium">
          {s.title}
        </span>
      </div>
      <p
        dir="auto"
        className="text-foreground/75 mb-2.5 text-[13px] leading-[1.6] dark:text-[#c3c8d1]"
      >
        {(android ? s.bodyAndroid : s.bodyIos).replace("{app}", appName)}
      </p>

      {android ? (
        <>
          <div className="flex gap-2">
            <Button asChild variant="outline" className={cn(TINTED_BUTTON, "flex-1")}>
              <a href={urls?.intent ?? "#"} onClick={handleOpen}>
                {s.openButton}
              </a>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleCopy}
              className="h-10 rounded-md px-3 font-normal"
            >
              {copied ? s.copiedButton : s.copyButton}
            </Button>
          </div>
          {retry && (
            <p dir="auto" className="text-muted-foreground mt-2 text-xs leading-relaxed">
              {withIcon(
                s.retryHint,
                "{menu}",
                <EllipsisVertical className="inline size-4 align-[-3px]" aria-hidden="true" />,
              )}
            </p>
          )}
        </>
      ) : (
        <>
          <ol className="mb-2.5 flex flex-col gap-2">
            <li className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="bg-primary/[.22] text-primary inline-flex size-5 shrink-0 items-center justify-center rounded-full text-xs dark:text-[#c7d0ff]"
              >
                1
              </span>
              <span dir="auto" className="text-[13px]">
                {withIcon(
                  s.stepMenu,
                  "{menu}",
                  <Ellipsis className="inline size-4 align-[-3px]" aria-hidden="true" />,
                )}
              </span>
            </li>
            <li className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="bg-primary/[.22] text-primary inline-flex size-5 shrink-0 items-center justify-center rounded-full text-xs dark:text-[#c7d0ff]"
              >
                2
              </span>
              <span dir="auto" className="text-[13px]">
                {s.stepChoose}
              </span>
            </li>
          </ol>
          <Button
            type="button"
            variant="outline"
            onClick={handleCopy}
            className={cn(TINTED_BUTTON, "w-full")}
          >
            {copied ? s.copiedButton : s.copyButton}
          </Button>
        </>
      )}
    </div>
  );
}
