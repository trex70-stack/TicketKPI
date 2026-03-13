import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { extractClaims } from '../services/config.js';

export default function AuthCallback() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const idToken = params.get('id_token');
      const error = params.get('error');

      if (error) {
        setError(params.get('error_description') || error);
        return;
      }

      if (!idToken) {
        setError('Kein Token erhalten');
        return;
      }

      try {
        const payload = JSON.parse(atob(idToken.split('.')[1]));
        
        console.log('=== Azure AD Token Claims ===');
        console.log('Alle verfügbaren Claims:', Object.keys(payload));
        console.log('Payload:', payload);
        
        const claims = extractClaims(payload);
        console.log('Extrahierte Claims:', claims);
        console.log('============================');
        
        await login(
          claims.azureId,
          claims.email,
          claims.name,
          claims.kuerzel
        );

        navigate('/');
      } catch (err) {
        setError('Anmeldung fehlgeschlagen: ' + err.message);
      }
    };

    handleCallback();
  }, [login, navigate]);

  const containerStyle = {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--bg-primary)'
  };

  const messageStyle = {
    color: error ? '#dc2626' : 'var(--text-primary)',
    fontSize: '1rem'
  };

  return (
    <div style={containerStyle}>
      {error ? (
        <p style={messageStyle}>{error}</p>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <div className="animate-spin" style={{
            width: '40px',
            height: '40px',
            border: '3px solid #e5e7eb',
            borderTop: '3px solid #0ea5e9',
            borderRadius: '50%',
            margin: '0 auto 1rem'
          }}></div>
          <p style={messageStyle}>Anmeldung wird verarbeitet...</p>
        </div>
      )}
    </div>
  );
}
