#!/usr/bin/env python3
"""Looma Binance Pay relay: reads the shop's Binance Pay history and hands incoming transfers to the site.

Why this exists. The site runs on a server in the US, and Binance refuses requests from the US (HTTP 451),
so the site cannot read the shop's Binance account itself. This small program runs on a server outside the
US (Frankfurt), asks the site whether to look ("is anyone waiting to pay?"), reads the Pay history with a
READ-ONLY, IP-restricted API key, and posts the incoming transfers back. The site decides what each
transfer means (src/lib/billing/binance/matching.ts); this program only carries facts. It opens no port:
every connection goes out.

Talks to:   GET  {SITE_URL}/api/payments/binance/pending   (should I look now, and since when?)
            POST {SITE_URL}/api/payments/binance/ingest    (the incoming transfers it found)
            GET  https://api.binance.com/sapi/v1/pay/transactions
Every request to the site is signed with BINANCE_RELAY_SECRET exactly the way
src/lib/billing/binance/relay-auth.ts expects: HMAC-SHA256 over
"{timestamp_ms}\\n{METHOD}\\n{path}\\n{sha256(body)}".

Settings come from the environment (systemd's EnvironmentFile) or, run by hand, from RELAY_ENV
(default /etc/looma-relay/relay.env): BINANCE_API_KEY, BINANCE_API_SECRET, BINANCE_RELAY_SECRET,
and optionally SITE_URL (default https://sentencestep.com). Nothing secret is ever printed.

Usage:  poller.py            run forever (what the service does)
        poller.py --once     one cycle, then exit (prints what happened)
        poller.py --once --no-post   like --once but posts nothing to the site's ingest
"""
import hashlib
import hmac
import json
import os
import signal
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

PENDING_PATH = "/api/payments/binance/pending"
INGEST_PATH = "/api/payments/binance/ingest"
BINANCE_BASE = "https://api.binance.com"
USER_AGENT = "looma-relay/1.0 (+https://sentencestep.com)"

# One Binance call may cover at most 90 days; stay safely under it.
MAX_WINDOW_MS = 85 * 24 * 3600 * 1000
# A full page (100) may have more behind it, so the window is split until no page is full.
PAGE_SIZE = 100
MIN_SPLIT_MS = 60 * 1000
HTTP_TIMEOUT = 25
DEFAULT_INTERVAL = 60
MAX_BACKOFF = 300

running = True


def log(message):
    print(time.strftime("%Y-%m-%d %H:%M:%S", time.gmtime()), message, flush=True)


def load_settings():
    env = dict(os.environ)
    path = os.environ.get("RELAY_ENV", "/etc/looma-relay/relay.env")
    if not env.get("BINANCE_API_KEY") and os.path.exists(path):
        with open(path, encoding="utf-8") as handle:
            for raw in handle:
                line = raw.strip()
                if line and not line.startswith("#") and "=" in line:
                    name, value = line.split("=", 1)
                    env.setdefault(name.strip(), value.strip().strip('"').strip("'"))
    settings = {
        "api_key": env.get("BINANCE_API_KEY", ""),
        "api_secret": env.get("BINANCE_API_SECRET", ""),
        "relay_secret": env.get("BINANCE_RELAY_SECRET", ""),
        "site_url": env.get("SITE_URL", "https://sentencestep.com").rstrip("/"),
    }
    missing = [name for name in ("api_key", "api_secret", "relay_secret") if not settings[name]]
    if missing:
        sys.exit("missing settings: " + ", ".join(missing))
    if len(settings["relay_secret"]) < 32:
        sys.exit("BINANCE_RELAY_SECRET is too short (the site refuses anything under 32 characters)")
    return settings


class BinanceError(Exception):
    """Binance could not be read; the message is short and safe to show an admin."""

    def __init__(self, message, retry_after=None):
        super().__init__(message)
        self.retry_after = retry_after


class SiteError(Exception):
    """The site did not accept a request."""


def sign_for_site(secret, timestamp_ms, method, path, body):
    body_hash = hashlib.sha256(body).hexdigest()
    signed = "%d\n%s\n%s\n%s" % (timestamp_ms, method.upper(), path, body_hash)
    return hmac.new(secret.encode(), signed.encode(), hashlib.sha256).hexdigest()


def site_request(settings, method, path, payload=None):
    body = b"" if payload is None else json.dumps(payload, separators=(",", ":")).encode()
    timestamp = int(time.time() * 1000)
    request = urllib.request.Request(
        settings["site_url"] + path,
        data=body if method == "POST" else None,
        method=method,
        headers={
            "x-relay-timestamp": str(timestamp),
            "x-relay-signature": sign_for_site(settings["relay_secret"], timestamp, method, path, body),
            "User-Agent": USER_AGENT,
            "Accept": "application/json",
            **({"Content-Type": "application/json"} if method == "POST" else {}),
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=HTTP_TIMEOUT) as response:
            return json.loads(response.read() or b"{}")
    except urllib.error.HTTPError as error:
        raise SiteError("%s %s answered %d" % (method, path, error.code)) from None
    except (urllib.error.URLError, TimeoutError, OSError) as error:
        raise SiteError("%s %s failed: %s" % (method, path, getattr(error, "reason", error))) from None


def binance_pay_history(settings, start_ms, end_ms):
    params = {
        "startTime": str(start_ms),
        "endTime": str(end_ms),
        "limit": str(PAGE_SIZE),
        "timestamp": str(int(time.time() * 1000)),
        "recvWindow": "10000",
    }
    query = urllib.parse.urlencode(params)
    signature = hmac.new(settings["api_secret"].encode(), query.encode(), hashlib.sha256).hexdigest()
    request = urllib.request.Request(
        "%s/sapi/v1/pay/transactions?%s&signature=%s" % (BINANCE_BASE, query, signature),
        headers={"X-MBX-APIKEY": settings["api_key"], "User-Agent": USER_AGENT},
    )
    try:
        with urllib.request.urlopen(request, timeout=HTTP_TIMEOUT) as response:
            body = json.loads(response.read())
    except urllib.error.HTTPError as error:
        retry_after = error.headers.get("Retry-After")
        detail = ""
        try:
            parsed = json.loads(error.read())
            detail = " (code %s)" % parsed.get("code") if isinstance(parsed, dict) else ""
        except ValueError:
            pass
        if error.code == 451:
            raise BinanceError("Binance refuses this server's location (451)") from None
        if error.code in (418, 429):
            raise BinanceError(
                "Binance is rate-limiting this server (%d)" % error.code,
                retry_after=int(retry_after) if retry_after and retry_after.isdigit() else 120,
            ) from None
        raise BinanceError("Binance answered %d%s" % (error.code, detail)) from None
    except (urllib.error.URLError, TimeoutError, OSError) as error:
        raise BinanceError("Binance could not be reached: %s" % getattr(error, "reason", error)) from None

    if not isinstance(body, dict) or body.get("success") is not True:
        raise BinanceError("Binance returned an unexpected answer")
    rows = body.get("data")
    return rows if isinstance(rows, list) else []


def history_window(settings, start_ms, end_ms, depth=0):
    """One window of history; a full page is split in two so nothing is cut off."""
    rows = binance_pay_history(settings, start_ms, end_ms)
    time.sleep(1.0)  # Pay history is a heavy call: never hammer it
    if len(rows) >= PAGE_SIZE and end_ms - start_ms > MIN_SPLIT_MS and depth < 8:
        middle = (start_ms + end_ms) // 2
        return history_window(settings, start_ms, middle, depth + 1) + history_window(
            settings, middle + 1, end_ms, depth + 1
        )
    return rows


def incoming_since(settings, since_ms):
    """Every incoming (positive) transfer since the given time. What the shop sent out never leaves this server."""
    now_ms = int(time.time() * 1000)
    rows, cursor = [], max(0, since_ms)
    while cursor < now_ms:
        rows += history_window(settings, cursor, min(cursor + MAX_WINDOW_MS, now_ms))
        cursor += MAX_WINDOW_MS + 1

    incoming = []
    for row in rows:
        try:
            if float(row.get("amount", "0")) > 0:
                incoming.append(row)
        except (TypeError, ValueError):
            continue
    return incoming


def cycle(settings, post=True):
    """One round: ask the site, and if it says so, read Binance and report. Returns the seconds to wait."""
    plan = site_request(settings, "GET", PENDING_PATH)
    interval = int(plan.get("intervalSeconds") or DEFAULT_INTERVAL)
    if not plan.get("watch"):
        log("pending: nothing to look for (next ask in %ds)" % interval)
        return interval

    try:
        rows = incoming_since(settings, int(plan["sinceMs"]))
    except BinanceError as error:
        log("binance: " + str(error))
        if post:
            # Tell the site, so the admin page and the health check can show it.
            try:
                site_request(settings, "POST", INGEST_PATH, {"records": [], "error": str(error)[:200]})
            except SiteError as site_error:
                log("could not report the error to the site: %s" % site_error)
        return max(interval, error.retry_after or 0)

    if not post:
        log("pending: watch=true, found %d incoming transfer(s); posting skipped (--no-post)" % len(rows))
        return interval

    result = site_request(settings, "POST", INGEST_PATH, {"records": rows})
    log(
        "ingest: sent=%d received=%s inserted=%s linked=%s fulfilled=%s"
        % (
            len(rows),
            result.get("received"),
            result.get("inserted"),
            result.get("linked"),
            result.get("fulfilled"),
        )
    )
    return interval


def stop(_signal, _frame):
    global running
    running = False


def main():
    settings = load_settings()
    once = "--once" in sys.argv
    post = "--no-post" not in sys.argv

    if once:
        wait = cycle(settings, post=post)
        log("done (the service would wait %ds)" % wait)
        return

    signal.signal(signal.SIGTERM, stop)
    signal.signal(signal.SIGINT, stop)
    log("relay started, site %s" % settings["site_url"])

    failures = 0
    while running:
        try:
            wait = cycle(settings)
            failures = 0
        except SiteError as error:
            # The site may be restarting during a deploy: back off a little, never give up.
            failures += 1
            wait = min(MAX_BACKOFF, 5 * 2 ** min(failures, 6))
            log("site: %s (retrying in %ds)" % (error, wait))
        except Exception as error:  # a bug must never stop the relay for good
            failures += 1
            wait = min(MAX_BACKOFF, 5 * 2 ** min(failures, 6))
            log("unexpected: %s: %s (retrying in %ds)" % (type(error).__name__, error, wait))
        slept = 0.0
        while running and slept < wait:
            time.sleep(1)
            slept += 1
    log("relay stopped")


if __name__ == "__main__":
    main()
