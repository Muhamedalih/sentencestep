import { NextResponse } from "next/server";

import { isValidCronAuth } from "@/lib/cron/auth";
import { getTTSProvider } from "@/lib/voice/provider-registry";

/**
 * TEMPORARY — added to diagnose a live-only discrepancy (Netlify's env var
 * dashboard listed no GEMINI_API_KEY, yet the deployed voice-sweep function
 * was resolving getTTSProvider() to "gemini"). Reveals presence, never
 * values, of each provider key, gated behind the same CRON_SECRET every
 * other cron route already requires. Delete this file once the mismatch is
 * understood.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET is not configured." }, { status: 501 });
  }
  const authHeader = request.headers.get("authorization") ?? "";
  if (!isValidCronAuth(authHeader, cronSecret)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  return NextResponse.json({
    hasAzureKey: Boolean(process.env.AZURE_SPEECH_KEY),
    hasAzureRegion: Boolean(process.env.AZURE_SPEECH_REGION),
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    hasElevenLabsKey: Boolean(process.env.ELEVENLABS_API_KEY),
    activeProvider: getTTSProvider().name,
  });
}
