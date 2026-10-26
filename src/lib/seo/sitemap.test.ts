import { test } from "node:test";
import assert from "node:assert/strict";

import { SUPPORT_LOCALES } from "@/lib/i18n/locales";

import { buildSitemap, sitemapUrl } from "./sitemap";

const ORIGIN = "https://sentencestep.com";
const urls = (siteUrl = ORIGIN) => buildSitemap(siteUrl).map((entry) => entry.url);

test("buildSitemap: the landing and legal pages, unprefixed and in every support locale", () => {
  const expected = [
    "/",
    "/privacy",
    "/terms",
    ...SUPPORT_LOCALES.flatMap((locale) => [
      `/${locale}`,
      `/${locale}/privacy`,
      `/${locale}/terms`,
    ]),
  ].map((path) => `${ORIGIN}${path}`);
  assert.deepEqual([...urls()].sort(), [...expected].sort());
  assert.equal(urls().length, (SUPPORT_LOCALES.length + 1) * 3);
});

test("buildSitemap: every URL is absolute, unique and without a trailing slash (but the root)", () => {
  const all = urls();
  assert.equal(new Set(all).size, all.length);
  for (const url of all) {
    assert.ok(url.startsWith(`${ORIGIN}/`), url);
    assert.ok(!url.slice(ORIGIN.length + 1).includes("//"), url);
    assert.ok(url === `${ORIGIN}/` || !url.endsWith("/"), url);
  }
});

test("buildSitemap: nothing from the app, the admin console, the API or the auth pages", () => {
  for (const url of urls()) {
    assert.doesNotMatch(url, /\/(admin|api|dev|learn|upgrade|login|register|billing)(\/|$)/, url);
  }
});

test("buildSitemap: a trailing slash on the site URL changes nothing", () => {
  assert.deepEqual(buildSitemap(`${ORIGIN}/`), buildSitemap(ORIGIN));
});

test("buildSitemap: another origin is used verbatim", () => {
  for (const url of urls("https://staging.example.test")) {
    assert.ok(url.startsWith("https://staging.example.test/"), url);
  }
});

test("buildSitemap: each page lists every language, x-default is the unprefixed page, and they agree with each other", () => {
  const entries = buildSitemap(ORIGIN);
  for (const entry of entries) {
    const languages = entry.alternates?.languages as Record<string, string> | undefined;
    assert.ok(languages, entry.url);
    assert.deepEqual(Object.keys(languages).sort(), [...SUPPORT_LOCALES, "x-default"].sort());
    // The entry itself is one of the alternates it names (a page must list itself).
    assert.ok(Object.values(languages).includes(entry.url), entry.url);
  }
  const marketing = entries.find((entry) => entry.url === `${ORIGIN}/privacy`);
  assert.deepEqual(marketing?.alternates?.languages, {
    ar: `${ORIGIN}/ar/privacy`,
    es: `${ORIGIN}/es/privacy`,
    tr: `${ORIGIN}/tr/privacy`,
    "x-default": `${ORIGIN}/privacy`,
  });
  // Reciprocal: the Arabic landing page names the same set as the unprefixed one.
  const arabic = entries.find((entry) => entry.url === `${ORIGIN}/ar`);
  const root = entries.find((entry) => entry.url === `${ORIGIN}/`);
  assert.deepEqual(arabic?.alternates?.languages, root?.alternates?.languages);
});

test("sitemapUrl: an absolute /sitemap.xml on the same origin, with or without a trailing slash", () => {
  assert.equal(sitemapUrl(ORIGIN), `${ORIGIN}/sitemap.xml`);
  assert.equal(sitemapUrl(`${ORIGIN}/`), `${ORIGIN}/sitemap.xml`);
});
