#!/bin/sh
# Cron entry point: backup, then prove the new dump restores.
# --first-time (deploy workflow): only when no nightly backup exists yet.
. "$(dirname "$0")/lib.sh"
if [ "${1:-}" = --first-time ] && [ -f "$BACKUP_DIR/.last-success-daily" ]; then exit 0; fi
trim_log "$OPS/nightly.log"
sh "$OPS/backup.sh" daily
sh "$OPS/restore-check.sh"
