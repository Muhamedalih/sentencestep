import type { MetadataRoute } from "next";

import { sitemapUrl } from "@/lib/seo/sitemap";
import { getSiteUrl } from "@/lib/site-url";

/**
 * Everything is open to crawlers except the admin console, the API and the dev routes. The
 * sitemap line must be an absolute URL, so it is built from src/lib/site-url.ts's getSiteUrl(),
 * the one place that domain lives (see src/app/sitemap.ts for what it lists).
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/admin/", "/api/", "/dev/"],
    },
    sitemap: sitemapUrl(getSiteUrl()),
  };
}
