import initSqlJs from 'sql.js';
import { readFileSync, existsSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const kpiDbPath = join(__dirname, '..', 'cedm_all_data.db');
const configDbPath = join(__dirname, '..', 'config.db');

let kpiDB = null;
let configDB = null;
let SQL = null;

export async function initDB() {
  SQL = await initSqlJs();
  
  // Load KPI database (read-only for ticket data)
  if (existsSync(kpiDbPath)) {
    const fileBuffer = readFileSync(kpiDbPath);
    kpiDB = new SQL.Database(fileBuffer);
  } else {
    throw new Error(`KPI database file not found: ${kpiDbPath}`);
  }
  
  // Load or create config database
  if (existsSync(configDbPath)) {
    const fileBuffer = readFileSync(configDbPath);
    configDB = new SQL.Database(fileBuffer);
  } else {
    configDB = new SQL.Database();
  }
  
  initConfigTables();
  
  return { kpiDB, configDB };
}

function initConfigTables() {
  configDB.run(`
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
  
  const defaultAdmin = configDB.exec("SELECT * FROM users WHERE email = 'tk@contact.de'");
  if (defaultAdmin.length === 0 || defaultAdmin[0].values.length === 0) {
    configDB.run(`
      INSERT INTO users (azure_id, email, name, role)
      VALUES ('default-admin', 'tk@contact.de', 'König, Thomas', 'admin')
    `);
    saveConfigDB();
  }
}

export function saveConfigDB() {
  if (!configDB) return;
  const data = configDB.export();
  const buffer = Buffer.from(data);
  writeFileSync(configDbPath, buffer);
}

export function saveKpiDB() {
  if (!kpiDB) return;
  const data = kpiDB.export();
  const buffer = Buffer.from(data);
  writeFileSync(kpiDbPath, buffer);
}

export function getKpiDB() {
  if (!kpiDB) {
    throw new Error('KPI database not initialized. Call initDB() first.');
  }
  return kpiDB;
}

export function getConfigDB() {
  if (!configDB) {
    throw new Error('Config database not initialized. Call initDB() first.');
  }
  return configDB;
}

// Legacy exports for backward compatibility
export function getDB() {
  return getKpiDB();
}

export function saveDB() {
  return saveKpiDB();
}

export default { initDB, getKpiDB, getConfigDB, getDB, saveKpiDB, saveConfigDB, saveDB };
