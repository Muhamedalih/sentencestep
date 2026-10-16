/**
 * Whether a request was sent by one of this site's own pages. Next.js checks this itself for
 * Server Actions; a Route Handler that changes something for a signed-in admin (the passage
 * background upload) must check it too, or another website could make an admin's browser
 * post to it. The browser always names the page's origin on a POST or DELETE, and a request
 * from anywhere else names a different one.
 *
 * The host is the one the request was sent to, as Cloudflare and the web server pass it on.
 */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;

  const forwarded = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwarded || request.headers.get("host");
  if (!host) return false;

  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
