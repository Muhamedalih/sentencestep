import type { MetadataRoute } from "next";

import { buildSitemap } from "@/lib/seo/sitemap";
import { getSiteUrl } from "@/lib/site-url";

/** "/sitemap.xml" — the marketing pages in every language (see src/lib/seo/sitemap.ts); robots.txt points here. */
export default function sitemap(): MetadataRoute.Sitemap {
  return buildSitemap(getSiteUrl());
}
