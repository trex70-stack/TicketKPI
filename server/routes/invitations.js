import { Router } from 'express';
import { getConfigDB, getConfig } from '../db.js';
import { generateToken } from '../passwordUtils.js';
import { sendInvitationEmail, isEmailEnabled } from '../emailService.js';

const router = Router();

router.post('/invite', async (req, res) => {
  try {
    const { email, name, role, kuerzel } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'E-Mail erforderlich' });
    }
    
    const db = getConfigDB();
    
    const existingUser = await db.queryOne('SELECT * FROM users WHERE email = ?', [email]);
    
    if (existingUser) {
      return res.status(400).json({ error: 'Ein Benutzer mit dieser E-Mail existiert bereits' });
    }
    
    const invitationToken = generateToken();
    const invitationExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    
    await db.run(`
      INSERT INTO users (email, name, role, kuerzel, invitation_token, invitation_expires, password_set)
      VALUES (?, ?, ?, ?, ?, ?, 0)
    `, [email, name || email.split('@')[0], role || 'standard', kuerzel || null, invitationToken, invitationExpires]);
    
    const inviterName = req.headers['x-user-name'] || 'Administrator';
    
    if (isEmailEnabled()) {
      await sendInvitationEmail(email, invitationToken, inviterName);
      res.json({ 
        message: 'Einladung erfolgreich versendet',
        email,
        token: invitationToken
      });
    } else {
      const config = getConfig();
      const baseUrl = config.server?.baseUrl || 'http://localhost:5173';
      const inviteUrl = `${baseUrl}/set-password?token=${invitationToken}`;
      
      res.json({ 
        message: 'Einladung erstellt (E-Mail-Service nicht konfiguriert)',
        email,
        inviteUrl,
        token: invitationToken
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/resend/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const db = getConfigDB();
    
    const user = await db.queryOne('SELECT * FROM users WHERE id = ?', [userId]);
    
    if (!user) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden' });
    }
    
    if (user.password_set) {
      return res.status(400).json({ error: 'Benutzer hat bereits ein Passwort gesetzt' });
    }
    
    const invitationToken = generateToken();
    const invitationExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    
    await db.run(`
      UPDATE users 
      SET invitation_token = ?, invitation_expires = ?, updated_at = datetime("now")
      WHERE id = ?
    `, [invitationToken, invitationExpires, user.id]);
    
    const inviterName = req.headers['x-user-name'] || 'Administrator';
    
    if (isEmailEnabled()) {
      await sendInvitationEmail(user.email, invitationToken, inviterName);
      res.json({ message: 'Einladung erneut versendet' });
    } else {
      const config = getConfig();
      const baseUrl = config.server?.baseUrl || 'http://localhost:5173';
      const inviteUrl = `${baseUrl}/set-password?token=${invitationToken}`;
      
      res.json({ 
        message: 'Neuer Einladungs-Link generiert (E-Mail-Service nicht konfiguriert)',
        inviteUrl 
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/cancel/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const db = getConfigDB();
    
    const user = await db.queryOne('SELECT * FROM users WHERE id = ?', [userId]);
    
    if (!user) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden' });
    }
    
    if (user.password_set) {
      return res.status(400).json({ error: 'Kann keine Einladung für aktive Benutzer stornieren' });
    }
    
    await db.run('DELETE FROM users WHERE id = ?', [userId]);
    
    res.json({ message: 'Einladung storniert' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/pending', async (req, res) => {
  try {
    const db = getConfigDB();
    const pendingUsers = await db.queryAll(
      "SELECT id, email, name, role, kuerzel, invitation_expires, created_at FROM users WHERE password_set = 0 AND invitation_token IS NOT NULL",
      []
    );
    res.json(pendingUsers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
