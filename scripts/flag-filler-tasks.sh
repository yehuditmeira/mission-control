#!/usr/bin/env bash
set -euo pipefail

DATE=$(date +%F)
OPEN="/Users/katespencer/Desktop/AI_Folder/OPEN_ITEMS.md"
OUT_DIR="/Users/katespencer/Desktop/AI_Folder/mission-control/logs"
mkdir -p "$OUT_DIR"
REPORT="$OUT_DIR/filler-report-$DATE.txt"
CANDIDATES="$OUT_DIR/filler-candidates-$DATE.txt"

echo "Filler tasks scan: $DATE" > "$REPORT"
if [ ! -f "$OPEN" ]; then
  echo "OPEN_ITEMS.md missing" >> "$REPORT"
  exit 0
fi

# extract checklist lines
grep -E '^\- \[ \]' "$OPEN" | sed 's/^\- \[ \] //' > /tmp/open_tasks_$$.txt || true

# classify: dated (YYYY-MM-DD prefix) vs filler (no date)
fcount=0
while IFS= read -r line; do
  if [[ "$line" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2} ]]; then
    echo "Dated: $line" >> "$REPORT"
  else
    echo "FILLER: $line" >> "$REPORT"
    echo "$line" >> "$CANDIDATES"
    fcount=$((fcount+1))
  fi
done < /tmp/open_tasks_$$.txt

echo "Filler candidates: $fcount" >> "$REPORT"
rm -f /tmp/open_tasks_$$.txt

echo "Report written to $REPORT" 
if [ -f "$CANDIDATES" ]; then echo "Candidates saved to $CANDIDATES"; fi
