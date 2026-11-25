/**
 * Reads a request body as text but never more than `maxBytes`.
 *
 * Checking the `Content-Length` header is not enough: a request sent in chunks (no length at all, or
 * a false one) would still be read to the end. These endpoints are open to the internet before any
 * signature is checked, so the read itself must be capped. Returns null when the body is larger.
 */
export async function readBytesCapped(
  request: Request,
  maxBytes: number,
): Promise<Uint8Array | null> {
  const declared = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declared) && declared > maxBytes) return null;

  const stream = request.body;
  if (!stream) return new Uint8Array(0);

  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel().catch(() => undefined);
        return null;
      }
      chunks.push(value);
    }
  } catch {
    return null;
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

/** The same, as text. */
export async function readBodyCapped(request: Request, maxBytes: number): Promise<string | null> {
  const bytes = await readBytesCapped(request, maxBytes);
  return bytes === null ? null : new TextDecoder().decode(bytes);
}
