import { test } from "node:test";
import assert from "node:assert/strict";

import { authPageHref, safeNextPath } from "./safe-redirect";

test("safeNextPath: a real same-origin path is passed through unchanged", () => {
  assert.equal(safeNextPath("/learn/normal/normal-3"), "/learn/normal/normal-3");
});

test("safeNextPath: null, missing, or non-string input falls back to /learn", () => {
  assert.equal(safeNextPath(null), "/learn");
  assert.equal(safeNextPath(""), "/learn");
});

test("safeNextPath: a path with no leading slash falls back to /learn", () => {
  assert.equal(safeNextPath("evil.com"), "/learn");
  assert.equal(safeNextPath("learn/settings"), "/learn");
});

test("safeNextPath: an absolute URL to another origin falls back to /learn", () => {
  assert.equal(safeNextPath("https://evil.com"), "/learn");
  assert.equal(safeNextPath("http://evil.com/phish"), "/learn");
});

test("safeNextPath: a protocol-relative URL (//evil.com) falls back to /learn", () => {
  assert.equal(safeNextPath("//evil.com"), "/learn");
  assert.equal(safeNextPath("///evil.com"), "/learn");
});

test("safeNextPath: the backslash bypass (/\\evil.com) falls back to /learn", () => {
  // Per the WHATWG URL Standard, a browser treats a backslash exactly like a
  // forward slash inside an http(s) URL, so "/\evil.com" resolves to the
  // external origin "https://evil.com" just as "//evil.com" does — a guard
  // that only rejects a literal "//" prefix misses this entirely.
  assert.equal(safeNextPath("/\\evil.com"), "/learn");
  assert.equal(safeNextPath("/\\/evil.com"), "/learn");
});

test("safeNextPath: query strings and fragments on a real relative path are preserved", () => {
  assert.equal(safeNextPath("/learn?tab=stories"), "/learn?tab=stories");
  assert.equal(safeNextPath("/learn#top"), "/learn#top");
});

test("authPageHref: the default destination keeps the plain address", () => {
  assert.equal(authPageHref("/login", undefined), "/login");
  assert.equal(authPageHref("/register", null), "/register");
  assert.equal(authPageHref("/register", "/learn"), "/register");
  assert.equal(authPageHref("/login", ""), "/login");
});

test("authPageHref: another same-origin destination is carried, encoded, to either page", () => {
  assert.equal(authPageHref("/register", "/upgrade"), "/register?next=%2Fupgrade");
  assert.equal(
    authPageHref("/login", "/upgrade?next=%2Flearn%2Fnormal%2Fnormal-7"),
    "/login?next=%2Fupgrade%3Fnext%3D%252Flearn%252Fnormal%252Fnormal-7",
  );
});

test("authPageHref: an unsafe destination is dropped, never carried", () => {
  for (const bad of ["https://evil.com", "//evil.com", "/\\evil.com", "evil.com"]) {
    assert.equal(authPageHref("/register", bad), "/register", bad);
  }
});

test("authPageHref: what it builds survives a trip through the page's own query parsing", () => {
  const href = authPageHref("/login", "/upgrade?next=%2Flearn%2Fnormal%2Fnormal-7");
  const next = new URL(href, "https://sentencestep.com").searchParams.get("next");
  assert.equal(next, "/upgrade?next=%2Flearn%2Fnormal%2Fnormal-7");
  assert.equal(safeNextPath(next), next);
  const inner = new URL(String(next), "https://sentencestep.com").searchParams.get("next");
  assert.equal(inner, "/learn/normal/normal-7");
});
