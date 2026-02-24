import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const [devMode, setDevMode] = useState(false);
  const [devEmail, setDevEmail] = useState('');
  const [error, setError] = useState('');

  const handleMicrosoftLogin = () => {
    const clientId = import.meta.env.VITE_AZURE_CLIENT_ID;
    const tenantId = import.meta.env.VITE_AZURE_TENANT_ID;
    const redirectUri = import.meta.env.VITE_AZURE_REDIRECT_URI || `${window.location.origin}/auth/callback`;

    if (!clientId || !tenantId) {
      setError('Azure AD ist nicht konfiguriert. Bitte verwenden Sie den Entwickler-Modus.');
      return;
    }

    const loginUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize` +
      `?client_id=${clientId}` +
      `&response_type=id_token` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=openid profile email` +
      `&response_mode=fragment` +
      `&nonce=default-nonce`;

    window.location.href = loginUrl;
  };

  const handleDevLogin = async (e) => {
    e.preventDefault();
    if (!devEmail) {
      setError('Bitte E-Mail eingeben');
      return;
    }

    try {
      await login(`dev-${Date.now()}`, devEmail, devEmail.split('@')[0]);
    } catch (err) {
      setError('Login fehlgeschlagen: ' + err.message);
    }
  };

  const containerStyle = {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--bg-primary)',
    padding: '1rem'
  };

  const cardStyle = {
    backgroundColor: 'var(--bg-secondary)',
    borderRadius: '0.75rem',
    padding: '2rem',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    maxWidth: '400px',
    width: '100%'
  };

  const titleStyle = {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
    textAlign: 'center',
    marginBottom: '0.5rem'
  };

  const subtitleStyle = {
    fontSize: '0.875rem',
    color: 'var(--text-secondary)',
    textAlign: 'center',
    marginBottom: '2rem'
  };

  const buttonStyle = {
    width: '100%',
    padding: '0.75rem 1rem',
    backgroundColor: '#0078d4',
    color: 'white',
    border: 'none',
    borderRadius: '0.5rem',
    fontSize: '1rem',
    fontWeight: 500,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem'
  };

  const inputStyle = {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid var(--border-color)',
    borderRadius: '0.5rem',
    fontSize: '0.875rem',
    backgroundColor: 'var(--bg-secondary)',
    color: 'var(--text-primary)',
    marginBottom: '0.75rem'
  };

  const errorStyle = {
    color: '#dc2626',
    fontSize: '0.875rem',
    textAlign: 'center',
    marginBottom: '1rem'
  };

  const linkStyle = {
    color: '#0ea5e9',
    cursor: 'pointer',
    fontSize: '0.875rem',
    textAlign: 'center',
    marginTop: '1rem'
  };

  const hintStyle = {
    color: 'var(--text-secondary)',
    fontSize: '0.75rem',
    textAlign: 'center',
    marginBottom: '1rem'
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <h1 style={titleStyle}>Ticket KPI Dashboard</h1>
        <p style={subtitleStyle}>Melden Sie sich mit Ihrem Microsoft-Konto an</p>

        {error && <p style={errorStyle}>{error}</p>}

        {!devMode ? (
          <>
            <button style={buttonStyle} onClick={handleMicrosoftLogin}>
              <svg width="20" height="20" viewBox="0 0 21 21" fill="none">
                <path d="M10.5 0H0V10.5H10.5V0Z" fill="#F25022"/>
                <path d="M21 0H10.5V10.5H21V0Z" fill="#7FBA00"/>
                <path d="M10.5 10.5H0V21H10.5V10.5Z" fill="#00A4EF"/>
                <path d="M21 10.5H10.5V21H21V10.5Z" fill="#FFB900"/>
              </svg>
              Mit Microsoft anmelden
            </button>
            <p style={linkStyle} onClick={() => setDevMode(true)}>
              Entwickler-Modus
            </p>
          </>
        ) : (
          <form onSubmit={handleDevLogin}>
            <p style={hintStyle}>Name wird automatisch aus der Datenbank geladen</p>
            <input
              type="email"
              placeholder="E-Mail (z.B. tk@contact.de)"
              value={devEmail}
              onChange={(e) => setDevEmail(e.target.value)}
              style={inputStyle}
            />
            <button type="submit" style={buttonStyle}>
              Anmelden
            </button>
            <p style={linkStyle} onClick={() => setDevMode(false)}>
              Zurück zu Microsoft Login
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
