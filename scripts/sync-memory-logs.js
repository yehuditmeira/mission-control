#!/usr/bin/env node
// =====================================================
// SYNC MEMORY LOGS
// Mirrors Obsidian daily logs into Mission Control's memory folder so the
// dashboard always shows the same daily history.
// Run: node scripts/sync-memory-logs.js
// =====================================================

const fs = require('fs');
const path = require('path');
const os = require('os');

const HOME = os.homedir();
const SOURCE_DIR = path.join(HOME, 'Documents', 'Obsidian Vault', 'Agent-OpenClaw', 'daily');
const DEST_DIR = path.join(process.cwd(), 'memory');
const DATE_FILE = /^\d{4}-\d{2}-\d{2}\.md$/;

if (!fs.existsSync(SOURCE_DIR)) {
  console.error(`Source daily log folder not found: ${SOURCE_DIR}`);
  process.exit(1);
}

fs.mkdirSync(DEST_DIR, { recursive: true });

let copied = 0;
let unchanged = 0;
for (const filename of fs.readdirSync(SOURCE_DIR)) {
  if (!DATE_FILE.test(filename)) continue;

  const src = path.join(SOURCE_DIR, filename);
  const dst = path.join(DEST_DIR, filename);
  const srcContent = fs.readFileSync(src, 'utf-8');
  const dstContent = fs.existsSync(dst) ? fs.readFileSync(dst, 'utf-8') : null;

  if (dstContent === srcContent) {
    unchanged++;
    continue;
  }

  fs.writeFileSync(dst, srcContent);
  copied++;
}

console.log(`Mirrored ${copied} daily logs, ${unchanged} unchanged.`);
