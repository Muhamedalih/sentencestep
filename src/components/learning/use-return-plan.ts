"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { savePushSubscriptionAction } from "@/lib/push/actions";
import { isPushSupported, subscribeToPush } from "@/lib/push/client";
import { returnChoices } from "@/lib/return-loop/choices";
import type { ReturnChoices } from "@/lib/return-loop/choices";
import { setReturnReminderAction } from "@/lib/return-loop/actions";
import { trackReturnLoopAction } from "@/lib/return-loop/track-actions";
import { reminderTimeFor } from "@/lib/session-end/reminder";

/** Where the card is shown: the end of the first lesson, the page after a guest signs up, or the end of a session. */
export type ReturnDoor = "opener" | "welcome" | "session";

export type ReturnChannel = "push" | "email" | "none";

/** What a time press ended in. `fallback_email`: notifications were not allowed, so the email was chosen instead. */
export type ReturnStatus =
  "idle" | "saving" | "push" | "email" | "fallback_email" | "none" | "error" | "blocked";

/** What the card needs from the server (one request per card, see fetchReturnHookAction and fetchSessionEndAction). */
export interface ReturnPlanData {
  canEmail: boolean;
  vapidPublicKey: string | null;
  /** Tomorrow's lesson, named in the message and opened by it; null when none is known. */
  next: { id: string; mode: string; title: string } | null;
}

export interface ReturnPlan {
  choices: ReturnChoices;
  /** How a reminder would reach this learner if they pressed a time now. */
  channel: ReturnChannel;
  status: ReturnStatus;
  selectedHour: number | null;
  choose: (hour: number) => void;
  decline: () => void;
}

function pickChannel(data: ReturnPlanData): ReturnChannel {
  if (
    data.vapidPublicKey &&
    isPushSupported() &&
    typeof Notification !== "undefined" &&
    Notification.permission !== "denied"
  ) {
    return "push";
  }
  return data.canEmail ? "email" : "none";
}

/** Asks the browser for permission (this runs inside a press, which is what browsers want), subscribes, and saves the subscription. "denied" covers a refusal and a closed prompt. */
async function subscribeAndSave(vapidPublicKey: string): Promise<"ok" | "denied" | "error"> {
  try {
    const subscription = await subscribeToPush(vapidPublicKey);
    if (!subscription.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
      return "error";
    }
    const saved = await savePushSubscriptionAction({
      endpoint: subscription.endpoint,
      keys: { p256dh: subscription.keys.p256dh, auth: subscription.keys.auth },
    });
    return saved.error ? "error" : "ok";
  } catch (error) {
    return error instanceof Error && (error.message === "denied" || error.message === "dismissed")
      ? "denied"
      : "error";
  }
}

/**
 * The state of the return loop's card for one learner: the two times offered (computed once, in the
 * learner's own clock), how a reminder would reach them, and what pressing a time does. Pressing a
 * time is the only thing that sends or stores anything: it asks the browser for notifications (only
 * then), saves the choice on the server, and falls back to the learner's email when notifications are
 * refused. Returns null until the server's answer (`data`) is in, so the card never renders on the
 * server and never shows a time computed there.
 */
export function useReturnPlan(door: ReturnDoor, data: ReturnPlanData | null): ReturnPlan | null {
  const [choices] = useState(() => returnChoices(new Date()));
  const [status, setStatus] = useState<ReturnStatus>("idle");
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const busy = useRef(false);
  const shown = useRef(false);

  const channel = useMemo<ReturnChannel>(() => (data ? pickChannel(data) : "none"), [data]);

  useEffect(() => {
    if (!data || channel === "none" || shown.current) return;
    shown.current = true;
    void trackReturnLoopAction(door, "shown").catch(() => {});
  }, [data, channel, door]);

  const finish = useCallback(
    (outcome: ReturnStatus) => {
      setStatus(outcome);
      const step =
        outcome === "push" || outcome === "email" || outcome === "fallback_email"
          ? outcome
          : outcome === "none"
            ? "none"
            : "error";
      void trackReturnLoopAction(door, step).catch(() => {});
    },
    [door],
  );

  const choose = useCallback(
    (hour: number) => {
      if (!data || busy.current) return;
      busy.current = true;
      setSelectedHour(hour);
      setStatus("saving");
      const remindAt = reminderTimeFor(hour).toISOString();
      const lesson = data.next ? { mode: data.next.mode, id: data.next.id } : null;

      const byEmail = async (fallback: boolean): Promise<ReturnStatus> => {
        if (!data.canEmail) return "blocked";
        const result = await setReturnReminderAction({ remindAt, channel: "email", lesson });
        return result.ok ? (fallback ? "fallback_email" : "email") : "error";
      };

      void (async () => {
        try {
          if (channel === "push" && data.vapidPublicKey) {
            const pushed = await subscribeAndSave(data.vapidPublicKey);
            if (pushed === "ok") {
              const result = await setReturnReminderAction({ remindAt, channel: "push", lesson });
              finish(result.ok ? "push" : await byEmail(true));
            } else {
              finish(await byEmail(true));
            }
          } else {
            finish(await byEmail(false));
          }
        } catch {
          finish("error");
        } finally {
          busy.current = false;
        }
      })();
    },
    [channel, data, finish],
  );

  const decline = useCallback(() => {
    if (busy.current) return;
    busy.current = true;
    setSelectedHour(null);
    setStatus("saving");
    void (async () => {
      try {
        const result = await setReturnReminderAction({
          remindAt: null,
          channel: channel === "push" ? "push" : "email",
        });
        finish(result.ok ? "none" : "error");
      } catch {
        finish("error");
      } finally {
        busy.current = false;
      }
    })();
  }, [channel, finish]);

  if (!data) return null;
  return { choices, channel, status, selectedHour, choose, decline };
}
