import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const getApiBase = () => {
  const host = window.location.hostname;
  return `http://${host}:3001/api`;
};

export default function SetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
      validateToken(tokenParam);
    } else {
      setValidating(false);
      setError('Kein Token angegeben');
    }
  }, [searchParams]);

  const validateToken = async (tokenParam) => {
    try {
      const response = await fetch(`${getApiBase()}/auth/check-invitation/${tokenParam}`);
      const data = await response.json();
      
      if (response.ok && data.valid) {
        setTokenValid(true);
        setEmail(data.email);
        setName(data.name);
      } else {
        setError(data.error || 'Ungültiger Token');
      }
    } catch (err) {
      setError('Token-Überprüfung fehlgeschlagen');
    } finally {
      setValidating(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwörter stimmen nicht überein');
      return;
    }

    if (password.length < 8) {
      setError('Passwort muss mindestens 8 Zeichen haben');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${getApiBase()}/auth/set-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Passwort konnte nicht gesetzt werden');
      }

      navigate('/login', { state: { message: 'Passwort erfolgreich gesetzt. Bitte anmelden.' } });
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

  const buttonStyle = {
    width: '100%',
    padding: '0.75rem 1rem',
    backgroundColor: '#0284c7',
    color: 'white',
    border: 'none',
    borderRadius: '0.5rem',
    fontSize: '1rem',
    fontWeight: 500,
    cursor: 'pointer',
    marginTop: '1rem'
  };

  const errorStyle = {
    color: '#dc2626',
    fontSize: '0.875rem',
    textAlign: 'center',
    marginBottom: '1rem'
  };

  const passwordRequirementsStyle = {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
    marginBottom: '1rem',
    padding: '0.75rem',
    backgroundColor: 'var(--bg-primary)',
    borderRadius: '0.5rem'
  };

  if (validating) {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <p style={{ textAlign: 'center', color: 'var(--text-primary)' }}>Einladung wird überprüft...</p>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <h1 style={titleStyle}>Ungültige Einladung</h1>
          <p style={errorStyle}>{error}</p>
          <p style={{ textAlign: 'center' }}>
            <span style={{ color: '#0ea5e9', cursor: 'pointer' }} onClick={() => navigate('/login')}>
              Zur Anmeldung
            </span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <h1 style={titleStyle}>Passwort festlegen</h1>
        <p style={subtitleStyle}>
          Willkommen{name && `, ${name}`}!<br/>
          Bitte setzen Sie Ihr Passwort für {email}.
        </p>

        {error && <p style={errorStyle}>{error}</p>}

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="Passwort"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
            required
          />
          <input
            type="password"
            placeholder="Passwort bestätigen"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            style={inputStyle}
            required
          />
          
          <div style={passwordRequirementsStyle}>
            <strong>Passwortanforderungen:</strong>
            <ul style={{ margin: '0.5rem 0 0 1rem', padding: 0 }}>
              <li>Mindestens 8 Zeichen</li>
              <li>Mindestens ein Großbuchstabe</li>
              <li>Mindestens ein Kleinbuchstabe</li>
              <li>Mindestens eine Zahl</li>
              <li>Mindestens ein Sonderzeichen (!@#$%^&*...)</li>
            </ul>
          </div>

          <button 
            type="submit" 
            style={{ ...buttonStyle, backgroundColor: loading ? '#93c5fd' : '#0284c7' }}
            disabled={loading}
          >
            {loading ? 'Wird gespeichert...' : 'Passwort speichern'}
          </button>
        </form>
      </div>
    </div>
  );
}
