import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(process.cwd(), 'data', 'mission-control.db');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;

  // Ensure data directory exists
  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // Run schema
  const schemaPath = path.join(process.cwd(), 'lib', 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  db.exec(schema);

  // Run platform marketing schema updates
  const schemaUpdatesPath = path.join(process.cwd(), 'lib', 'schema-updates.sql');
  if (fs.existsSync(schemaUpdatesPath)) {
    const schemaUpdates = fs.readFileSync(schemaUpdatesPath, 'utf-8');
    db.exec(schemaUpdates);
  }

  // Seed default projects if empty
  const count = db.prepare('SELECT COUNT(*) as count FROM projects').get() as { count: number };
  if (count.count === 0) {
    const insert = db.prepare('INSERT INTO projects (name, color, sort_order) VALUES (?, ?, ?)');
    insert.run('Merchant Services', '#EC4899', 0);
    insert.run('Affiliate Flow', '#A855F7', 1);
    insert.run('Personal', '#F9A8D4', 2);
  }

  return db;
}
