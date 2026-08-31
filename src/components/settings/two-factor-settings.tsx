"use client";

import { useEffect, useState, useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocale } from "@/components/providers/locale-provider";
import {
  enrollMfaFactor,
  listMfaFactors,
  unenrollMfaFactor,
  verifyMfaEnrollment,
} from "@/lib/supabase/mfa-actions";
import type { MfaFactorSummary } from "@/lib/supabase/mfa-actions";

type Phase = "loading" | "off" | "on" | "enrolling";

/** Settings' "Two-factor authentication" section — enroll (QR + verify), and disable, a TOTP factor for the signed-in learner. See mfa-actions.ts for every call this makes. */
export function TwoFactorSettings() {
  const { t } = useLocale();
  const [phase, setPhase] = useState<Phase>("loading");
  const [factors, setFactors] = useState<MfaFactorSummary[]>([]);
  const [enrollment, setEnrollment] = useState<{
    factorId: string;
    qrCode: string;
    secret: string;
  } | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    listMfaFactors().then((result) => {
      setFactors(result);
      setPhase(result.some((f) => f.status === "verified") ? "on" : "off");
    });
  }, []);

  function startEnroll() {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await enrollMfaFactor();
      if (result.error || !result.factorId || !result.qrCode || !result.secret) {
        setError(result.error ?? t.twoFactor.genericError);
        return;
      }
      setEnrollment({ factorId: result.factorId, qrCode: result.qrCode, secret: result.secret });
      setPhase("enrolling");
    });
  }

  function cancelEnroll() {
    const factorId = enrollment?.factorId;
    setEnrollment(null);
    setCode("");
    setError(null);
    setPhase("off");
    // Best-effort cleanup of the unverified factor — not worth blocking the
    // UI on, since a stale unverified factor grants no access either way.
    if (factorId) void unenrollMfaFactor(factorId);
  }

  function submitVerify() {
    if (!enrollment) return;
    setError(null);
    startTransition(async () => {
      const result = await verifyMfaEnrollment(enrollment.factorId, code);
      if (result.error) {
        setError(t.twoFactor.invalidCode);
        return;
      }
      setEnrollment(null);
      setCode("");
      setSuccess(t.twoFactor.enabledSuccess);
      setPhase("on");
      setFactors(await listMfaFactors());
    });
  }

  function disable() {
    const verifiedFactor = factors.find((f) => f.status === "verified");
    if (!verifiedFactor) return;
    if (!window.confirm(t.twoFactor.disableConfirm)) return;
    setError(null);
    startTransition(async () => {
      const result = await unenrollMfaFactor(verifiedFactor.id);
      if (result.error) {
        setError(result.error);
        return;
      }
      setSuccess(t.twoFactor.disabledSuccess);
      setPhase("off");
      setFactors([]);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          {t.twoFactor.heading}
          {phase === "on" && <Badge variant="success">{t.twoFactor.enabledBadge}</Badge>}
        </CardTitle>
        <CardDescription>{t.twoFactor.subtitle}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {phase === "loading" && <p className="text-muted-foreground text-sm">…</p>}

        {phase === "off" && (
          <Button onClick={startEnroll} disabled={isPending} className="w-fit">
            {t.twoFactor.enable}
          </Button>
        )}

        {phase === "on" && (
          <Button variant="outline" onClick={disable} disabled={isPending} className="w-fit">
            {t.twoFactor.disable}
          </Button>
        )}

        {phase === "enrolling" && enrollment && (
          <div className="flex flex-col gap-4">
            <p className="text-muted-foreground text-sm">{t.twoFactor.scanInstructions}</p>
            {/* eslint-disable-next-line @next/next/no-img-element -- a data: URI from Supabase's own MFA enroll response, not an optimizable remote asset */}
            <img src={enrollment.qrCode} alt="" className="size-40 rounded-lg border" />
            <p className="text-muted-foreground text-xs">
              {t.twoFactor.secretFallback}{" "}
              <code className="bg-muted rounded px-1.5 py-0.5">{enrollment.secret}</code>
            </p>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="mfa-code" className="text-sm font-medium">
                {t.twoFactor.codeLabel}
              </label>
              <input
                id="mfa-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
                placeholder={t.twoFactor.codePlaceholder}
                className="border-input bg-background h-10 w-40 rounded-lg border px-3 text-center text-lg tracking-widest"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={submitVerify} disabled={isPending || code.length !== 6}>
                {isPending ? t.twoFactor.verifying : t.twoFactor.verify}
              </Button>
              <Button variant="ghost" onClick={cancelEnroll} disabled={isPending}>
                {t.twoFactor.cancel}
              </Button>
            </div>
          </div>
        )}

        {error && (
          <p role="alert" className="text-danger text-sm">
            {error}
          </p>
        )}
        {success && <p className="text-success text-sm">{success}</p>}
      </CardContent>
    </Card>
  );
}
