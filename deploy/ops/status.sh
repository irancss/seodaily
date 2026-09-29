#!/bin/sh
# Health of the stack in one look; exits 1 when something needs attention.
# The daily monitor workflow runs it over SSH, so a failure reaches GitHub's
# failed-workflow e-mail.
. "$(dirname "$0")/lib.sh"

problems=0
ok() { echo "OK    $*"; }
bad() { echo "FAIL  $*"; problems=$((problems + 1)); }
note() { echo "INFO  $*"; }

app=$(app_container)
if [ -n "$app" ] && healthy "$app"; then
  ok "app healthy: $(docker exec "$app" wget -qO- http://127.0.0.1:3000/api/health 2>/dev/null)"
else
  bad "app is not healthy"
fi
worker=$(docker compose ps -q worker 2>/dev/null | head -n 1)
if [ -n "$worker" ] && [ "$(docker inspect -f '{{.State.Running}}' "$worker")" = true ]; then
  ok "plugin worker running (restarts: $(docker inspect -f '{{.RestartCount}}' "$worker")); heartbeat and scanner state: panel → افزونه‌ها → پایش"
else
  bad "plugin worker is not running (docker compose up -d worker)"
fi
[ -n "$app" ] && note "app restarts since start: $(docker inspect -f '{{.RestartCount}}' "$app"), up since $(docker inspect -f '{{.State.StartedAt}}' "$app" | cut -c1-19)"
if docker compose exec -T db sh -c 'pg_isready -q -U "$POSTGRES_USER" -d "$POSTGRES_DB"'; then ok "database accepts connections"; else bad "database is not ready"; fi

for path in "$DEPLOY_PATH" "$BACKUP_DIR" "$(docker info -f '{{.DockerRootDir}}' 2>/dev/null)"; do
  [ -d "$path" ] || continue
  used=$(df -P "$path" | awk 'NR==2 {gsub("%", "", $5); print $5}')
  if [ "$used" -ge 85 ]; then bad "disk ${used}% used at $path"; else ok "disk ${used}% used at $path"; fi
done

age_hours() { [ -f "$1" ] && echo $(( ($(date +%s) - $(date -r "$1" +%s)) / 3600 )) || echo none; }
for f in last-success-daily last-restore-check; do
  h=$(age_hours "$BACKUP_DIR/.$f")
  if [ "$h" = none ]; then bad "$f: never"; elif [ "$h" -gt 30 ]; then bad "$f: ${h}h ago"; else ok "$f: ${h}h ago"; fi
done
[ -f "$BACKUP_DIR/.last-failure" ] && note "last backup failure: $(cat "$BACKUP_DIR/.last-failure")"
note "backups: $(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1) in $BACKUP_DIR"
note "live version: $(tail -n 1 deploys.log 2>/dev/null || echo unknown)"
note "rollback targets: $(docker images seodaily --format '{{.Tag}}' | grep -Ev '^(latest|previous|<none>)$' | tr '\n' ' ')"
note "docker: $(docker system df --format '{{.Type}} {{.Size}}' | tr '\n' ' ')"

[ "$problems" -eq 0 ]
