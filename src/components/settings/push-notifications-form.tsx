"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useLocale } from "@/components/providers/locale-provider";
import {
  deletePushSubscriptionAction,
  savePushSubscriptionAction,
  sendTestPushNotificationAction,
} from "@/lib/push/actions";
import { isPushSupported, subscribeToPush, unsubscribeFromPush } from "@/lib/push/client";

type Status = "idle" | "busy" | "unsupported" | "blocked" | "error";
type TestStatus = "idle" | "sending" | "sent" | "error";

/**
 * The "Enable notifications" toggle — unlike EmailPreferencesForm, this
 * can't be a plain `<form action>` submit: turning it on has to run real
 * browser API calls first (permission prompt, service worker registration,
 * PushManager.subscribe) before there's anything to save server-side, and
 * turning it off has to revoke the browser's own subscription too, not just
 * delete the DB row. So this is a controlled Switch driving async handlers
 * directly, with the initial `enabled` value coming from the server (does
 * this user have any push_subscriptions row at all — see
 * hasPushSubscription) since that's the one durable source of truth.
 */
export function PushNotificationsForm({
  initialEnabled,
  vapidPublicKey,
}: {
  initialEnabled: boolean;
  vapidPublicKey: string | null;
}) {
  const { t } = useLocale();
  const [enabled, setEnabled] = useState(initialEnabled);
  const [status, setStatus] = useState<Status>("idle");
  const [testStatus, setTestStatus] = useState<TestStatus>("idle");

  if (!vapidPublicKey) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t.settings.pushNotificationsHeading}</CardTitle>
          <CardDescription>{t.settings.pushNotificationsUnavailable}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  async function handleChange(next: boolean) {
    setStatus("busy");

    if (next) {
      if (!isPushSupported()) {
        setStatus("unsupported");
        return;
      }
      try {
        const subscription = await subscribeToPush(vapidPublicKey!);
        if (!subscription.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
          throw new Error("Incomplete subscription.");
        }
        const result = await savePushSubscriptionAction({
          endpoint: subscription.endpoint,
          keys: { p256dh: subscription.keys.p256dh, auth: subscription.keys.auth },
        });
        if (result.error) {
          setStatus("error");
          return;
        }
        setEnabled(true);
        setStatus("idle");
      } catch (error) {
        setStatus(error instanceof Error && error.message === "denied" ? "blocked" : "error");
      }
      return;
    }

    try {
      const endpoint = await unsubscribeFromPush();
      if (endpoint) await deletePushSubscriptionAction(endpoint);
      setEnabled(false);
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  }

  async function handleSendTest() {
    setTestStatus("sending");
    const result = await sendTestPushNotificationAction();
    setTestStatus(result.error ? "error" : "sent");
  }

  const statusMessage =
    status === "unsupported"
      ? t.settings.pushNotificationsUnsupported
      : status === "blocked"
        ? t.settings.pushNotificationsBlocked
        : status === "error"
          ? t.settings.pushNotificationsError
          : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t.settings.pushNotificationsHeading}</CardTitle>
        <CardDescription>{t.settings.pushNotificationsSubtitle}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-start justify-between gap-4">
          <span>
            <span className="block text-sm font-medium">
              {t.settings.pushNotificationsToggleLabel}
            </span>
            <span className="text-muted-foreground block text-sm">
              {t.settings.pushNotificationsToggleBody}
            </span>
          </span>
          <Switch
            checked={enabled}
            disabled={status === "busy"}
            onChange={(event) => handleChange(event.target.checked)}
          />
        </div>

        {statusMessage && (
          <p role="alert" className="text-danger mt-4 text-sm">
            {statusMessage}
          </p>
        )}

        {enabled && (
          <div className="mt-4 flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={testStatus === "sending"}
              onClick={handleSendTest}
            >
              {testStatus === "sending"
                ? t.settings.pushNotificationsTestSending
                : t.settings.pushNotificationsTestButton}
            </Button>
            {testStatus === "sent" && (
              <span className="text-success text-sm">{t.settings.pushNotificationsTestSent}</span>
            )}
            {testStatus === "error" && (
              <span role="alert" className="text-danger text-sm">
                {t.settings.pushNotificationsError}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
