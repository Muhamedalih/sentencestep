import type { MetadataRoute } from "next";

/**
 * No sitemap entry here yet — a sitemap needs absolute URLs (see
 * src/lib/site-url.ts's getSiteUrl(), the one place that domain lives).
 * Everything below is host-relative and needs no domain at all, so it's
 * safe to ship without one in the meantime.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/admin/", "/api/", "/dev/"],
    },
  };
}
