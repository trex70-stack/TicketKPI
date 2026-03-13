import { Router } from 'express';
import { getConfigDB } from '../db.js';
import { hashPassword, verifyPassword, validatePassword, generateToken } from '../passwordUtils.js';
import { sendInvitationEmail, sendPasswordResetEmail, isEmailEnabled } from '../emailService.js';

const router = Router();

router.get('/debug', async (req, res) => {
  try {
    const db = getConfigDB();
    const allUsers = await db.queryAll('SELECT id, email, name, kuerzel, role, password_set, created_at FROM users', []);
    res.json({ allUsers, count: allUsers.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { azureId, email, name, kuerzel, password } = req.body;
    
    const db = getConfigDB();
    
    // Azure AD login
    if (azureId && email && !password) {
      let user = await db.queryOne('SELECT * FROM users WHERE email = ?', [email]);
      
      if (!user) {
        user = await db.queryOne('SELECT * FROM users WHERE azure_id = ?', [azureId]);
      }
      
      if (!user) {
        const userName = name || email.split('@')[0];
        const userKuerzel = kuerzel || null;
        await db.run(`
          INSERT INTO users (azure_id, email, name, kuerzel, role, password_set)
          VALUES (?, ?, ?, ?, 'standard', 1)
        `, [azureId, email, userName, userKuerzel]);
        user = await db.queryOne('SELECT * FROM users WHERE azure_id = ?', [azureId]);
      }
      
      return res.json({
        id: user.id,
        azureId: user.azure_id,
        email: user.email,
        name: user.name,
        kuerzel: user.kuerzel,
        role: user.role
      });
    }
    
    // Password login
    if (email && password) {
      const user = await db.queryOne('SELECT * FROM users WHERE email = ?', [email]);
      
      if (!user) {
        return res.status(401).json({ error: 'Ungültige Anmeldedaten' });
      }
      
      if (!user.password_set || !user.password_hash) {
        return res.status(401).json({ error: 'Bitte setzen Sie zuerst Ihr Passwort über den Einladungslink' });
      }
      
      const validPassword = await verifyPassword(password, user.password_hash);
      if (!validPassword) {
        return res.status(401).json({ error: 'Ungültige Anmeldedaten' });
      }
      
      return res.json({
        id: user.id,
        azureId: user.azure_id,
        email: user.email,
        name: user.name,
        kuerzel: user.kuerzel,
        role: user.role
      });
    }
    
    return res.status(400).json({ error: 'Ungültige Anmeldedaten' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/me', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const azureId = req.headers['x-azure-id'];
    
    const db = getConfigDB();
    let user = null;
    
    if (userId) {
      user = await db.queryOne('SELECT * FROM users WHERE id = ?', [userId]);
    } else if (azureId) {
      user = await db.queryOne('SELECT * FROM users WHERE azure_id = ?', [azureId]);
    }
    
    if (!user) {
      return res.status(401).json({ error: 'Not authenticated' });
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

router.post('/set-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    
    if (!token || !password) {
      return res.status(400).json({ error: 'Token und Passwort erforderlich' });
    }
    
    const validation = validatePassword(password);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.errors.join(', ') });
    }
    
    const db = getConfigDB();
    const user = await db.queryOne(
      'SELECT * FROM users WHERE invitation_token = ?',
      [token]
    );
    
    if (!user) {
      return res.status(400).json({ error: 'Ungültiger oder abgelaufener Token' });
    }
    
    const now = new Date();
    const expires = user.invitation_expires ? new Date(user.invitation_expires) : null;
    
    if (expires && now > expires) {
      return res.status(400).json({ error: 'Einladung ist abgelaufen' });
    }
    
    const passwordHash = await hashPassword(password);
    
    await db.run(`
      UPDATE users 
      SET password_hash = ?, password_set = 1, invitation_token = NULL, invitation_expires = NULL, updated_at = datetime("now")
      WHERE id = ?
    `, [passwordHash, user.id]);
    
    res.json({ 
      message: 'Passwort erfolgreich gesetzt',
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/check-invitation/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const db = getConfigDB();
    
    const user = await db.queryOne(
      'SELECT id, email, name, invitation_expires FROM users WHERE invitation_token = ?',
      [token]
    );
    
    if (!user) {
      return res.status(400).json({ valid: false, error: 'Ungültiger Token' });
    }
    
    const now = new Date();
    const expires = user.invitation_expires ? new Date(user.invitation_expires) : null;
    
    if (expires && now > expires) {
      return res.status(400).json({ valid: false, error: 'Einladung ist abgelaufen' });
    }
    
    res.json({ 
      valid: true, 
      email: user.email,
      name: user.name
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/request-password-reset', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'E-Mail erforderlich' });
    }
    
    const db = getConfigDB();
    const user = await db.queryOne('SELECT * FROM users WHERE email = ?', [email]);
    
    if (!user) {
      return res.json({ message: 'Falls die E-Mail existiert, wurde eine Reset-Mail versendet' });
    }
    
    if (!isEmailEnabled()) {
      return res.status(400).json({ error: 'E-Mail-Service nicht konfiguriert' });
    }
    
    const resetToken = generateToken();
    const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    
    await db.run(`
      UPDATE users 
      SET reset_token = ?, reset_token_expires = ?, updated_at = datetime("now")
      WHERE id = ?
    `, [resetToken, expires, user.id]);
    
    await sendPasswordResetEmail(email, resetToken);
    
    res.json({ message: 'Falls die E-Mail existiert, wurde eine Reset-Mail versendet' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    
    if (!token || !password) {
      return res.status(400).json({ error: 'Token und Passwort erforderlich' });
    }
    
    const validation = validatePassword(password);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.errors.join(', ') });
    }
    
    const db = getConfigDB();
    const user = await db.queryOne(
      'SELECT * FROM users WHERE reset_token = ?',
      [token]
    );
    
    if (!user) {
      return res.status(400).json({ error: 'Ungültiger oder abgelaufener Token' });
    }
    
    const now = new Date();
    const expires = user.reset_token_expires ? new Date(user.reset_token_expires) : null;
    
    if (expires && now > expires) {
      return res.status(400).json({ error: 'Reset-Token ist abgelaufen' });
    }
    
    const passwordHash = await hashPassword(password);
    
    await db.run(`
      UPDATE users 
      SET password_hash = ?, password_set = 1, reset_token = NULL, reset_token_expires = NULL, updated_at = datetime("now")
      WHERE id = ?
    `, [passwordHash, user.id]);
    
    res.json({ message: 'Passwort erfolgreich zurückgesetzt' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/change-password', async (req, res) => {
  try {
    const { userId, currentPassword, newPassword } = req.body;
    
    if (!userId || !currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Alle Felder erforderlich' });
    }
    
    const validation = validatePassword(newPassword);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.errors.join(', ') });
    }
    
    const db = getConfigDB();
    const user = await db.queryOne('SELECT * FROM users WHERE id = ?', [userId]);
    
    if (!user) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden' });
    }
    
    if (!user.password_hash) {
      return res.status(400).json({ error: 'Kein Passwort gesetzt' });
    }
    
    const validPassword = await verifyPassword(currentPassword, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Aktuelles Passwort falsch' });
    }
    
    const passwordHash = await hashPassword(newPassword);
    
    await db.run(`
      UPDATE users 
      SET password_hash = ?, updated_at = datetime("now")
      WHERE id = ?
    `, [passwordHash, user.id]);
    
    res.json({ message: 'Passwort erfolgreich geändert' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
