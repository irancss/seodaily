# Shared by the ops scripts. They run on the production server from
# $DEPLOY_PATH/ops (the deploy workflow copies them there), next to the
# docker-compose.yml and .env of the stack.
set -eu

OPS=$(cd "$(dirname "$0")" && pwd)
DEPLOY_PATH=${DEPLOY_PATH:-$(dirname "$OPS")}
cd "$DEPLOY_PATH"
[ -f docker-compose.yml ] && [ -f .env ] || { echo "No docker-compose.yml/.env in $DEPLOY_PATH" >&2; exit 1; }

# One value from .env, without sourcing the file (values may contain shell characters).
env_value() {
  sed -n "s/^$1=//p" .env | tail -n 1 | sed "s/^\"\\(.*\\)\"\$/\\1/; s/^'\\(.*\\)'\$/\\1/"
}

# Outside the app directory, so losing that directory does not take the backups with it.
BACKUP_DIR=${BACKUP_DIR:-$(env_value BACKUP_DIR)}
BACKUP_DIR=${BACKUP_DIR:-$HOME/seodaily-backups}

log() { printf '%s %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$*"; }
die() { log "ERROR: $*" >&2; exit 1; }

# Health as the app itself reports it (database included), from inside the container.
healthy() { docker exec "$1" wget -qO- http://127.0.0.1:3000/api/health 2>/dev/null | grep -q '"status":"ok"'; }
app_container() { docker compose ps -q app 2>/dev/null | head -n 1; }

# Keeps a log file written by cron from growing without limit.
trim_log() {
  [ -f "$1" ] || return 0
  if [ "$(wc -c < "$1")" -gt 1048576 ]; then tail -n 2000 "$1" > "$1.tmp" && mv "$1.tmp" "$1"; fi
}
