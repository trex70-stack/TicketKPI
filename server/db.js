import { readFileSync, existsSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let config = null;
let kpiConnection = null;
let configConnection = null;
let kpiType = 'sqlite';

function loadConfig() {
  const configPath = join(__dirname, 'database.config.json');
  if (existsSync(configPath)) {
    const configData = readFileSync(configPath, 'utf8');
    config = JSON.parse(configData);
  } else {
    config = {
      database: {
        kpiType: 'sqlite',
        sqlite: {
          kpiDatabase: './cedm_all_data.db',
          configDatabase: './config.db'
        },
        oracle: {
          user: '',
          password: '',
          connectString: '',
          kpiSchema: 'CEDM'
        }
      },
      server: { port: 3001 }
    };
  }
  return config;
}

export function getConfig() {
  if (!config) loadConfig();
  return config;
}

export function getDbType() {
  return kpiType;
}

// SQLite Implementation
class SQLiteConnection {
  constructor(dbPath, isConfig = false) {
    this.dbPath = dbPath;
    this.isConfig = isConfig;
    this.db = null;
    this.SQL = null;
  }

  async init(SQL) {
    this.SQL = SQL;
    if (existsSync(this.dbPath)) {
      const fileBuffer = readFileSync(this.dbPath);
      this.db = new this.SQL.Database(fileBuffer);
    } else if (this.isConfig) {
      this.db = new this.SQL.Database();
    } else {
      throw new Error(`Database file not found: ${this.dbPath}`);
    }
    return this;
  }

  queryOne(sql, params = []) {
    const stmt = this.db.prepare(sql);
    stmt.bind(params);
    let result = null;
    if (stmt.step()) result = stmt.getAsObject();
    stmt.free();
    return result;
  }

  queryAll(sql, params = []) {
    const stmt = this.db.prepare(sql);
    stmt.bind(params);
    const results = [];
    while (stmt.step()) results.push(stmt.getAsObject());
    stmt.free();
    return results;
  }

  run(sql, params = []) {
    this.db.run(sql, params);
    this.save();
  }

  save() {
    if (!this.db) return;
    const data = this.db.export();
    const buffer = Buffer.from(data);
    writeFileSync(this.dbPath, buffer);
  }

  close() {
    if (this.db) this.db.close();
  }
}

// Oracle Implementation
class OracleConnection {
  constructor(config) {
    this.config = config;
    this.connection = null;
    this.oracledb = null;
    this.schema = config.kpiSchema;
  }

  async init() {
    try {
      const oracledbModule = await import('oracledb');
      this.oracledb = oracledbModule.default || oracledbModule;
      
      if (!this.oracledb || typeof this.oracledb.getConnection !== 'function') {
        throw new Error('oracledb module not properly loaded. Make sure Oracle Instant Client is installed and in PATH.');
      }
      
      this.connection = await this.oracledb.getConnection({
        user: this.config.user,
        password: this.config.password,
        connectString: this.config.connectString
      });
      console.log(`Oracle connection established to schema: ${this.schema}`);
      return this;
    } catch (error) {
      console.error('Oracle connection error:', error.message);
      throw error;
    }
  }

  addSchemaPrefix(sql) {
    const tables = ['cs_ticket_ticket', 'cs_ticket_prot', 'angestellter', 'cs_ticket_type', 'cs_ticket_priority'];
    let result = sql;
    tables.forEach(table => {
      result = result.replace(new RegExp(`\\bFROM\\s+${table}\\b`, 'gi'), `FROM ${this.schema}.${table}`);
      result = result.replace(new RegExp(`\\bJOIN\\s+${table}\\b`, 'gi'), `JOIN ${this.schema}.${table}`);
    });
    return result;
  }

  convertParams(sql, params) {
    let index = 1;
    const convertedSql = sql.replace(/\?/g, () => `:${index++}`);
    const bindParams = {};
    params.forEach((val, i) => {
      bindParams[i + 1] = val;
    });
    return { sql: convertedSql, bindParams };
  }

  async queryOne(sql, params = []) {
    const results = await this.queryAll(sql, params);
    return results && results.length > 0 ? results[0] : null;
  }

  async queryAll(sql, params = []) {
    try {
      let fullSql = this.addSchemaPrefix(sql);
      const { sql: convertedSql, bindParams } = this.convertParams(fullSql, params);
      const result = await this.connection.execute(convertedSql, bindParams, {
        outFormat: this.oracledb.OUT_FORMAT_OBJECT
      });
      return result.rows || [];
    } catch (error) {
      console.error('Oracle queryAll error:', error.message);
      console.error('SQL:', sql);
      throw error;
    }
  }

  async run(sql, params = []) {
    try {
      let fullSql = this.addSchemaPrefix(sql);
      const { sql: convertedSql, bindParams } = this.convertParams(fullSql, params);
      await this.connection.execute(convertedSql, bindParams, { autoCommit: true });
    } catch (error) {
      console.error('Oracle run error:', error.message);
      throw error;
    }
  }

  async save() {}

  async close() {
    if (this.connection) {
      try { await this.connection.close(); } catch (e) {}
    }
  }
}

// Initialize database connections
export async function initDB() {
  loadConfig();
  kpiType = config.database.kpiType.toLowerCase();
  
  const initSqlJs = (await import('sql.js')).default;
  const SQL = await initSqlJs();
  
  // Config is always SQLite
  const configDbPath = join(__dirname, '..', config.database.sqlite.configDatabase);
  configConnection = new SQLiteConnection(configDbPath, true);
  await configConnection.init(SQL);
  initConfigTablesSQLite();
  
  // KPI can be SQLite or Oracle
  if (kpiType === 'sqlite') {
    console.log('Initializing SQLITE database connection...');
    const kpiDbPath = join(__dirname, '..', config.database.sqlite.kpiDatabase);
    kpiConnection = new SQLiteConnection(kpiDbPath, false);
    await kpiConnection.init(SQL);
    
  } else if (kpiType === 'oracle') {
    console.log('Initializing ORACLE database connection...');
    const oracleConfig = config.database.oracle;
    
    if (!oracleConfig.user || !oracleConfig.password || !oracleConfig.connectString) {
      throw new Error('Oracle connection parameters not configured');
    }
    
    kpiConnection = new OracleConnection(oracleConfig);
    await kpiConnection.init();
  }

  return { kpiConnection, configConnection };
}

function initConfigTablesSQLite() {
  // Create table if not exists with all columns
  configConnection.run(`
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
  `);
  
  // Add new columns if they don't exist
  const addColumnIfNotExists = (columnName, columnDef) => {
    try {
      configConnection.run(`ALTER TABLE users ADD COLUMN ${columnName} ${columnDef}`);
    } catch (e) {
      // Column already exists
    }
  };
  
  addColumnIfNotExists('kuerzel', 'TEXT');
  addColumnIfNotExists('password_hash', 'TEXT');
  addColumnIfNotExists('invitation_token', 'TEXT');
  addColumnIfNotExists('invitation_expires', 'TEXT');
  addColumnIfNotExists('password_set', 'INTEGER DEFAULT 0');
  addColumnIfNotExists('reset_token', 'TEXT');
  addColumnIfNotExists('reset_token_expires', 'TEXT');
  
  const defaultAdmin = configConnection.queryOne("SELECT * FROM users WHERE email = 'tk@contact.de'");
  if (!defaultAdmin) {
    configConnection.run(`
      INSERT INTO users (azure_id, email, name, role, password_set)
      VALUES ('default-admin', 'tk@contact.de', 'König, Thomas', 'admin', 1)
    `);
  }
}

export function getKpiDB() {
  if (!kpiConnection) throw new Error('KPI database not initialized');
  return kpiConnection;
}

export function getConfigDB() {
  if (!configConnection) throw new Error('Config database not initialized');
  return configConnection;
}

export function saveConfigDB() {
  if (configConnection) configConnection.save();
}

export function saveKpiDB() {
  if (kpiConnection) kpiConnection.save();
}

export function getDB() { return getKpiDB(); }
export function saveDB() { return saveKpiDB(); }

export default { 
  initDB, getKpiDB, getConfigDB, getDB, saveKpiDB, saveConfigDB, saveDB, getConfig, getDbType
};
