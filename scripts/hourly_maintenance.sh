#!/usr/bin/env bash
set -euo pipefail

SCRIPTDIR="/Users/katespencer/Desktop/AI_Folder/mission-control/scripts"
"$SCRIPTDIR/refresh_project_state.sh"
"$SCRIPTDIR/flag-filler-tasks.sh"

echo "hourly maintenance completed: $(date)"
