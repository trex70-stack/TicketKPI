import { existsSync, copyFileSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import SQLite from '@journeyapps/sqlcipher';
import { validateKey } from './backup.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CONFIG_DB_TEMP_PATH = join(__dirname, '..', 'config_encrypted.db');
const CONFIG_DB_BACKUP_PATH = join(__dirname, '..', 'config_pre_migration.db');

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function tryOpenEncrypted(dbPath, key) {
  return new Promise((resolve) => {
    const db = new SQLite.Database(dbPath, SQLite.OPEN_READWRITE, async (err) => {
      if (err) {
        resolve({ success: false, db: null });
        return;
      }
      
      db.run(`PRAGMA key = '${key}'`, async (err) => {
        if (err) {
          db.close();
          await delay(200);
          resolve({ success: false, db: null });
          return;
        }
        
        db.get("SELECT count(*) as cnt FROM sqlite_master", async (err, row) => {
          if (err) {
            db.close();
            await delay(200);
            resolve({ success: false, db: null });
          } else {
            resolve({ success: true, db });
          }
        });
      });
    });
  });
}

function tryOpenUnencrypted(dbPath) {
  return new Promise((resolve) => {
    const db = new SQLite.Database(dbPath, SQLite.OPEN_READONLY, async (err) => {
      if (err) {
        resolve({ success: false, db: null });
        return;
      }
      
      db.get("SELECT count(*) as cnt FROM sqlite_master", async (err, row) => {
        if (err) {
          db.close();
          await delay(200);
          resolve({ success: false, db: null });
        } else {
          resolve({ success: true, db });
        }
      });
    });
  });
}

async function closeDb(db) {
  return new Promise((resolve) => {
    if (!db) {
      resolve();
      return;
    }
    try {
      db.close(async (err) => {
        await delay(300);
        resolve();
      });
    } catch (e) {
      resolve();
    }
  });
}

async function exportData(db) {
  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM users", [], (err, rows) => {
      if (err) reject(err);
      else resolve({ users: rows || [] });
    });
  });
}

async function createEncryptedDb(dbPath, key, data) {
  return new Promise((resolve, reject) => {
    const db = new SQLite.Database(dbPath, (err) => {
      if (err) return reject(err);
      
      db.run(`PRAGMA key = '${key}'`, (err) => {
        if (err) {
          db.close();
          return reject(err);
        }
        
        db.run(`
          CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            azure_id TEXT UNIQUE,
            email TEXT UNIQUE,
            name TEXT,
            kuerzel TEXT,
            role TEXT DEFAULT 'standard',
            password_hash TEXT,
            invitation_token TEXT,
            invitation_expires TEXT,
            password_set INTEGER DEFAULT 0,
            reset_token TEXT,
            reset_token_expires TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
          )
        `, (err) => {
          if (err) {
            db.close();
            return reject(err);
          }
          
          if (!data.users || data.users.length === 0) {
            db.close();
            resolve();
            return;
          }
          
          const insertStmt = `INSERT INTO users 
            (azure_id, email, name, kuerzel, role, password_hash, invitation_token, 
             invitation_expires, password_set, reset_token, reset_token_expires, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
          
          let completed = 0;
          const total = data.users.length;
          let hasError = false;
          
          data.users.forEach(user => {
            if (hasError) return;
            
            db.run(insertStmt, [
              user.azure_id,
              user.email,
              user.name,
              user.kuerzel,
              user.role,
              user.password_hash,
              user.invitation_token,
              user.invitation_expires,
              user.password_set,
              user.reset_token,
              user.reset_token_expires,
              user.created_at,
              user.updated_at
            ], (err) => {
              if (err && !hasError) {
                hasError = true;
                db.close();
                reject(err);
                return;
              }
              
              completed++;
              if (completed === total && !hasError) {
                db.close();
                resolve();
              }
            });
          });
        });
      });
    });
  });
}

export async function needsMigration(dbPath, key) {
  if (!existsSync(dbPath)) {
    return false;
  }
  
  const encResult = await tryOpenEncrypted(dbPath, key);
  if (encResult.success) {
    await closeDb(encResult.db);
    return false;
  }
  
  const unencResult = await tryOpenUnencrypted(dbPath);
  if (unencResult.success) {
    await closeDb(unencResult.db);
    return true;
  }
  
  return false;
}

export async function migrate(dbPath, key) {
  const keyValidation = validateKey(key);
  if (!keyValidation.valid) {
    throw new Error(keyValidation.error);
  }
  
  if (!existsSync(dbPath)) {
    console.log('Keine Config-Datenbank vorhanden - keine Migration nötig');
    return false;
  }
  
  const encResult = await tryOpenEncrypted(dbPath, key);
  if (encResult.success) {
    await closeDb(encResult.db);
    console.log('Datenbank bereits verschlüsselt - keine Migration nötig');
    return false;
  }
  
  const unencResult = await tryOpenUnencrypted(dbPath);
  if (!unencResult.success) {
    throw new Error('Datenbank kann nicht geöffnet werden');
  }
  
  console.log('Starte Migration zu verschlüsselter Datenbank...');
  
  try {
    console.log('1. Erstelle Backup der unverschlüsselten DB...');
    copyFileSync(dbPath, CONFIG_DB_BACKUP_PATH);
    
    console.log('2. Exportiere Daten...');
    const data = await exportData(unencResult.db);
    console.log(`   ${data.users.length} Benutzer gefunden`);
    
    console.log('3. Schließe alte DB...');
    await closeDb(unencResult.db);
    
    console.log('4. Erstelle neue verschlüsselte DB...');
    if (existsSync(CONFIG_DB_TEMP_PATH)) {
      unlinkSync(CONFIG_DB_TEMP_PATH);
    }
    await createEncryptedDb(CONFIG_DB_TEMP_PATH, key, data);
    
    console.log('5. Lösche alte DB...');
    unlinkSync(dbPath);
    
    console.log('6. Benenne neue DB um...');
    const fs = await import('fs');
    await fs.promises.rename(CONFIG_DB_TEMP_PATH, dbPath);
    
    console.log('Migration erfolgreich abgeschlossen!');
    console.log(`Backup der unverschlüsselten DB: ${CONFIG_DB_BACKUP_PATH}`);
    
    return true;
  } catch (error) {
    console.error('Migration fehlgeschlagen:', error.message);
    
    await closeDb(unencResult.db);
    
    if (existsSync(CONFIG_DB_TEMP_PATH)) {
      try { unlinkSync(CONFIG_DB_TEMP_PATH); } catch (e) {}
    }
    
    throw error;
  }
}

export default { needsMigration, migrate, validateKey };