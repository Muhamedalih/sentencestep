import type { MetadataRoute } from "next";

/**
 * No sitemap entry here on purpose — a sitemap needs absolute URLs, which
 * needs a real production domain, and that hasn't been chosen yet (see
 * src/lib/site-url.ts's doc comment, the one place that placeholder lives).
 * Add one alongside that decision rather than pointing crawlers at a
 * placeholder host in the meantime. Everything below is host-relative and
 * needs no domain at all, so it's safe to ship now.
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
