// Regression coverage for the email layout's HTML escaping — run with
// `npm run test:email`. Added after discovering ctaUrl/unsubscribeUrl were
// interpolated into href="..." unescaped (Milestone 17), reachable via
// origin values derived from request headers in three call sites.

import { test } from "node:test";
import assert from "node:assert/strict";

import { escapeHtml, renderEmailLayout } from "./layout";

test("escapeHtml: escapes all five HTML-significant characters", () => {
  assert.equal(escapeHtml(`&<>"'`), "&amp;&lt;&gt;&quot;&#39;");
});

test("renderEmailLayout: a malicious ctaUrl cannot break out of the href attribute", () => {
  const html = renderEmailLayout({
    previewText: "preview",
    heading: "heading",
    bodyHtml: "<p>body</p>",
    ctaLabel: "Click",
    ctaUrl: `https://sentencestep.example/learn"><script>alert(1)</script>`,
    unsubscribeUrl: "https://sentencestep.example/learn/settings",
  });
  assert.ok(!html.includes("<script>"), "raw <script> tag must not appear in the rendered HTML");
  assert.ok(
    html.includes("&lt;script&gt;"),
    "the malicious payload must be present only in escaped form",
  );
});

test("renderEmailLayout: a malicious unsubscribeUrl cannot break out of the href attribute", () => {
  const html = renderEmailLayout({
    previewText: "preview",
    heading: "heading",
    bodyHtml: "<p>body</p>",
    ctaLabel: "Click",
    ctaUrl: "https://sentencestep.example/learn",
    unsubscribeUrl: `https://sentencestep.example/x" onmouseover="alert(1)`,
  });
  assert.ok(
    !html.includes('onmouseover="alert(1)"'),
    "injected attribute must not become live HTML",
  );
  assert.ok(html.includes("&quot;"), "the quote in the malicious payload must be escaped");
});

test("renderEmailLayout: omits the call-to-action button when no ctaLabel/ctaUrl is given", () => {
  const html = renderEmailLayout({
    previewText: "preview",
    heading: "heading",
    bodyHtml: "<p>body</p>",
    unsubscribeUrl: "https://sentencestep.example/learn/settings",
  });
  assert.ok(!html.includes("text-decoration:none;font-weight:600"), "no CTA anchor expected");
  assert.ok(html.includes("<p>body</p>"));
});

test("renderEmailLayout: omits the preferences link when no unsubscribeUrl is given", () => {
  const html = renderEmailLayout({
    previewText: "preview",
    heading: "heading",
    bodyHtml: "<p>body</p>",
  });
  assert.ok(!html.includes("Manage email preferences"));
  assert.ok(html.includes("you're a SentenceStep admin"));
});

test("renderEmailLayout: a footerNote replaces the default footer and is escaped", () => {
  const html = renderEmailLayout({
    previewText: "preview",
    heading: "heading",
    bodyHtml: "<p>body</p>",
    footerNote: `You have Premium <b>access</b> & more`,
  });
  assert.ok(html.includes("You have Premium &lt;b&gt;access&lt;/b&gt; &amp; more"));
  assert.ok(!html.includes("you're a SentenceStep admin"));
  assert.ok(!html.includes("Manage email preferences"));
});
