#!/usr/bin/env bash
set -euo pipefail

SCRIPTDIR="/Users/katespencer/Library/Scripts/mission-control"
MC_REPO="/Users/katespencer/Desktop/AI_Folder/mission-control"

"$SCRIPTDIR/refresh_project_state.sh"
"$SCRIPTDIR/flag-filler-tasks.sh"

# Import checkbox tasks from HANDOFF.md + OPEN_ITEMS.md into the kanban DB.
# `|| true` so a failure here doesn't kill the refresh job.
if command -v node >/dev/null 2>&1; then
  node "$MC_REPO/scripts/import_tasks_from_md.mjs" || true
fi

echo "hourly maintenance completed: $(date)"
