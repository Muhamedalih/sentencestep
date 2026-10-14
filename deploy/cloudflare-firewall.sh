#!/usr/bin/env bash
# Lets only Cloudflare open connections to this server's web ports (80 and 443).
#
# Why: the site is meant to be reached THROUGH Cloudflare (DDoS protection, caching, the
# secret header stamp the app trusts). Anyone who learns the server's address could
# otherwise talk to it directly and skip all of that. Docker publishes ports by writing
# its own iptables rules, which bypass the server's normal firewall (ufw), so the rule has
# to live in Docker's DOCKER-USER chain, which Docker consults first and never rewrites.
#
# Run as root by sentencestep-firewall.service (at boot, after Docker starts) and by
# sentencestep-firewall.timer (daily, to follow Cloudflare's published address list).
# Installed to /usr/local/sbin/sentencestep-firewall owned by root: it is deliberately NOT
# one of the files `sync` updates, because a script that root runs must not be replaceable
# by the deploy user.
#
# Safe by design:
#  - fails OPEN: if Cloudflare's list cannot be fetched and there is no earlier copy, no
#    rule is installed (the site stays reachable; the app does not rely on this firewall
#    for trust, it is a second layer);
#  - never swaps in a suspicious list (fewer than 5 networks);
#  - idempotent: running it twice leaves exactly one rule;
#  - SSH (22) is never touched: DOCKER-USER only sees traffic going to containers.
#
#   sentencestep-firewall            install / refresh
#   sentencestep-firewall --remove   take the rule away again
set -euo pipefail

PORTS="80,443"
SET="cloudflare4"
CHAIN="DOCKER-USER"
URL="https://www.cloudflare.com/ips-v4"
STATE_DIR="/var/lib/sentencestep"
CACHE="$STATE_DIR/cloudflare-ips-v4.txt"
CIDR_RE='^([0-9]{1,3}\.){3}[0-9]{1,3}/[0-9]{1,2}$'

log() { logger -t sentencestep-firewall "$*"; echo "$*"; }

rule_spec=(-p tcp -m multiport --dports "$PORTS" -m set ! --match-set "$SET" src -j DROP)
rule_exists() { iptables -C "$CHAIN" "${rule_spec[@]}" 2>/dev/null; }
remove_rule() { while rule_exists; do iptables -D "$CHAIN" "${rule_spec[@]}"; done; }

if [ "${1:-}" = "--remove" ]; then
  remove_rule
  log "removed the Cloudflare-only rule for ports $PORTS"
  exit 0
fi

mkdir -p "$STATE_DIR"

# 1. the list: fresh from Cloudflare, else the last good copy
fresh="$(mktemp)"
trap 'rm -f "$fresh"' EXIT
if curl -fsS --max-time 30 --retry 3 --retry-delay 3 "$URL" 2>/dev/null | grep -E "$CIDR_RE" >"$fresh" && [ "$(wc -l <"$fresh")" -ge 5 ]; then
  install -m 644 "$fresh" "$CACHE"
  source_of_list="Cloudflare ($(wc -l <"$fresh") networks)"
elif [ -s "$CACHE" ] && [ "$(wc -l <"$CACHE")" -ge 5 ]; then
  cp "$CACHE" "$fresh"
  source_of_list="the saved copy (Cloudflare's list could not be fetched)"
else
  log "no usable list of Cloudflare addresses and no saved copy - leaving the ports open"
  exit 1
fi

# 2. load it into an ipset (built aside, then swapped in atomically, so there is never a
#    moment when the set is half-filled)
tmp_set="${SET}_new"
ipset create "$SET" hash:net family inet -exist
ipset create "$tmp_set" hash:net family inet -exist
ipset flush "$tmp_set"
while read -r net; do ipset add "$tmp_set" "$net" -exist; done <"$fresh"
ipset swap "$tmp_set" "$SET"
ipset destroy "$tmp_set"

# 3. the rule: drop web-port connections that do not come from the set. Inserted first, so
#    nothing earlier in the chain can accept the packet before this sees it.
remove_rule
iptables -I "$CHAIN" 1 "${rule_spec[@]}"
log "only Cloudflare may reach ports $PORTS now (list from $source_of_list)"
