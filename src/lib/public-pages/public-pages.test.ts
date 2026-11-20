import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { ALL_RULES, ruleById } from "@/lib/daily-rule/levels";
import { teachFor } from "@/lib/daily-rule/teach";
import { SUPPORT_LOCALES } from "@/lib/i18n/locales";
import { buildSitemap } from "@/lib/seo/sitemap";

import { ABOUT, ABOUT_FAQS } from "./about-content";
import { isRightAnswer, normalizeAnswer } from "./answer";
import { PUBLIC_PAGES_INDEXABLE } from "./flag";
import { jsonLdString } from "./json-ld";
import { buildLlmsTxt } from "./llms";
import { segmentMixed, splitBrackets } from "./mixed-text";
import { IS_PUBLIC_PAGE_PATH_JS, isPublicPagePath, landingSectionOf } from "./paths";
import { RULE_ARTICLES } from "./rule-articles";
import {
  buildRulePage,
  isRuleIndexable,
  parseExample,
  publicRuleSlugs,
  publicRules,
} from "./rule-page-data";
import { ruleForSlug, slugForRule } from "./rule-slugs";

const ORIGIN = "https://sentencestep.com";
const words = (text: string) => (text.match(/[\p{L}\p{N}']+/gu) ?? []).length;

test("slugs: every rule has a unique, non-empty, lower-case ASCII slug that leads back to it", () => {
  const seen = new Set<string>();
  for (const rule of ALL_RULES) {
    const slug = slugForRule(rule.id);
    assert.ok(slug, rule.id);
    assert.match(slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/, `${rule.id}: ${slug}`);
    assert.ok(!seen.has(slug), `duplicate slug ${slug}`);
    seen.add(slug);
    assert.equal(ruleForSlug(slug)?.id, rule.id);
  }
  assert.equal(slugForRule("a2-16"), "for-since");
});

test("articles: each one belongs to a real rule and has six translated examples in order", () => {
  const ids = Object.keys(RULE_ARTICLES);
  assert.equal(ids.length, 34);
  for (const id of ids) {
    assert.ok(ruleById(id), `${id} is not a rule of the course`);
    const teach = teachFor(id);
    assert.ok(teach, id);
    const examples = (teach.items ?? []).map((item) => parseExample(item));
    assert.ok(
      examples.every((example) => example !== null),
      `${id}: a prepared sentence has no blank`,
    );
    const article = RULE_ARTICLES[id]!;
    assert.equal(article.examplesAr.length, examples.length, `${id}: one translation per sentence`);
    for (const line of article.examplesAr) assert.ok(line.trim().length > 5, id);
  }
});

test("articles: a page is worth reading (enough words, real answers, a title and a description of a sensible length)", () => {
  for (const id of Object.keys(RULE_ARTICLES)) {
    const model = buildRulePage(slugForRule(id)!, "ar");
    assert.ok(model, id);
    const { article } = model;
    assert.ok(article.h1.length >= 12 && article.h1.length <= 90, `${id} title length`);
    assert.ok(
      article.description.length >= 60 && article.description.length <= 220,
      `${id} description length ${article.description.length}`,
    );
    assert.ok(article.faqs.length >= 2, `${id} needs two questions`);
    for (const faq of article.faqs) {
      assert.ok(faq.q.trim().length > 8 && faq.a.trim().length > 20, `${id}: ${faq.q}`);
    }
    const text = [
      model.ideaAr,
      model.right,
      model.wrong,
      ...model.notes.flatMap((note) => [note.say.ar, ...note.examples]),
      ...article.blocks.flatMap((block) =>
        block.kind === "table"
          ? [...block.head, ...block.rows.flat()]
          : block.kind === "list"
            ? [...block.items]
            : [block.text],
      ),
      ...article.examplesAr,
      ...model.examples.map((example) => example.full),
      ...article.faqs.flatMap((faq) => [faq.q, faq.a]),
    ].join(" ");
    assert.ok(words(text) >= 180, `${id}: only ${words(text)} words`);
    assert.doesNotMatch(
      [article.h1, article.description, ...article.examplesAr].join(" "),
      /[[\]{}]/,
      `${id}: a marker left in the text`,
    );
  }
});

test("pages exist only for rules with an article, and only those are indexable (and only when the switch is on)", () => {
  assert.equal(publicRules().length, Object.keys(RULE_ARTICLES).length);
  assert.equal(publicRuleSlugs().length, publicRules().length);
  const withoutArticle = ALL_RULES.find((rule) => !RULE_ARTICLES[rule.id])!;
  assert.equal(buildRulePage(slugForRule(withoutArticle.id)!, "ar"), null);
  assert.equal(isRuleIndexable(withoutArticle.id), false);
  const withArticle = publicRules()[0]!;
  assert.equal(isRuleIndexable(withArticle.id), PUBLIC_PAGES_INDEXABLE);
});

test("buildRulePage: the page's neighbours and close rules are rules that have a page", () => {
  const known = new Set(publicRuleSlugs().map((slug) => `/ar/grammar/${slug}`));
  for (const rule of publicRules()) {
    const model = buildRulePage(slugForRule(rule.id)!, "ar")!;
    for (const link of [model.previous, model.next, ...model.related]) {
      if (link) assert.ok(known.has(link.href), link.href);
    }
    assert.ok(!model.related.some((link) => link.href === `/ar/grammar/${model.slug}`));
  }
});

test("parseExample: the blank, its other answers and its hint", () => {
  assert.deepEqual(parseExample("Ali is at school. He [isn't|is not] at home."), {
    before: "Ali is at school. He ",
    answers: ["isn't", "is not"],
    after: " at home.",
    hint: null,
    full: "Ali is at school. He isn't at home.",
  });
  assert.equal(parseExample("I [saw] that film last week.{see}")?.hint, "see");
  assert.equal(parseExample("No blank here."), null);
});

test("answers: case, spacing and curly apostrophes do not matter; an empty answer is never right", () => {
  assert.equal(normalizeAnswer("  Aren’t  "), "aren't");
  assert.ok(isRightAnswer("ARE not", ["are not", "aren't"]));
  assert.ok(isRightAnswer("aren’t", ["are not", "aren't"]));
  assert.ok(!isRightAnswer("", ["", "x"]));
  assert.ok(!isRightAnswer("is", ["are"]));
});

test("segmentMixed: English runs are their own pieces, brackets stay with them only when both are there", () => {
  const join = (text: string) =>
    segmentMixed(text)
      .map((segment) => segment.text)
      .join("");
  for (const text of [
    "نستعمل since مع نقطة البداية (since 2020).",
    "I like music. Dogs are loyal. ونستعمل the فقط",
    "(have / has + past participle) وكذلك (for)",
    "بدون إنجليزية أبداً",
  ]) {
    assert.equal(join(text), text);
  }
  assert.deepEqual(
    segmentMixed("نستعمل since مع (since 2020).")
      .filter((piece) => piece.latin)
      .map((piece) => piece.text),
    ["since", "(since 2020)"],
  );
  // After one or two English words the full stop belongs to the Arabic sentence.
  assert.deepEqual(
    segmentMixed("فاستعمل since. إذا")
      .filter((piece) => piece.latin)
      .map((piece) => piece.text),
    ["since"],
  );
  assert.deepEqual(
    segmentMixed("I like music. Dogs are loyal.")
      .filter((piece) => piece.latin)
      .map((piece) => piece.text),
    ["I like music. Dogs are loyal."],
  );
});

test("splitBrackets: the part the rule is about, first answer only", () => {
  assert.deepEqual(splitBrackets("She [isn't|is not] here"), [
    { text: "She ", marked: false },
    { text: "isn't", marked: true },
    { text: " here", marked: false },
  ]);
});

test("isPublicPagePath: the public pages and only them", () => {
  for (const path of [
    "/ar/about",
    "/ar/grammar",
    "/ar/grammar/for-since",
    "/es/grammar/",
    "/tr/about",
  ]) {
    assert.ok(isPublicPagePath(path), path);
  }
  for (const path of [
    "/",
    "/ar",
    "/ar/privacy",
    "/about",
    "/grammar",
    "/learn",
    "/ar/grammar/a/b",
    "/ar/aboutx",
    "/en/about",
  ]) {
    assert.ok(!isPublicPagePath(path), path);
  }
});

test("the inline script test (what runs in the browser) agrees with isPublicPagePath", () => {
  const run = (pathname: string) =>
    new Function("window", `return ${IS_PUBLIC_PAGE_PATH_JS};`)({
      location: { pathname },
    }) as boolean;
  for (const path of [
    "/ar/about",
    "/ar/grammar",
    "/ar/grammar/for-since",
    "/",
    "/ar",
    "/ar/privacy",
    "/learn",
    "/ar/grammar/a/b",
  ]) {
    assert.equal(run(path), isPublicPagePath(path), path);
  }
});

test("landingSectionOf: the part of the site a first page belongs to", () => {
  assert.equal(landingSectionOf("/"), "home");
  assert.equal(landingSectionOf("/ar"), "home");
  assert.equal(landingSectionOf("/ar/grammar/for-since"), "grammar");
  assert.equal(landingSectionOf("/ar/about"), "about");
  assert.equal(landingSectionOf("/learn/stories/story-81"), "learn");
  assert.equal(landingSectionOf("/privacy"), "legal");
  assert.equal(landingSectionOf("/es/terms"), "legal");
  assert.equal(landingSectionOf("/upgrade"), "upgrade");
  assert.equal(landingSectionOf("/login"), "auth");
  assert.equal(landingSectionOf("/something-else"), "other");
  for (const path of ["/", "/ar/grammar/x", "/learn", "/zzz"]) {
    assert.match(landingSectionOf(path), /^[a-z0-9_-]{1,32}$/);
  }
});

test("sitemap: closed adds nothing; open adds the About page, the index and every rule page, in Arabic only", () => {
  const closed = buildSitemap(ORIGIN, false).map((entry) => entry.url);
  assert.equal(closed.length, (SUPPORT_LOCALES.length + 1) * 3);
  assert.ok(closed.every((url) => !/\/(grammar|about)/.test(url)));

  const open = buildSitemap(ORIGIN, true).map((entry) => entry.url);
  const added = open.filter((url) => !closed.includes(url));
  assert.equal(added.length, 2 + publicRuleSlugs().length);
  assert.ok(added.includes(`${ORIGIN}/ar/about`));
  assert.ok(added.includes(`${ORIGIN}/ar/grammar`));
  assert.ok(added.includes(`${ORIGIN}/ar/grammar/for-since`));
  assert.ok(added.every((url) => url.startsWith(`${ORIGIN}/ar/`)));
  assert.equal(new Set(open).size, open.length);
});

test("llms.txt: names only the open pages", () => {
  const closed = buildLlmsTxt(ORIGIN, false);
  assert.match(closed, /^# SentenceStep/);
  assert.doesNotMatch(closed, /\/ar\/(grammar|about)/);
  assert.match(closed, /\/terms/);
  const open = buildLlmsTxt(`${ORIGIN}/`, true);
  assert.match(open, new RegExp(`${ORIGIN}/ar/grammar/for-since`));
  assert.match(open, new RegExp(`${ORIGIN}/ar/about`));
  assert.doesNotMatch(open, /com\/\/ar\//);
});

test("jsonLdString: no text can close the script tag", () => {
  const text = jsonLdString({ name: "</script><script>alert(1)</script>" });
  assert.ok(!text.includes("<"));
  assert.deepEqual(JSON.parse(text), { name: "</script><script>alert(1)</script>" });
});

test("About page: the numbers come from the course, and every question has an answer", () => {
  assert.ok(ABOUT.contents().some((line) => line.includes(String(ALL_RULES.length))));
  assert.ok(ABOUT_FAQS.length >= 6);
  for (const faq of ABOUT_FAQS) assert.ok(faq.a.length > 20, faq.q);
  assert.ok(ABOUT.description.length <= 220);
});

/**
 * The public pages show text and nothing else of the product: no audio, no stories or lessons from the
 * database, no library books, no video, no payments, no learner data. A new import of any of those into
 * the public pages is a decision, not an accident, so it fails here first.
 */
test("the public pages import nothing that is paid, private or someone else's", () => {
  const roots = [
    "src/lib/public-pages",
    "src/components/public-pages",
    "src/app/[locale]/grammar",
    "src/app/[locale]/about",
  ];
  const forbidden =
    /from "[^"]*(supabase|video|library|book|voice|audio|billing|payment|progress|content"|word-lists|passages|admin|features|rollouts)[^"]*"/i;
  const files: string[] = [];
  const walk = (path: string) => {
    for (const name of readdirSync(path)) {
      const full = join(path, name);
      if (statSync(full).isDirectory()) walk(full);
      else if (/\.(ts|tsx)$/.test(name) && !name.endsWith(".test.ts")) files.push(full);
    }
  };
  for (const root of roots) walk(root);
  assert.ok(files.length > 10);
  for (const file of files) {
    for (const line of readFileSync(file, "utf8").split("\n")) {
      if (/^\s*(import|\} from)/.test(line)) {
        assert.doesNotMatch(line, forbidden, `${file}: ${line.trim()}`);
      }
    }
  }
});
