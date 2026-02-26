import { Router } from 'express';
import { getConfigDB, saveConfigDB, getDbType } from '../db.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const db = getConfigDB();
    const users = await db.queryAll('SELECT id, email, name, kuerzel, role, created_at FROM users ORDER BY name', []);
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const db = getConfigDB();
    const user = await db.queryOne('SELECT id, azure_id, email, name, kuerzel, role, created_at FROM users WHERE id = ?', [req.params.id]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    
    if (!['admin', 'management', 'standard'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be admin, management, or standard' });
    }
    
    const db = getConfigDB();
    const dbType = getDbType();
    
    if (dbType === 'oracle') {
      await db.run('UPDATE users SET role = ?, updated_at = SYSDATE WHERE id = ?', [role, req.params.id]);
    } else {
      await db.run('UPDATE users SET role = ?, updated_at = datetime("now") WHERE id = ?', [role, req.params.id]);
    }
    saveConfigDB();
    
    const user = await db.queryOne('SELECT id, email, name, kuerzel, role FROM users WHERE id = ?', [req.params.id]);
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id/kuerzel', async (req, res) => {
  try {
    const { kuerzel } = req.body;
    const db = getConfigDB();
    
    await db.run('UPDATE users SET kuerzel = ?, updated_at = datetime("now") WHERE id = ?', [kuerzel || null, req.params.id]);
    saveConfigDB();
    
    const user = await db.queryOne('SELECT id, email, name, kuerzel, role FROM users WHERE id = ?', [req.params.id]);
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, email, kuerzel } = req.body;
    const db = getConfigDB();
    const dbType = getDbType();
    
    const fields = [];
    const values = [];
    
    if (name !== undefined) {
      fields.push('name = ?');
      values.push(name);
    }
    if (email !== undefined) {
      fields.push('email = ?');
      values.push(email);
    }
    if (kuerzel !== undefined) {
      fields.push('kuerzel = ?');
      values.push(kuerzel || null);
    }
    
    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    if (dbType === 'oracle') {
      fields.push('updated_at = SYSDATE');
    } else {
      fields.push('updated_at = datetime("now")');
    }
    
    values.push(req.params.id);
    
    await db.run(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
    saveConfigDB();
    
    const user = await db.queryOne('SELECT id, email, name, kuerzel, role FROM users WHERE id = ?', [req.params.id]);
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { azure_id, email, name, kuerzel, role = 'standard' } = req.body;
    
    if (!email || !name) {
      return res.status(400).json({ error: 'Email and name are required' });
    }
    
    const db = getConfigDB();
    await db.run(
      'INSERT INTO users (azure_id, email, name, kuerzel, role) VALUES (?, ?, ?, ?, ?)',
      [azure_id || null, email, name, kuerzel || null, role]
    );
    saveConfigDB();
    
    const dbType = getDbType();
    let users;
    if (dbType === 'oracle') {
      users = await db.queryAll('SELECT id, azure_id, email, name, kuerzel, role FROM users WHERE id = (SELECT MAX(id) FROM users)', []);
    } else {
      users = await db.queryAll('SELECT id, azure_id, email, name, kuerzel, role FROM users ORDER BY id DESC LIMIT 1', []);
    }
    res.status(201).json(users[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const db = getConfigDB();
    const user = await db.queryOne('SELECT id FROM users WHERE id = ?', [req.params.id]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    await db.run('DELETE FROM users WHERE id = ?', [req.params.id]);
    saveConfigDB();
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
