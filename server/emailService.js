import nodemailer from 'nodemailer';
import { getConfig } from './db.js';

let transporter = null;

export function initEmailService() {
  const config = getConfig();
  const emailConfig = config.email;

  if (!emailConfig || !emailConfig.enabled) {
    console.log('Email service disabled');
    return false;
  }

  transporter = nodemailer.createTransport({
    host: emailConfig.host,
    port: emailConfig.port,
    secure: emailConfig.secure,
    auth: {
      user: emailConfig.user,
      pass: emailConfig.password
    }
  });

  console.log('Email service initialized');
  return true;
}

export async function sendInvitationEmail(email, invitationToken, inviterName) {
  if (!transporter) {
    throw new Error('Email service not initialized');
  }

  const config = getConfig();
  const baseUrl = config.server?.baseUrl || 'http://localhost:5173';
  const inviteUrl = `${baseUrl}/set-password?token=${invitationToken}`;

  const mailOptions = {
    from: config.email.from,
    to: email,
    subject: 'Einladung zum Ticket KPI Dashboard',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0284c7;">Einladung zum Ticket KPI Dashboard</h2>
        <p>Hallo,</p>
        <p>Sie wurden von <strong>${inviterName}</strong> zum Ticket KPI Dashboard eingeladen.</p>
        <p>Um Ihr Konto zu aktivieren, klicken Sie bitte auf den folgenden Link und setzen Sie Ihr Passwort:</p>
        <p style="margin: 20px 0;">
          <a href="${inviteUrl}" style="background-color: #0284c7; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Passwort festlegen
          </a>
        </p>
        <p>Oder kopieren Sie diesen Link in Ihren Browser:</p>
        <p style="background-color: #f3f4f6; padding: 10px; border-radius: 5px; word-break: break-all;">
          ${inviteUrl}
        </p>
        <p>Dieser Link ist 7 Tage gültig.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #6b7280; font-size: 12px;">
          Falls Sie diese Einladung nicht erwartet haben, können Sie diese E-Mail ignorieren.
        </p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
  return true;
}

export async function sendPasswordResetEmail(email, resetToken) {
  if (!transporter) {
    throw new Error('Email service not initialized');
  }

  const config = getConfig();
  const baseUrl = config.server?.baseUrl || 'http://localhost:5173';
  const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: config.email.from,
    to: email,
    subject: 'Passwort zurücksetzen - Ticket KPI Dashboard',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0284c7;">Passwort zurücksetzen</h2>
        <p>Hallo,</p>
        <p>Sie haben eine Anfrage zum Zurücksetzen Ihres Passworts gestellt.</p>
        <p>Um ein neues Passwort festzulegen, klicken Sie bitte auf den folgenden Link:</p>
        <p style="margin: 20px 0;">
          <a href="${resetUrl}" style="background-color: #0284c7; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Passwort zurücksetzen
          </a>
        </p>
        <p>Oder kopieren Sie diesen Link in Ihren Browser:</p>
        <p style="background-color: #f3f4f6; padding: 10px; border-radius: 5px; word-break: break-all;">
          ${resetUrl}
        </p>
        <p>Dieser Link ist 1 Stunde gültig.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #6b7280; font-size: 12px;">
          Falls Sie diese Anfrage nicht gestellt haben, können Sie diese E-Mail ignorieren.
        </p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
  return true;
}

export function isEmailEnabled() {
  return transporter !== null;
}

export default { initEmailService, sendInvitationEmail, sendPasswordResetEmail, isEmailEnabled };
