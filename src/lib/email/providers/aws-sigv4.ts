import { createHash, createHmac } from "node:crypto";

/**
 * AWS Signature Version 4 for one request, written with node:crypto so signing needs no AWS SDK
 * (the same choice the Resend adapter makes: one POST does not justify a dependency). Pure: the
 * clock is passed in, so a test can pin it to AWS's published example and compare the signature.
 * https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_sigv-create-signed-request.html
 */
export interface SigV4Input {
  method: string;
  /** The full URL, e.g. https://email.us-east-1.amazonaws.com/v2/email/outbound-emails */
  url: string;
  region: string;
  /** The signing name of the service ("ses" for Amazon SES). */
  service: string;
  /** Headers that are sent and signed. `host` and `x-amz-date` are added here. */
  headers?: Record<string, string>;
  body?: string;
  accessKeyId: string;
  secretAccessKey: string;
  now: Date;
}

export interface SigV4Output {
  /** Every header to send: the ones given, plus x-amz-date and authorization. */
  headers: Record<string, string>;
  signature: string;
}

const sha256Hex = (data: string): string => createHash("sha256").update(data, "utf8").digest("hex");
const hmac = (key: Buffer | string, data: string): Buffer =>
  createHmac("sha256", key).update(data, "utf8").digest();

/** RFC 3986 percent-encoding, which also escapes the characters encodeURIComponent leaves alone. */
const encode = (value: string): string =>
  encodeURIComponent(value).replace(
    /[!'()*]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
  );

export function signAwsRequest(input: SigV4Input): SigV4Output {
  const url = new URL(input.url);
  const amzDate = input.now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);

  const sent: Record<string, string> = { ...(input.headers ?? {}), "x-amz-date": amzDate };
  const signed: Record<string, string> = { host: url.host };
  for (const [name, value] of Object.entries(sent)) {
    signed[name.toLowerCase()] = value.trim().replace(/\s+/g, " ");
  }
  const names = Object.keys(signed).sort();
  const canonicalHeaders = names.map((name) => `${name}:${signed[name]}\n`).join("");
  const signedHeaders = names.join(";");

  const canonicalQuery = [...url.searchParams.entries()]
    .map(([key, value]) => [encode(key), encode(value)] as const)
    .sort((a, b) => (a[0] === b[0] ? (a[1] < b[1] ? -1 : 1) : a[0] < b[0] ? -1 : 1))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  const canonicalRequest = [
    input.method.toUpperCase(),
    url.pathname || "/",
    canonicalQuery,
    canonicalHeaders,
    signedHeaders,
    sha256Hex(input.body ?? ""),
  ].join("\n");

  const scope = `${dateStamp}/${input.region}/${input.service}/aws4_request`;
  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, scope, sha256Hex(canonicalRequest)].join("\n");
  const signingKey = hmac(
    hmac(hmac(hmac(`AWS4${input.secretAccessKey}`, dateStamp), input.region), input.service),
    "aws4_request",
  );
  const signature = hmac(signingKey, stringToSign).toString("hex");

  return {
    headers: {
      ...sent,
      authorization: `AWS4-HMAC-SHA256 Credential=${input.accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
    },
    signature,
  };
}
