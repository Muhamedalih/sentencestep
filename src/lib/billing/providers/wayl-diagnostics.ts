import { createHmac } from "node:crypto";

/**
 * Test-mode diagnostics for Wayl webhook deliveries (see the webhook route).
 * Summarises what arrived without keeping anything personal or secret: header
 * names, the shape of the signature (never its value), the body's key names
 * and a few non-personal fields, and which signing scheme, if any, reproduces
 * the signature, so a delivery that was rejected can be explained.
 */

const SIGNATURE_HEADER = "x-wayl-signature-256";
const SAFE_VALUE_KEYS = [
  "verb",
  "event",
  "paymentStatus",
  "paymentMethod",
  "paymentProcessor",
] as const;
const MAX_VALUE_CHARS = 60;

export interface WaylAttemptSummary {
  status: number;
  headerNames: string[];
  contentType: string | null;
  userAgent: string | null;
  signature: {
    present: boolean;
    length: number;
    hex: boolean;
    base64: boolean;
    prefixed: boolean;
  };
  bodyBytes: number;
  body: {
    json: boolean;
    keys: string[];
    customerKeys: string[];
    values: Record<string, string>;
  };
  /** The signing scheme that reproduces the signature, or null when none does. */
  signatureMatch: string | null;
}

export interface WaylAttemptInput {
  /** The HTTP status the webhook route answered with. */
  status: number;
  rawBody: Uint8Array;
  headers: Headers;
  secret: string;
}

function parseJsonObject(text: string): Record<string, unknown> | null {
  try {
    const parsed: unknown = JSON.parse(text);
    return parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function findSignatureMatch(
  presented: string,
  rawBody: Uint8Array,
  text: string,
  secret: string,
): string | null {
  const messages: Array<[string, Buffer]> = [
    ["raw", Buffer.from(rawBody)],
    ["trimmed", Buffer.from(text.trim())],
  ];
  const parsed = parseJsonObject(text);
  if (parsed) messages.push(["reserialized", Buffer.from(JSON.stringify(parsed))]);

  const keys: Array<[string, string | Buffer]> = [["utf8", secret]];
  if (/^(?:[0-9a-f]{2})+$/i.test(secret)) keys.push(["hexbytes", Buffer.from(secret, "hex")]);

  for (const [keyName, key] of keys) {
    for (const [messageName, message] of messages) {
      const digest = createHmac("sha256", key).update(message).digest();
      const candidates: Array<[string, string, string]> = [
        ["hex", digest.toString("hex"), presented.toLowerCase()],
        ["base64", digest.toString("base64"), presented],
        ["base64url", digest.toString("base64url"), presented],
      ];
      for (const [encoding, expected, given] of candidates) {
        if (given === expected) {
          return `key=${keyName} message=${messageName} encoding=${encoding}`;
        }
      }
    }
  }
  return null;
}

export function summarizeWaylWebhookAttempt(input: WaylAttemptInput): WaylAttemptSummary {
  const { status, rawBody, headers, secret } = input;
  const text = Buffer.from(rawBody).toString("utf8");
  const parsed = parseJsonObject(text);

  const presented = headers.get(SIGNATURE_HEADER)?.trim() ?? "";
  const bare = presented.replace(/^sha256=/i, "");

  const headerNames: string[] = [];
  headers.forEach((_value, name) => headerNames.push(name));

  const values: Record<string, string> = {};
  if (parsed) {
    for (const key of SAFE_VALUE_KEYS) {
      const value = parsed[key];
      if (typeof value === "string") values[key] = value.slice(0, MAX_VALUE_CHARS);
    }
  }
  const customer = parsed?.customer;

  return {
    status,
    headerNames: headerNames.sort(),
    contentType: headers.get("content-type")?.slice(0, 120) ?? null,
    userAgent: headers.get("user-agent")?.slice(0, 120) ?? null,
    signature: {
      present: presented !== "",
      length: bare.length,
      hex: /^[0-9a-f]+$/i.test(bare),
      base64: /^[A-Za-z0-9+/_-]+={0,2}$/.test(bare),
      prefixed: /^sha256=/i.test(presented),
    },
    bodyBytes: rawBody.byteLength,
    body: {
      json: parsed !== null,
      keys: parsed ? Object.keys(parsed).sort() : [],
      customerKeys:
        customer !== null && typeof customer === "object" && !Array.isArray(customer)
          ? Object.keys(customer).sort()
          : [],
      values,
    },
    signatureMatch: bare === "" ? null : findSignatureMatch(bare, rawBody, text, secret),
  };
}
