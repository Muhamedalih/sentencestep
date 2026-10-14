#!/usr/bin/env bash
# Restarts an app container that Docker reports as "unhealthy" for several checks in a
# row. Docker itself only MARKS a failing container unhealthy; it never restarts it, so a
# Node process that hangs (rather than crashes) would otherwise stay down until someone
# notices. Caddy already stops sending visitors to it meanwhile (its own health check).
#
# Run every 30 seconds by sentencestep-watchdog.timer (deploy/systemd/). Safe by design:
#  - only a container whose state is "running" AND health is "unhealthy" is touched, so a
#    copy that is still starting up ("starting") or was stopped on purpose is left alone;
#  - it needs THRESHOLD consecutive unhealthy checks (default 3, about 90 seconds on top of
#    Docker's own ~30 seconds), so a short blip does not cause a restart;
#  - it takes the deploy lock, so it never races deploy.sh / rollback.sh.
set -uo pipefail

APP_DIR="${APP_DIR:-/opt/sentencestep}"
STATE_DIR="${STATE_DIR:-/run/sentencestep-watchdog}"
THRESHOLD="${THRESHOLD:-3}"

mkdir -p "$STATE_DIR"

for slot in blue green; do
  name="sentencestep-app-$slot-1"
  state_file="$STATE_DIR/$slot"
  status="$(docker inspect --format '{{.State.Status}} {{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$name" 2>/dev/null || echo 'missing none')"

  if [ "$status" != "running unhealthy" ]; then
    rm -f "$state_file"
    continue
  fi

  count=$(( $(cat "$state_file" 2>/dev/null || echo 0) + 1 ))
  echo "$count" >"$state_file"
  [ "$count" -ge "$THRESHOLD" ] || continue

  if flock -n "$APP_DIR/.deploy.lock" docker restart "$name" >/dev/null 2>&1; then
    logger -t sentencestep-watchdog "restarted $name after $count unhealthy checks in a row"
    rm -f "$state_file"
  else
    logger -t sentencestep-watchdog "$name is unhealthy ($count checks) but a deploy holds the lock or the restart failed; will retry"
  fi
done
