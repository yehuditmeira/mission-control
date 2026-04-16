import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(process.cwd(), 'data', 'mission-control.db');

/**
 * Runs all schema updates needed for the platform marketing system
 */
export function runSchemaUpdates() {
  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // Run base schema
  const baseSchemaPath = path.join(process.cwd(), 'lib', 'schema.sql');
  if (fs.existsSync(baseSchemaPath)) {
    const baseSchema = fs.readFileSync(baseSchemaPath, 'utf-8');
    db.exec(baseSchema);
  }

  // Run platform marketing schema updates
  const updatesPath = path.join(process.cwd(), 'lib', 'schema-updates.sql');
  if (fs.existsSync(updatesPath)) {
    const updates = fs.readFileSync(updatesPath, 'utf-8');
    db.exec(updates);
    console.log('✅ Platform marketing schema applied');
  }

  db.close();
}

// Run if called directly
if (require.main === module) {
  runSchemaUpdates();
  console.log('Schema updates complete');
}
