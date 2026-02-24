import { Router } from 'express';
import { getDB, saveDB } from '../db.js';

const router = Router();

function queryOne(sql, params = []) {
  const db = getDB();
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
  const db = getDB();
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

router.get('/', (req, res) => {
  try {
    const users = queryAll('SELECT id, email, name, role, created_at FROM users ORDER BY name');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const user = queryOne('SELECT id, azure_id, email, name, role, created_at FROM users WHERE id = ?', [req.params.id]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id/role', (req, res) => {
  try {
    const { role } = req.body;
    
    if (!['admin', 'management', 'standard'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be admin, management, or standard' });
    }
    
    const db = getDB();
    db.run('UPDATE users SET role = ?, updated_at = datetime("now") WHERE id = ?', [role, req.params.id]);
    saveDB();
    
    const user = queryOne('SELECT id, email, name, role FROM users WHERE id = ?', [req.params.id]);
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', (req, res) => {
  try {
    const { azure_id, email, name, role = 'standard' } = req.body;
    
    if (!email || !name) {
      return res.status(400).json({ error: 'Email and name are required' });
    }
    
    const db = getDB();
    db.run(
      'INSERT INTO users (azure_id, email, name, role) VALUES (?, ?, ?, ?)',
      [azure_id || null, email, name, role]
    );
    saveDB();
    
    const users = queryAll('SELECT id, azure_id, email, name, role FROM users ORDER BY id DESC LIMIT 1');
    res.status(201).json(users[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const user = queryOne('SELECT id FROM users WHERE id = ?', [req.params.id]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const db = getDB();
    db.run('DELETE FROM users WHERE id = ?', [req.params.id]);
    saveDB();
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
