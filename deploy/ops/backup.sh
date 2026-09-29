#!/bin/sh
# Database dump (and, for the daily run, the uploaded images and .env) into
# $BACKUP_DIR, default ~/seodaily-backups: outside the app directory, not
# served by anything, readable only by this user.
#   sh ops/backup.sh daily        cron, every night
#   sh ops/backup.sh pre-deploy   before each deploy's migrations
# Keeps 14 daily and 10 pre-deploy dumps, 7 upload archives. Only its own
# files (db-*, uploads-*) are ever removed.
. "$(dirname "$0")/lib.sh"

KIND=${1:-daily}
case "$KIND" in daily|pre-deploy|manual) ;; *) die "unknown kind $KIND" ;; esac
umask 077
mkdir -p "$BACKUP_DIR"
STAMP=$(date -u +%Y%m%dT%H%M%SZ)

fail() { date -u +%Y-%m-%dT%H:%M:%SZ > "$BACKUP_DIR/.last-failure"; rm -f "$BACKUP_DIR"/*.part; die "backup: $*"; }

db="$BACKUP_DIR/db-$KIND-$STAMP.dump"
docker compose exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" -Fc "$POSTGRES_DB"' > "$db.part" || fail "pg_dump failed"
[ -s "$db.part" ] || fail "empty dump"
# A dump that cannot be listed cannot be restored either.
docker compose exec -T db pg_restore -l < "$db.part" > /dev/null || fail "dump is not readable"
mv "$db.part" "$db"
log "database: $db ($(du -h "$db" | cut -f1))"

if [ "$KIND" = daily ]; then
  up="$BACKUP_DIR/uploads-$STAMP.tar.gz"
  docker compose run --rm --no-deps -T --entrypoint tar app czf - -C /app/uploads . > "$up.part" || fail "uploads archive failed"
  mv "$up.part" "$up"
  log "uploads: $up ($(du -h "$up" | cut -f1))"
  cp .env "$BACKUP_DIR/env.latest"
  # Plugin packages (objects only; temp downloads are not worth keeping). ZIPs
  # are already compressed, so a plain tar; few copies, they can be large.
  pf="$BACKUP_DIR/plugin-files-$STAMP.tar"
  docker compose run --rm --no-deps -T --entrypoint sh app -c 'mkdir -p /app/plugin-files/objects && tar cf - -C /app/plugin-files objects' > "$pf.part" || fail "plugin files archive failed"
  mv "$pf.part" "$pf"
  log "plugin files: $pf ($(du -h "$pf" | cut -f1))"
fi

prune() { ls -1t "$BACKUP_DIR"/$1 2>/dev/null | tail -n +$(($2 + 1)) | xargs -r rm -f; }
prune 'db-daily-*.dump' 14
prune 'db-pre-deploy-*.dump' 10
prune 'db-manual-*.dump' 10
prune 'uploads-*.tar.gz' 7
prune 'plugin-files-*.tar' 3

date -u +%Y-%m-%dT%H:%M:%SZ > "$BACKUP_DIR/.last-success-$KIND"
