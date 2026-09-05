import { NextResponse } from "next/server";

import { isValidCronAuth } from "@/lib/cron/auth";
import { createElevenLabsProvider } from "@/lib/voice/providers/elevenlabs";

/**
 * TEMPORARY — checks whether the ElevenLabs key deployed on Netlify (which
 * may differ from the local .env.local copy already confirmed invalid) can
 * actually synthesize. Gated behind CRON_SECRET like every other cron
 * route. Delete once answered.
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

  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) {
    return NextResponse.json({ hasKey: false });
  }

  try {
    const provider = createElevenLabsProvider(key);
    const { audio } = await provider.synthesize({
      text: "Testing.",
      voiceId: "21m00Tcm4TlvDq8ikWAM", // ElevenLabs' own public "Rachel" premade voice — always exists on any account, no admin setup needed to test with.
      model: "eleven_multilingual_v2",
      voiceSettings: {
        stability: 0.5,
        similarityBoost: 0.75,
        style: 0,
        speed: 1,
        useSpeakerBoost: true,
      },
    });
    return NextResponse.json({ hasKey: true, ok: true, detail: `received ${audio.length} bytes` });
  } catch (err) {
    return NextResponse.json({
      hasKey: true,
      ok: false,
      detail: err instanceof Error ? err.message : String(err),
    });
  }
}
