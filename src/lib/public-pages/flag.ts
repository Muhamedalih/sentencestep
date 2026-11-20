/**
 * The one switch of the public pages (the rule pages, the grammar index and the About page, see
 * src/lib/public-pages/). They are statically pre-rendered, so they cannot be "Admins only" the way a
 * learner-side feature is (there is no request to check a permission on). The equivalent was a dark launch:
 * while this is false the pages are published but closed to search engines (`noindex`), left out of the
 * sitemap and llms.txt, and linked from nowhere on the site: they open only by their address.
 *
 * Opened on the owner's word (2026-11-21): the pages with an article (rule-articles.ts) are now offered to
 * Google, Bing and the AI assistants through the sitemap and llms.txt. To close them again set this back
 * to false and publish: every page goes back to `noindex` and leaves the sitemap and llms.txt.
 */
export const PUBLIC_PAGES_INDEXABLE = true;

/** The language the public pages are written in. The rules also have Spanish and Turkish text; those wait until the Arabic pages are indexed. */
export const PUBLIC_PAGES_LOCALE = "ar" as const;
