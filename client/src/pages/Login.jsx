import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getApiBase } from '../services/config.js';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loginMode, setLoginMode] = useState('microsoft');
  const [devEmail, setDevEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleMicrosoftLogin = () => {
    const clientId = import.meta.env.VITE_AZURE_CLIENT_ID;
    const tenantId = import.meta.env.VITE_AZURE_TENANT_ID;
    const redirectUri = import.meta.env.VITE_AZURE_REDIRECT_URI || `${window.location.origin}/auth/callback`;

    if (!clientId || !tenantId) {
      setError('Azure AD ist nicht konfiguriert. Bitte verwenden Sie die Passwort-Anmeldung.');
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

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    if (!devEmail || !password) {
      setError('Bitte E-Mail und Passwort eingeben');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${getApiBase()}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: devEmail, password })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Anmeldung fehlgeschlagen');
      }

      const userData = await response.json();
      localStorage.setItem('user', JSON.stringify(userData));
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
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
    marginBottom: '1.5rem'
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
    gap: '0.5rem',
    marginBottom: '0.75rem'
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
    marginTop: '0.75rem'
  };

  const tabContainerStyle = {
    display: 'flex',
    marginBottom: '1.5rem',
    borderBottom: '1px solid var(--border-color)'
  };

  const tabStyle = (active) => ({
    flex: 1,
    padding: '0.75rem',
    textAlign: 'center',
    cursor: 'pointer',
    borderBottom: active ? '2px solid #0078d4' : 'none',
    color: active ? '#0078d4' : 'var(--text-secondary)',
    fontWeight: active ? 600 : 400
  });

  const passwordButtonStyle = {
    ...buttonStyle,
    backgroundColor: loading ? '#93c5fd' : '#0284c7'
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <h1 style={titleStyle}>Ticket KPI Dashboard</h1>
        <p style={subtitleStyle}>Melden Sie sich an</p>

        {error && <p style={errorStyle}>{error}</p>}

        <div style={tabContainerStyle}>
          <div 
            style={tabStyle(loginMode === 'microsoft')} 
            onClick={() => { setLoginMode('microsoft'); setError(''); }}
          >
            Microsoft
          </div>
          <div 
            style={tabStyle(loginMode === 'password')} 
            onClick={() => { setLoginMode('password'); setError(''); }}
          >
            Passwort
          </div>
        </div>

        {loginMode === 'microsoft' ? (
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
            <p style={{ ...linkStyle, marginTop: '1rem' }} onClick={() => setLoginMode('password')}>
              Passwort-Anmeldung verwenden
            </p>
          </>
        ) : (
          <form onSubmit={handlePasswordLogin}>
            <input
              type="email"
              placeholder="E-Mail"
              value={devEmail}
              onChange={(e) => setDevEmail(e.target.value)}
              style={inputStyle}
              required
            />
            <input
              type="password"
              placeholder="Passwort"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
              required
            />
            <button 
              type="submit" 
              style={passwordButtonStyle}
              disabled={loading}
            >
              {loading ? 'Anmeldung...' : 'Anmelden'}
            </button>
            <p style={linkStyle} onClick={() => setLoginMode('microsoft')}>
              Mit Microsoft anmelden
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
