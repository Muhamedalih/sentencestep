#!/usr/bin/env bash
# Checks that a deployed copy of the site is healthy and correct. Read-only: it only
# makes ordinary GET requests, so it is safe against production too.
#
#   deploy/smoke-test.sh https://staging.sentencestep.com [expected-commit-sha]
#
# If the target sits behind Cloudflare Access, export CF_ACCESS_CLIENT_ID and
# CF_ACCESS_CLIENT_SECRET (a service token) and they are sent with every request.
# Exit status 0 = everything passed, 1 = at least one check failed.
set -uo pipefail

BASE="${1:-}"
EXPECTED_SHA="${2:-}"
[ -n "$BASE" ] || { echo "usage: $0 <base url> [expected commit sha]" >&2; exit 2; }
BASE="${BASE%/}"

CURL=(curl -sS --max-time 30)
if [ -n "${CF_ACCESS_CLIENT_ID:-}" ] && [ -n "${CF_ACCESS_CLIENT_SECRET:-}" ]; then
  CURL+=(-H "CF-Access-Client-Id: $CF_ACCESS_CLIENT_ID" -H "CF-Access-Client-Secret: $CF_ACCESS_CLIENT_SECRET")
fi

FAILURES=0
pass() { printf '  \033[32mPASS\033[0m  %s\n' "$1"; }
fail() { printf '  \033[31mFAIL\033[0m  %s\n' "$1"; FAILURES=$((FAILURES + 1)); }

status_of() { "${CURL[@]}" -o /dev/null -w '%{http_code}' "$1" 2>/dev/null || echo 000; }

echo "Smoke test: $BASE"

# 1. liveness, and the right build
HEALTH="$("${CURL[@]}" "$BASE/api/health" 2>/dev/null || true)"
if [ "$(printf '%s' "$HEALTH" | jq -r '.status // empty' 2>/dev/null)" = ok ]; then
  pass "/api/health answers ok"
else
  fail "/api/health did not answer ok (got: ${HEALTH:0:120})"
fi
if [ -n "$EXPECTED_SHA" ]; then
  GOT="$(printf '%s' "$HEALTH" | jq -r '.commit // empty' 2>/dev/null)"
  [ "$GOT" = "$EXPECTED_SHA" ] && pass "serving commit ${EXPECTED_SHA:0:8}" || fail "serving commit '${GOT:0:8}', expected ${EXPECTED_SHA:0:8}"
fi

# 2. pages
for path in / /privacy /terms /robots.txt /login /register /upgrade /learn /api/reviews; do
  code="$(status_of "$BASE$path")"
  [ "$code" = 200 ] && pass "GET $path -> 200" || fail "GET $path -> $code"
done

# 3. a locale page and the unprefixed home must both render
for path in /ar /es /tr; do
  code="$(status_of "$BASE$path")"
  [ "$code" = 200 ] && pass "GET $path -> 200" || fail "GET $path -> $code"
done

# 4. admin must NOT be open to the public (redirect to login or 401/403, never 200)
code="$(status_of "$BASE/admin")"
case "$code" in 301|302|303|307|308|401|403) pass "GET /admin is gated ($code)";; *) fail "GET /admin answered $code — it must be gated";; esac

# 5. a real static asset is served with long-lived caching
HOME_HTML="$("${CURL[@]}" "$BASE/" 2>/dev/null || true)"
ASSET="$(printf '%s' "$HOME_HTML" | grep -oE '/_next/static/[A-Za-z0-9_./%-]+\.js' | head -n 1)"
if [ -n "$ASSET" ]; then
  HEADERS="$("${CURL[@]}" -D - -o /dev/null "$BASE$ASSET" 2>/dev/null || true)"
  printf '%s' "$HEADERS" | head -n 1 | grep -q ' 200' && pass "static asset $ASSET -> 200" || fail "static asset $ASSET did not return 200"
  printf '%s' "$HEADERS" | grep -qi 'cache-control:.*immutable' && pass "static asset is cached as immutable" || fail "static asset is not cached as immutable"
else
  fail "no /_next/static asset found in the home page"
fi

# 6. security headers on the home page
HOME_HEADERS="$("${CURL[@]}" -D - -o /dev/null "$BASE/" 2>/dev/null || true)"
for header in strict-transport-security x-frame-options x-content-type-options content-security-policy referrer-policy permissions-policy; do
  printf '%s' "$HOME_HEADERS" | grep -qi "^$header:" && pass "header $header present" || fail "header $header missing"
done

# 7. the image optimizer works (needs sharp on a Node server) — optional: only if a
#    next/image URL is present in the page
IMG="$(printf '%s' "$HOME_HTML" | grep -oE '/_next/image\?[^"&]*&amp;w=[0-9]+&amp;q=[0-9]+' | head -n 1 | sed 's/&amp;/\&/g')"
if [ -n "$IMG" ]; then
  code="$(status_of "$BASE$IMG")"
  [ "$code" = 200 ] && pass "image optimizer -> 200" || fail "image optimizer $IMG -> $code"
fi

echo
if [ "$FAILURES" -eq 0 ]; then
  echo "All checks passed."
  exit 0
fi
echo "$FAILURES check(s) FAILED."
exit 1
