#!/usr/bin/env bash
set -euo pipefail

DATE=$(date +%F)
TARGET="$HOME/Documents/Obsidian Vault/Agent-OpenClaw/daily/${DATE}.md"
mkdir -p "$(dirname "$TARGET")"

# refresh project state before generating brief
/Users/katespencer/Desktop/AI_Folder/mission-control/scripts/refresh_project_state.sh >/dev/null 2>&1 || true

# If the file doesn't exist, create a header
if [ ! -f "$TARGET" ]; then
  echo "# Morning Brief — $DATE" > "$TARGET"
  echo "" >> "$TARGET"
fi

append() {
  echo "$1" >> "$TARGET"
}

append "## AI BRIEF"
# Try to extract top headlines from The Verge (best-effort)
AI_HEADLINES=$(curl -sL "https://www.theverge.com/ai" | perl -0777 -ne 'while (m{<h2[^>]*>(.*?)</h2>}gs) { $t=$1; $t =~ s/<[^>]*>//g; print $t."\n" }' | sed '/^\s*$/d' | head -n 3)
if [ -z "${AI_HEADLINES}" ]; then
  AI_HEADLINES="(couldn't fetch live AI headlines)"
fi
while IFS= read -r line; do
  append "- $line"
done <<< "$AI_HEADLINES"

append ""
append "## X / TWITTER TRENDS (public scan)"
# Best-effort trends from trends24.in (extract hashtags)
TRENDS=$(curl -sL "https://trends24.in/united-states/" | perl -0777 -ne 'while (m{<a[^>]*>(#[^<]+)</a>}gs) { print $1."\n" }' | uniq | head -n 8)
if [ -z "${TRENDS}" ]; then
  TRENDS="(no public trend data available)"
fi
while IFS= read -r t; do
  append "- $t"
done <<< "$TRENDS"

append ""
append "## APPOINTMENTS (from Obsidian HANDOFFs / daily notes)"
# Pull lines mentioning common appointment keywords from today's daily / handoff files
grep -HinE "appointment|dentist|pediatric|pediatri|school|yeshiva|moshe|esther|joe dimaggio" "$HOME/Documents/Obsidian Vault/Agent-OpenClaw/daily/"*.md 2>/dev/null | sed -n '1,50p' | head -n 20 | sed 's/^/ - /' >> "$TARGET" || true

append ""
append "## TWEET DRAFT (ready)"
# Short draft based on AI headlines
FIRST_AI_LINE=$(echo "$AI_HEADLINES" | sed -n '1p')
if [ -z "$FIRST_AI_LINE" ]; then
  FIRST_AI_LINE="Top AI news today — see brief."
fi
append "- ${FIRST_AI_LINE} #AI #Tech"
append ""
append "(Generated automatically by Henry)"

echo "Morning brief generated: $TARGET"
