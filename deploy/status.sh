#!/usr/bin/env bash
# What is running right now: which slot is live, what each slot runs, their health,
# the last few releases and the machine's memory/disk. Read-only.
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/sentencestep}"
cd "$APP_DIR"
# shellcheck source=lib.sh
. "$APP_DIR/lib.sh"

load_state
echo "live slot : $ACTIVE"
for slot in blue green; do
  printf '%-10s: commit %s, container %s\n' "$slot" "$(slot_sha "$slot")" "$(slot_health "$slot")"
done
echo
echo "last releases:"
tail -n 6 "$APP_DIR/releases.log" 2>/dev/null || echo "  (none yet)"
echo
echo "containers:"
docker ps --format '  {{.Names}}  {{.Status}}'
echo
free -h | sed 's/^/  /'
df -h / | sed 's/^/  /'
