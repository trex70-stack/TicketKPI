import express from 'express';
import cors from 'cors';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import { initDB, getConfig } from './db.js';
import { initEmailService } from './emailService.js';
import { createBackup, validateKey } from './backup.js';
import { migrate } from './migrate-config.js';
import filtersRouter from './routes/filters.js';
import reporterRouter from './routes/reporter.js';
import managementRouter from './routes/management.js';
import agentRouter from './routes/agent.js';
import authRouter from './routes/auth.js';
import usersRouter from './routes/users.js';
import invitationsRouter from './routes/invitations.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/config', (req, res) => {
  const config = getConfig();
  res.json({
    protocol: config.client?.protocol || 'http',
    port: config.client?.port || config.server?.port || 3001,
    debug: config.client?.debug || false,
    azureClaimMapping: config.azureClaimMapping || {
      azureId: 'oid',
      email: 'preferred_username',
      name: 'name',
      kuerzel: 'onprem_sam_account_name'
    }
  });
});

app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/invitations', invitationsRouter);
app.use('/api/filters', filtersRouter);
app.use('/api/reporter', reporterRouter);
app.use('/api/management', managementRouter);
app.use('/api/agent', agentRouter);

async function startServer() {
  try {
    const dbKey = process.env.CONFIG_DB_KEY;
    
    const keyValidation = validateKey(dbKey);
    if (!keyValidation.valid) {
      console.error('\n========================================');
      console.error(keyValidation.error);
      console.error('========================================');
      console.error('\nSetzen Sie die Umgebungsvariable:');
      console.error('  Windows: set CONFIG_DB_KEY=ihr-schluessel-min-32-zeichen');
      console.error('  Linux:   export CONFIG_DB_KEY=ihr-schluessel-min-32-zeichen');
      console.error('\nDer Schlüssel muss mindestens 32 Zeichen haben.\n');
      process.exit(1);
    }
    
    const config = getConfig();
    const configDbPath = join(__dirname, '..', config.database.sqlite.configDatabase);
    
    if (existsSync(configDbPath)) {
      try {
        console.log('\n========================================');
        console.log('Prüfe Config-Datenbank...');
        console.log('========================================\n');
        
        await migrate(configDbPath, dbKey);
      } catch (err) {
        console.log('Migration:', err.message);
      }
    }
    
    if (existsSync(configDbPath)) {
      const backupPath = createBackup(configDbPath);
      if (backupPath) {
        console.log(`Backup erstellt: ${backupPath}`);
      }
    }
    
    await initDB();
    console.log('Database initialized successfully');
    
    initEmailService();
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://0.0.0.0:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
