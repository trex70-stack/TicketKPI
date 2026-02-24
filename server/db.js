import initSqlJs from 'sql.js';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = join(__dirname, '..', 'cedm_all_data.db');

let db = null;

export async function initDB() {
  const SQL = await initSqlJs();
  
  if (existsSync(dbPath)) {
    const fileBuffer = readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
  } else {
    throw new Error(`Database file not found: ${dbPath}`);
  }
  
  return db;
}

export function getDB() {
  if (!db) {
    throw new Error('Database not initialized. Call initDB() first.');
  }
  return db;
}

export default { initDB, getDB };
