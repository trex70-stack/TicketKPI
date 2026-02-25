import { Router } from 'express';
import { getConfigDB, saveConfigDB } from '../db.js';

const router = Router();

function queryOne(sql, params = []) {
  const db = getConfigDB();
  const stmt = db.prepare(sql);
  stmt.bind(params);
  let result = null;
  if (stmt.step()) {
    result = stmt.getAsObject();
  }
  stmt.free();
  return result;
}

function queryAll(sql, params = []) {
  const db = getConfigDB();
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

function run(sql, params = []) {
  const db = getConfigDB();
  db.run(sql, params);
  saveConfigDB();
}

router.get('/debug', (req, res) => {
  const allUsers = queryAll('SELECT * FROM users', []);
  res.json({ allUsers, count: allUsers.length });
});

router.post('/login', (req, res) => {
  const { azureId, email, name } = req.body;
  
  if (!azureId || !email) {
    return res.status(400).json({ error: 'azureId and email are required' });
  }
  
  const allUsers = queryAll('SELECT * FROM users', []);
  const usersByEmail = allUsers.filter(u => u.email === email);
  
  let user = null;
  if (usersByEmail.length > 0) {
    user = usersByEmail.find(u => u.role === 'admin') || usersByEmail[0];
  }
  
  if (!user) {
    user = queryOne('SELECT * FROM users WHERE azure_id = ?', [azureId]);
  }
  
  if (!user) {
    const userName = name || email.split('@')[0];
    run(`
      INSERT INTO users (azure_id, email, name, role)
      VALUES (?, ?, ?, 'standard')
    `, [azureId, email, userName]);
    
    user = queryOne('SELECT * FROM users WHERE azure_id = ?', [azureId]);
  }
  
  res.json({
    id: user.id,
    azureId: user.azure_id,
    email: user.email,
    name: user.name,
    role: user.role
  });
});

router.get('/me', (req, res) => {
  const azureId = req.headers['x-azure-id'];
  
  if (!azureId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  const user = queryOne('SELECT * FROM users WHERE azure_id = ?', [azureId]);
  
  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }
  
  res.json({
    id: user.id,
    azureId: user.azure_id,
    email: user.email,
    name: user.name,
    role: user.role
  });
});

router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

export default router;
