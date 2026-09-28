#!/bin/sh
# Proves a dump restores: loads it into a scratch database next to the live
# one, compares it with the live schema and counts, then drops the scratch
# database. Never touches the live database.
#   sh ops/restore-check.sh [dump]     default: the newest db-*.dump
. "$(dirname "$0")/lib.sh"

DUMP=${1:-$(ls -1t "$BACKUP_DIR"/db-*.dump 2>/dev/null | head -n 1)}
[ -n "$DUMP" ] && [ -s "$DUMP" ] || die "no dump to check"
SCRATCH=seodaily_restore_check

psql_db() { docker compose exec -T db sh -c "psql -U \"\$POSTGRES_USER\" -d $1 -AtX -v ON_ERROR_STOP=1" ; }
live_db=$(docker compose exec -T db sh -c 'printf %s "$POSTGRES_DB"')
[ "$live_db" != "$SCRATCH" ] || die "refusing: the scratch name is the live database"

cleanup() { docker compose exec -T db sh -c "dropdb -U \"\$POSTGRES_USER\" --if-exists $SCRATCH" >/dev/null 2>&1 || true; }
trap cleanup EXIT
cleanup
docker compose exec -T db sh -c "createdb -U \"\$POSTGRES_USER\" $SCRATCH"
docker compose exec -T db sh -c "pg_restore -U \"\$POSTGRES_USER\" -d $SCRATCH --no-owner --exit-on-error" < "$DUMP" \
  || { date -u +%Y-%m-%dT%H:%M:%SZ > "$BACKUP_DIR/.last-restore-failure"; die "restore of $DUMP failed"; }

QUERY="select string_agg(table_name, ',' order by table_name) from information_schema.tables where table_schema = 'public';
select count(*) from drizzle.__drizzle_migrations;
select count(*) from services; select count(*) from leads; select count(*) from settings; select count(*) from users;"
restored=$(echo "$QUERY" | psql_db "$SCRATCH" | tr '\n' ' ')
live=$(echo "$QUERY" | psql_db "$live_db" | tr '\n' ' ')
log "restored: $restored"
log "live:     $live"
# Same tables and migrations; row counts may only have grown since the dump.
[ "$(echo "$restored" | cut -d' ' -f1-2)" = "$(echo "$live" | cut -d' ' -f1-2)" ] || die "schema of $DUMP differs from the live database"
[ "$(echo "$restored" | cut -d' ' -f3)" -gt 0 ] || die "restored database has no services"
date -u +%Y-%m-%dT%H:%M:%SZ > "$BACKUP_DIR/.last-restore-check"
log "restore check passed: $(basename "$DUMP")"
