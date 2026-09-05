/**
 * Converts a `data:audio/...;base64,...` URI into a Blob object URL —
 * msedge-tts's MP3 output is a raw stream with no duration/Xing header
 * (see providers/edge-tts.ts), which Chrome parses unreliably when handed
 * directly as a giant inline `<audio src="data:...">` string (shows up as
 * "0:00 / 0:00" with no playback, easy to mistake for "nothing happened").
 * A Blob URL gives the browser a real, seekable resource instead, which it
 * reads the same way as any other audio file. Caller is responsible for
 * revoking the returned URL (see URL.revokeObjectURL) once it's no longer
 * needed, to avoid leaking memory across repeated previews.
 */
export function dataUriToBlobUrl(dataUri: string): string {
  const [header, base64] = dataUri.split(",", 2);
  const mimeMatch = header?.match(/^data:(.*?)(;base64)?$/);
  const mimeType = mimeMatch?.[1] || "audio/mpeg";
  const binary = atob(base64 ?? "");
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return URL.createObjectURL(new Blob([bytes], { type: mimeType }));
}
