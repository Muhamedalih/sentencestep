// Run with `npm run test:auth`.

import { test } from "node:test";
import assert from "node:assert/strict";

import { getRequestOrigin, isFromThisSite } from "./request-origin";

function req(url: string, headers: Record<string, string> = {}): Request {
  return new Request(url, { headers });
}

test("getRequestOrigin: behind the proxy the visitor's own host and scheme win over the bind address", () => {
  const request = req("http://0.0.0.0:3000/auth/callback?code=abc", {
    "x-forwarded-host": "sentencestep.com",
    "x-forwarded-proto": "https",
    host: "sentencestep.com",
  });
  assert.equal(getRequestOrigin(request), "https://sentencestep.com");
});

test("getRequestOrigin: the Host header is enough when no forwarded host is sent", () => {
  const request = req("http://0.0.0.0:3000/auth/callback", {
    host: "staging.sentencestep.com",
    "x-forwarded-proto": "https",
  });
  assert.equal(getRequestOrigin(request), "https://staging.sentencestep.com");
});

test("getRequestOrigin: only the first value of a forwarding chain is used", () => {
  const request = req("http://0.0.0.0:3000/x", {
    "x-forwarded-host": "sentencestep.com, 10.0.0.2:3000",
    "x-forwarded-proto": "https, http",
  });
  assert.equal(getRequestOrigin(request), "https://sentencestep.com");
});

test("getRequestOrigin: local development keeps its own http origin", () => {
  const request = req("http://localhost:3000/auth/callback", { host: "localhost:3000" });
  assert.equal(getRequestOrigin(request), "http://localhost:3000");
});

test("getRequestOrigin: a bind address with no usable host header falls back to the site origin", () => {
  const original = process.env.NEXT_PUBLIC_SITE_URL;
  process.env.NEXT_PUBLIC_SITE_URL = "https://sentencestep.com";
  try {
    assert.equal(getRequestOrigin(req("http://0.0.0.0:3000/x")), "https://sentencestep.com");
    assert.equal(
      getRequestOrigin(req("http://0.0.0.0:3000/x", { host: "0.0.0.0:3000" })),
      "https://sentencestep.com",
    );
  } finally {
    if (original === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = original;
  }
});

test("getRequestOrigin: a malformed forwarded host never produces a broken origin", () => {
  const request = req("http://localhost:3000/x", { "x-forwarded-host": "bad host with spaces" });
  assert.equal(getRequestOrigin(request), "http://localhost:3000");
});

test("getRequestOrigin: an unknown forwarded scheme is ignored in favour of the request's own", () => {
  const request = req("http://localhost:3000/x", {
    "x-forwarded-host": "localhost:3000",
    "x-forwarded-proto": "javascript",
  });
  assert.equal(getRequestOrigin(request), "http://localhost:3000");
});

test("isFromThisSite: a tap on a link inside the app carries the site's own address", () => {
  const headers = new Headers({
    referer: "https://sentencestep.com/learn/normal",
    "x-forwarded-host": "sentencestep.com",
  });
  assert.equal(isFromThisSite(headers), true);
  assert.equal(
    isFromThisSite(new Headers({ referer: "http://localhost:3000/learn", host: "localhost:3000" })),
    true,
  );
});

test("isFromThisSite: another site, no referer and a malformed referer are all not from here", () => {
  const host = { "x-forwarded-host": "sentencestep.com" };
  assert.equal(
    isFromThisSite(new Headers({ ...host, referer: "https://accounts.google.com/" })),
    false,
  );
  assert.equal(isFromThisSite(new Headers({ ...host, referer: "https://www.google.com/" })), false);
  assert.equal(isFromThisSite(new Headers(host)), false);
  assert.equal(isFromThisSite(new Headers({ ...host, referer: "not a url" })), false);
  assert.equal(isFromThisSite(new Headers({ referer: "https://sentencestep.com/learn" })), false);
});

test("isFromThisSite: a look-alike host is not this site", () => {
  const headers = new Headers({
    referer: "https://sentencestep.com.evil.example/learn",
    "x-forwarded-host": "sentencestep.com",
  });
  assert.equal(isFromThisSite(headers), false);
});
