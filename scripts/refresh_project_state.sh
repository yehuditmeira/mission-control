#!/usr/bin/env bash
set -euo pipefail

OUT="$HOME/Documents/Obsidian Vault/Agent-Shared/project-state.md"
DATE_NOW=$(date +"%Y-%m-%d %H:%M EDT")

echo "# Project State Snapshot — $(date +%F)" > "$OUT"

declare -A MAP
MAP[affiliate_flow]="Affiliate_Flow"
MAP[merchant_services]="Merchant_Services"
MAP[mission-control]="Mission_Control"
MAP[paydirect]="PayDirect"
MAP[personal-assistant]="Personal_Assistant"

for key in "affiliate_flow" "merchant_services" "mission-control" "paydirect" "personal-assistant"; do
  proj=${MAP[$key]}
  HANDOFF="/Users/katespencer/Desktop/AI_Folder/${key}/HANDOFF.md"
  status="Idle"
  notes=""
  branch=""
  last="$DATE_NOW"

  if [ -f "$HANDOFF" ]; then
    st=$(grep -m1 -E "^[- ]*Status:" "$HANDOFF" 2>/dev/null || true)
    if [ -n "$st" ]; then
      status=$(echo "$st" | sed -E 's/^[- ]*Status:[[:space:]]*//')
    fi
    note=$(grep -m1 -E "^[- ]*(What I did|What’s next|What's next):" "$HANDOFF" 2>/dev/null || true)
    if [ -n "$note" ]; then
      notes=$(echo "$note" | sed -E 's/^[- ]*//')
    fi
    br=$(grep -m1 -E "^[- ]*Branch:" "$HANDOFF" 2>/dev/null || true)
    if [ -n "$br" ]; then
      branch=$(echo "$br" | sed -E 's/^[- ]*Branch:[[:space:]]*//')
    fi
  fi

  # fallback: detect published mentions in decisions-log
  if [ "$status" = "Idle" ]; then
    if grep -qi "Published" "/Users/katespencer/Documents/Obsidian Vault/Agent-Shared/decisions-log.md" 2>/dev/null; then
      # simple heuristic: leave as-is if already live entry exists
      :
    fi
  fi

  echo "## ${proj}" >> "$OUT"
  echo "- Status: ${status}" >> "$OUT"
  echo "- Notes: ${notes}" >> "$OUT"
  echo "- Branch: ${branch}" >> "$OUT"
  echo "- Last updated: ${last}" >> "$OUT"
  echo "" >> "$OUT"
done

echo "Refreshed project-state -> $OUT"
