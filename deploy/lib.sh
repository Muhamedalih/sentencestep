#!/usr/bin/env bash
# Shared helpers for deploy.sh / rollback.sh / status.sh. Sourced, never run directly.
# shellcheck shell=bash

APP_DIR="${APP_DIR:-/opt/sentencestep}"
STATE_FILE="$APP_DIR/state.env"
UPSTREAM_FILE="$APP_DIR/active-upstream.caddy"
UPSTREAM_TEMPLATE="$APP_DIR/active-upstream.caddy.example"

log() { printf '%s %s\n' "$(date -u +%H:%M:%S)" "$*" >&2; }
die() { log "ERROR: $*"; exit 1; }

compose() { docker compose --project-directory "$APP_DIR" -f "$APP_DIR/docker-compose.yml" --env-file "$STATE_FILE" "$@"; }

other_slot() { [ "$1" = blue ] && echo green || echo blue; }
container_of() { echo "sentencestep-app-$1-1"; }

# --- state: which slot is live, and what each slot runs -----------------------
load_state() {
  [ -f "$STATE_FILE" ] || cat >"$STATE_FILE" <<'EOF'
ACTIVE=blue
APP_IMAGE_BLUE=sentencestep:none
SHA_BLUE=unknown
APP_IMAGE_GREEN=sentencestep:none
SHA_GREEN=unknown
EOF
  # shellcheck disable=SC1090
  . "$STATE_FILE"
}

save_state() {
  local tmp="$STATE_FILE.tmp"
  cat >"$tmp" <<EOF
ACTIVE=$ACTIVE
APP_IMAGE_BLUE=$APP_IMAGE_BLUE
SHA_BLUE=$SHA_BLUE
APP_IMAGE_GREEN=$APP_IMAGE_GREEN
SHA_GREEN=$SHA_GREEN
EOF
  mv "$tmp" "$STATE_FILE"
}

set_slot() { # set_slot <slot> <image> <sha>
  if [ "$1" = blue ]; then APP_IMAGE_BLUE="$2"; SHA_BLUE="$3"; else APP_IMAGE_GREEN="$2"; SHA_GREEN="$3"; fi
}
slot_sha() { [ "$1" = blue ] && echo "$SHA_BLUE" || echo "$SHA_GREEN"; }

# --- health -----------------------------------------------------------------------
slot_health() { docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$(container_of "$1")" 2>/dev/null || echo missing; }

wait_healthy() { # wait_healthy <slot> <seconds>
  local slot="$1" deadline=$((SECONDS + $2)) status
  while [ "$SECONDS" -lt "$deadline" ]; do
    status="$(slot_health "$slot")"
    [ "$status" = healthy ] && return 0
    sleep 2
  done
  return 1
}

slot_commit() { # the commit the running copy reports for itself
  docker exec "$(container_of "$1")" node -e \
    "fetch('http://127.0.0.1:3000/api/health').then(r=>r.json()).then(j=>console.log(j.commit)).catch(()=>process.exit(1))" 2>/dev/null
}

# --- caddy --------------------------------------------------------------------------
write_upstream() { # point Caddy at <slot>
  sed "s/app-blue/app-$1/" "$UPSTREAM_TEMPLATE" >"$UPSTREAM_FILE.tmp"
  mv "$UPSTREAM_FILE.tmp" "$UPSTREAM_FILE"
}

caddy_reload() {
  compose exec -T caddy caddy validate --config /etc/caddy/Caddyfile >/dev/null 2>&1 || return 1
  compose exec -T caddy caddy reload --config /etc/caddy/Caddyfile >/dev/null 2>&1
}

# Ask the live site, through Caddy, the same way Cloudflare does, and require the
# expected commit. Up to ~20 s of retries, because a reload takes a moment.
probe_through_caddy() { # probe_through_caddy <expected sha>
  local expected="$1" i body code
  for i in $(seq 1 10); do
    body="$(curl -fsS --max-time 5 -k --resolve sentencestep.com:443:127.0.0.1 https://sentencestep.com/api/health 2>/dev/null || true)"
    if [ "$(printf '%s' "$body" | jq -r '.commit // empty' 2>/dev/null)" = "$expected" ]; then
      code="$(curl -sS --max-time 15 -k -o /dev/null -w '%{http_code}' --resolve sentencestep.com:443:127.0.0.1 https://sentencestep.com/ 2>/dev/null || echo 000)"
      [ "$code" = 200 ] && return 0
    fi
    sleep 2
  done
  return 1
}
