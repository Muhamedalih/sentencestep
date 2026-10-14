#!/usr/bin/env bash
# Instant rollback: point traffic back at the other slot — the copy that was live
# before the last deploy, still running untouched. No build, no image load.
# Works until the next deploy recreates that slot.
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/sentencestep}"
cd "$APP_DIR"
# shellcheck source=lib.sh
. "$APP_DIR/lib.sh"

exec 9>"$APP_DIR/.deploy.lock"
flock -n 9 || die "a deploy is running right now — wait for it to finish"

load_state
CURRENT="$ACTIVE"
TARGET="$(other_slot "$CURRENT")"
TARGET_SHA="$(slot_sha "$TARGET")"

[ "$TARGET_SHA" != unknown ] || die "slot $TARGET has never run a release — there is nothing to roll back to"
[ "$(slot_health "$TARGET")" = healthy ] || die "slot $TARGET ($TARGET_SHA) is not running healthy; redeploy that commit instead"

log "rolling back: $CURRENT ($(slot_sha "$CURRENT")) -> $TARGET ($TARGET_SHA)"
write_upstream "$TARGET"
if ! caddy_reload; then
  write_upstream "$CURRENT"; caddy_reload || true
  die "Caddy rejected the configuration — still on $CURRENT"
fi
if ! probe_through_caddy "$TARGET_SHA"; then
  write_upstream "$CURRENT"; caddy_reload || true
  die "slot $TARGET did not answer correctly — switched back to $CURRENT"
fi

ACTIVE="$TARGET"
save_state
printf '%s rollback to %s slot=%s from=%s(%s)\n' "$(date -u +%FT%TZ)" "$TARGET_SHA" "$TARGET" "$CURRENT" "$(slot_sha "$CURRENT")" >>"$APP_DIR/releases.log"
log "done — $TARGET_SHA is live again in slot $TARGET"
