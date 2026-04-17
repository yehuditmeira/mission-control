#!/bin/bash
# Mission Control Data Migration Script
# Migrates data from SQLite to Supabase

set -e

echo "🚀 Mission Control Data Migration"
echo "================================="

# Paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
DB_PATH="$PROJECT_DIR/data/mission-control.db"
DUMP_PATH="$SCRIPT_DIR/migration_$(date +%Y%m%d_%H%M%S).sql"

# Check prerequisites
echo ""
echo "📋 Checking prerequisites..."

if [ ! -f "$DB_PATH" ]; then
    echo "❌ Database not found: $DB_PATH"
    exit 1
fi
echo "   ✅ SQLite database found"

if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found"
    exit 1
fi
echo "   ✅ Node.js found: $(node --version)"

# Install better-sqlite3 if needed
echo ""
echo "📦 Checking dependencies..."
cd "$PROJECT_DIR"
if ! node -e "require('better-sqlite3')" 2>/dev/null; then
    echo "   Installing better-sqlite3..."
    npm install better-sqlite3 --save-dev 2>&1 | tail -3
fi
echo "   ✅ Dependencies ready"

# Create SQL dump for backup/audit
echo ""
echo "💾 Creating SQL dump for backup..."
sqlite3 "$DB_PATH" .dump > "$DUMP_PATH"
echo "   ✅ Dump created: $DUMP_PATH"

# Count records in source
echo ""
echo "📊 Source database counts:"
CP_DB="/tmp/mc_migrate_$$.db"
cp "$DB_PATH" "$CP_DB"
echo "   - projects: $(sqlite3 "$CP_DB" "SELECT COUNT(*) FROM projects;")"
echo "   - tasks: $(sqlite3 "$CP_DB" "SELECT COUNT(*) FROM tasks;")"
echo "   - platform_tasks: $(sqlite3 "$CP_DB" "SELECT COUNT(*) FROM platform_tasks;")"
echo "   - notes: $(sqlite3 "$CP_DB" "SELECT COUNT(*) FROM notes;")"
echo "   - events: $(sqlite3 "$CP_DB" "SELECT COUNT(*) FROM events;")"
rm -f "$CP_DB"

# Run the migration
echo ""
echo "🔄 Running migration..."
node "$SCRIPT_DIR/migrate.js"

# Final summary
echo ""
echo "================================="
echo "📁 Migration artifacts:"
echo "   - Script: $SCRIPT_DIR/migrate.js"
echo "   - SQL dump: $DUMP_PATH"
echo "   - Log: $SCRIPT_DIR/migration.log"
echo ""
echo "👍 Migration complete!"
