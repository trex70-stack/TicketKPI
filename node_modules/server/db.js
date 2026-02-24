import initSqlJs from 'sql.js';
import { readFileSync, existsSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = join(__dirname, '..', 'cedm_all_data.db');

let db = null;
let SQL = null;

export async function initDB() {
  SQL = await initSqlJs();
  
  if (existsSync(dbPath)) {
    const fileBuffer = readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
  } else {
    throw new Error(`Database file not found: ${dbPath}`);
  }
  
  initUsersTable();
  
  return db;
}

function initUsersTable() {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      azure_id TEXT UNIQUE,
      email TEXT,
      name TEXT,
      role TEXT DEFAULT 'standard',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  const defaultAdmin = db.exec("SELECT * FROM users WHERE email = 'tk@contact.de'");
  if (defaultAdmin.length === 0 || defaultAdmin[0].values.length === 0) {
    db.run(`
      INSERT INTO users (azure_id, email, name, role)
      VALUES ('default-admin', 'tk@contact.de', 'König, Thomas', 'admin')
    `);
    saveDB();
  }
}

export function saveDB() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  writeFileSync(dbPath, buffer);
}

export function getDB() {
  if (!db) {
    throw new Error('Database not initialized. Call initDB() first.');
  }
  return db;
}

export default { initDB, getDB, saveDB };
