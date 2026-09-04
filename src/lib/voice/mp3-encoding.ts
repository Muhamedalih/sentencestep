/** 64kbps mono — a short spoken sentence doesn't benefit from higher bitrates, and this keeps generated clips small without audible quality loss for speech. */
const MP3_BITRATE_KBPS = 64;
const MP3_BLOCK_SIZE = 1152;

/** Shared PCM->MP3 encoder used by any provider that returns raw PCM (currently providers/gemini.ts) rather than an already-encoded format. */
export async function encodeMp3(pcm16: Int16Array, sampleRate: number): Promise<Buffer> {
  const { Mp3Encoder } = await import("@breezystack/lamejs");
  const encoder = new Mp3Encoder(1, sampleRate, MP3_BITRATE_KBPS);
  const chunks: Buffer[] = [];
  for (let i = 0; i < pcm16.length; i += MP3_BLOCK_SIZE) {
    const block = pcm16.subarray(i, i + MP3_BLOCK_SIZE);
    const mp3buf = encoder.encodeBuffer(block);
    if (mp3buf.length > 0) chunks.push(Buffer.from(mp3buf));
  }
  const end = encoder.flush();
  if (end.length > 0) chunks.push(Buffer.from(end));
  return Buffer.concat(chunks);
}
