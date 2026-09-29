#!/bin/sh
# Replaces the LIVE database (and optionally the uploads) with a backup.
# For disasters only: a broken migration, lost or corrupted data. Everything
# written after the backup is lost, so the current state is saved first.
#   sh ops/restore.sh --yes-replace-live-data <db-….dump> [uploads-….tar.gz]
# Afterwards run the app version that matches the dump (ops/rollback.sh <tag>)
# if the dump predates a migration.
. "$(dirname "$0")/lib.sh"

[ "${1:-}" = --yes-replace-live-data ] || die "usage: restore.sh --yes-replace-live-data <db dump> [uploads archive] [plugin files archive]"
DUMP=${2:?db dump}
UPLOADS=${3:-}
PLUGIN_FILES=${4:-}
[ -s "$DUMP" ] || die "$DUMP not found"
[ -z "$UPLOADS" ] || [ -s "$UPLOADS" ] || die "$UPLOADS not found"
[ -z "$PLUGIN_FILES" ] || [ -s "$PLUGIN_FILES" ] || die "$PLUGIN_FILES not found"
docker compose exec -T db pg_restore -l < "$DUMP" > /dev/null || die "$DUMP is not a readable dump"

log "saving the current state first"
sh "$OPS/backup.sh" manual

log "stopping the app"
docker compose stop app worker
log "replacing the database with $(basename "$DUMP")"
# A fresh database, so tables added after the dump do not survive next to it.
docker compose exec -T db sh -c 'dropdb -U "$POSTGRES_USER" "$POSTGRES_DB" && createdb -U "$POSTGRES_USER" "$POSTGRES_DB"'
docker compose exec -T db sh -c 'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --no-owner --exit-on-error' < "$DUMP"

if [ -n "$UPLOADS" ]; then
  log "restoring uploads from $(basename "$UPLOADS") (existing files are kept, same names overwritten)"
  docker compose run --rm --no-deps -T --entrypoint tar app xzf - -C /app/uploads < "$UPLOADS"
fi

if [ -n "$PLUGIN_FILES" ]; then
  log "restoring private plugin files"
  docker compose run --rm --no-deps -T --entrypoint tar app xf - -C /app/plugin-files < "$PLUGIN_FILES"
fi

# Refuse to start downloads against missing or mismatched retained artifacts.
docker compose run --rm --no-deps -T --entrypoint node app scripts/verify-plugin-files.mjs

log "starting the app"
docker compose up -d --no-deps app
i=0
until healthy "$(app_container)"; do
  i=$((i + 1)); [ "$i" -ge 45 ] && die "the app is not healthy after the restore: docker compose logs app"
  sleep 2
done
docker compose up -d --no-deps worker
log "restored and healthy"
