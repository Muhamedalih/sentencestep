#!/usr/bin/env bash
# Zero-downtime deploy, run ON THE SERVER by CI (through ci-entry.sh) or by hand:
#
#   docker save sentencestep:<sha> | gzip | ssh deploy@server "deploy <sha>"
#
# Reads the gzipped image tarball on stdin. Steps, any failure of which leaves the
# currently live copy untouched and exits non-zero:
#   1. load the image;
#   2. start it in the IDLE slot (blue/green) next to the live one;
#   3. wait until that copy reports healthy, and confirm it reports the expected commit;
#   4. point Caddy at it (graceful reload — in-flight requests finish normally);
#   5. ask the site, through Caddy, for the same commit and a 200 home page;
#      if that fails, point Caddy straight back at the old slot.
# The old slot keeps running afterwards, so rollback.sh is instant until the next deploy.
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/sentencestep}"
cd "$APP_DIR"
# shellcheck source=lib.sh
. "$APP_DIR/lib.sh"

SHA="${1:-}"
[[ "$SHA" =~ ^[0-9a-f]{40}$ ]] || die "usage: deploy.sh <40-character git commit sha>   (image tarball on stdin)"

exec 9>"$APP_DIR/.deploy.lock"
flock -n 9 || die "another deploy is already running"

log "loading image for $SHA"
gunzip -c | docker load >/dev/null
docker image inspect "sentencestep:$SHA" >/dev/null 2>&1 || die "image sentencestep:$SHA was not in the upload"

load_state
OLD="$ACTIVE"
NEW="$(other_slot "$OLD")"
PREVIOUS_IMAGE_NEW="$(if [ "$NEW" = blue ]; then echo "$APP_IMAGE_BLUE"; else echo "$APP_IMAGE_GREEN"; fi)"
PREVIOUS_SHA_NEW="$(slot_sha "$NEW")"

log "live slot: $OLD ($(slot_sha "$OLD")); starting $NEW with $SHA"
set_slot "$NEW" "sentencestep:$SHA" "$SHA"
save_state
compose up -d --no-deps --force-recreate "app-$NEW" >/dev/null

if ! wait_healthy "$NEW" 120; then
  docker logs --tail 60 "$(container_of "$NEW")" >&2 || true
  compose stop "app-$NEW" >/dev/null 2>&1 || true
  set_slot "$NEW" "$PREVIOUS_IMAGE_NEW" "$PREVIOUS_SHA_NEW"; save_state
  die "new copy never became healthy — nothing changed, $OLD is still live"
fi

REPORTED="$(slot_commit "$NEW" || true)"
if [ "$REPORTED" != "$SHA" ]; then
  compose stop "app-$NEW" >/dev/null 2>&1 || true
  set_slot "$NEW" "$PREVIOUS_IMAGE_NEW" "$PREVIOUS_SHA_NEW"; save_state
  die "new copy reports commit '$REPORTED', expected $SHA — nothing changed, $OLD is still live"
fi

log "switching traffic to $NEW"
write_upstream "$NEW"
if ! caddy_reload; then
  write_upstream "$OLD"; caddy_reload || true
  die "Caddy rejected the new configuration — reverted to $OLD"
fi

if ! probe_through_caddy "$SHA"; then
  log "the live site did not answer correctly through Caddy — switching back"
  write_upstream "$OLD"; caddy_reload || true
  die "post-switch check failed — traffic is back on $OLD"
fi

ACTIVE="$NEW"
save_state
printf '%s deploy %s slot=%s previous=%s(%s)\n' "$(date -u +%FT%TZ)" "$SHA" "$NEW" "$OLD" "$(slot_sha "$OLD")" >>"$APP_DIR/releases.log"

docker image prune -f --filter "until=168h" >/dev/null 2>&1 || true
log "done — $SHA is live in slot $NEW; slot $OLD ($(slot_sha "$OLD")) is kept running for instant rollback"
