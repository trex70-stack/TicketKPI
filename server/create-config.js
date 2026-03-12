import SQLite from '@journeyapps/sqlcipher';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbKey = process.env.CONFIG_DB_KEY || 'Y7fPjV2sR9cD1xL4kH8bM0zG3wN6qE5aT';
console.log('Schlüssel-Länge:', dbKey.length);

const dbPath = path.join(__dirname, '..', 'config.db');

if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
  console.log('Alte config.db gelöscht');
}

const db = new SQLite.Database(dbPath);

db.run(`PRAGMA key = '${dbKey}'`, (err) => {
  if (err) {
    console.error('Fehler beim Setzen des Schlüssels:', err.message);
    process.exit(1);
  }
  
  db.run(`CREATE TABLE users (
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
  )`, (err) => {
    if (err) {
      console.error('Fehler beim Erstellen der Tabelle:', err.message);
      process.exit(1);
    }
    
    db.run(`INSERT INTO users (azure_id, email, name, kuerzel, role, password_set)
      VALUES ('default-admin', 'tk@contact.de', 'König, Thomas', 'tk', 'admin', 1)`, (err) => {
      if (err) {
        console.error('Fehler beim Einfügen:', err.message);
        process.exit(1);
      }
      
      db.get('SELECT * FROM users WHERE email = ?', ['tk@contact.de'], (err, row) => {
        if (err) {
          console.error('Prüfung fehlgeschlagen:', err.message);
          process.exit(1);
        }
        
        console.log('========================================');
        console.log('Neue verschlüsselte config.db erstellt!');
        console.log('========================================');
        console.log('Admin-User:', row.email);
        console.log('Rolle:', row.role);
        console.log('Kürzel:', row.kuerzel);
        db.close();
      });
    });
  });
});