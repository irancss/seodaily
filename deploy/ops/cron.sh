#!/bin/sh
# Installs (or refreshes) the nightly backup + restore check in this user's
# crontab. Only the block between the seodaily-ops markers is managed.
. "$(dirname "$0")/lib.sh"

command -v crontab >/dev/null 2>&1 || { echo "::warning::crontab is not available on the server; nightly backups are not scheduled (RUNBOOK.md)"; exit 0; }
BEGIN="# BEGIN seodaily-ops (managed by the deploy workflow)"
END="# END seodaily-ops"
# 03:17 server time: away from the full hour, when most cron jobs start.
JOB="17 3 * * * PATH=/usr/local/bin:/usr/bin:/bin DEPLOY_PATH='$DEPLOY_PATH' sh '$OPS/nightly.sh' >> '$OPS/nightly.log' 2>&1"
current=$(crontab -l 2>/dev/null || true)
wanted=$(printf '%s\n' "$current" | sed "/^# BEGIN seodaily-ops/,/^# END seodaily-ops/d"; printf '%s\n%s\n%s\n' "$BEGIN" "$JOB" "$END")
if [ "$(printf '%s\n' "$current" | sed -n "/^# BEGIN seodaily-ops/,/^# END seodaily-ops/p")" = "$(printf '%s\n%s\n%s' "$BEGIN" "$JOB" "$END")" ]; then
  echo "nightly backup already scheduled"
else
  printf '%s\n' "$wanted" | sed '/./,$!d' | crontab -
  echo "nightly backup scheduled: $JOB"
fi
