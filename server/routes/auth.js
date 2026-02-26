import { Router } from 'express';
import { getConfigDB, saveConfigDB, getKpiDB } from '../db.js';

const router = Router();

router.get('/debug', async (req, res) => {
  try {
    const db = getConfigDB();
    const allUsers = await db.queryAll('SELECT * FROM users', []);
    res.json({ allUsers, count: allUsers.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { azureId, email, name } = req.body;
    
    if (!azureId || !email) {
      return res.status(400).json({ error: 'azureId and email are required' });
    }
    
    const db = getConfigDB();
    const allUsers = await db.queryAll('SELECT * FROM users', []);
    const usersByEmail = allUsers.filter(u => u.email === email);
    
    let user = null;
    if (usersByEmail.length > 0) {
      user = usersByEmail.find(u => u.role === 'admin') || usersByEmail[0];
    }
    
    if (!user) {
      user = await db.queryOne('SELECT * FROM users WHERE azure_id = ?', [azureId]);
    }
    
    if (!user) {
      const userName = name || email.split('@')[0];
      await db.run(`
        INSERT INTO users (azure_id, email, name, role)
        VALUES (?, ?, ?, 'standard')
      `, [azureId, email, userName]);
      saveConfigDB();
      
      user = await db.queryOne('SELECT * FROM users WHERE azure_id = ?', [azureId]);
    }
    
    res.json({
      id: user.id,
      azureId: user.azure_id,
      email: user.email,
      name: user.name,
      kuerzel: user.kuerzel,
      role: user.role
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/me', async (req, res) => {
  try {
    const azureId = req.headers['x-azure-id'];
    
    if (!azureId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const db = getConfigDB();
    const user = await db.queryOne('SELECT * FROM users WHERE azure_id = ?', [azureId]);
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    res.json({
      id: user.id,
      azureId: user.azure_id,
      email: user.email,
      name: user.name,
      kuerzel: user.kuerzel,
      role: user.role
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

export default router;
