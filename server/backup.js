import { existsSync, mkdirSync, readdirSync, statSync, copyFileSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BACKUP_DIR = join(__dirname, 'backups', 'config');
const MAX_BACKUPS = 7;
export const MIN_KEY_LENGTH = 32;

export function validateKey(key) {
  if (!key) {
    return { valid: false, error: 'CONFIG_DB_KEY ist nicht gesetzt!' };
  }
  
  if (key.length < MIN_KEY_LENGTH) {
    return { 
      valid: false, 
      error: `CONFIG_DB_KEY muss mindestens ${MIN_KEY_LENGTH} Zeichen haben (aktuell: ${key.length})` 
    };
  }
  
  return { valid: true };
}

export function ensureBackupDir() {
  if (!existsSync(BACKUP_DIR)) {
    mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

export function getBackupFiles() {
  ensureBackupDir();
  
  const files = readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith('config_') && f.endsWith('.db'))
    .map(f => ({
      name: f,
      path: join(BACKUP_DIR, f),
      date: statSync(join(BACKUP_DIR, f)).mtime
    }))
    .sort((a, b) => b.date - a.date);
  
  return files;
}

export function cleanupOldBackups() {
  const files = getBackupFiles();
  
  while (files.length > MAX_BACKUPS) {
    const oldest = files.pop();
    unlinkSync(oldest.path);
    console.log(`Backup gelöscht: ${oldest.name}`);
  }
}

export function createBackup(dbPath) {
  if (!existsSync(dbPath)) {
    console.log('Keine Config-Datenbank vorhanden - Backup übersprungen');
    return null;
  }
  
  ensureBackupDir();
  
  const now = new Date();
  const dateStr = now.toISOString()
    .replace(/[:.]/g, '-')
    .slice(0, 19);
  
  const backupName = `config_${dateStr}.db`;
  const backupPath = join(BACKUP_DIR, backupName);
  
  copyFileSync(dbPath, backupPath);
  console.log(`Backup erstellt: ${backupName}`);
  
  cleanupOldBackups();
  
  return backupPath;
}

export function restoreBackup(backupName, targetPath) {
  const backupPath = join(BACKUP_DIR, backupName);
  
  if (!existsSync(backupPath)) {
    throw new Error(`Backup nicht gefunden: ${backupName}`);
  }
  
  if (existsSync(targetPath)) {
    const now = new Date();
    const tempName = `config_before_restore_${now.getTime()}.db`;
    const tempPath = join(BACKUP_DIR, tempName);
    copyFileSync(targetPath, tempPath);
    console.log(`Aktuelle DB gesichert als: ${tempName}`);
  }
  
  copyFileSync(backupPath, targetPath);
  console.log(`Backup wiederhergestellt: ${backupName}`);
  
  return true;
}

export function listBackups() {
  return getBackupFiles().map(f => ({
    name: f.name,
    date: f.date.toISOString(),
    size: statSync(f.path).size
  }));
}

export default {
  validateKey,
  createBackup,
  restoreBackup,
  listBackups,
  cleanupOldBackups,
  ensureBackupDir,
  MIN_KEY_LENGTH
};
