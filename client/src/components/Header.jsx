import { useState } from 'react';
import { LayoutDashboard, User, Users, Settings, Shield, Moon, Sun, LogOut, Key, ChevronDown, ChevronUp } from 'lucide-react';

export function Header({ activeView, setActiveView, isAdmin, availableViews, darkMode, setDarkMode, onLogout }) {
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const headerStyle = {
    backgroundColor: 'var(--bg-secondary)',
    borderBottom: '1px solid var(--border-color)',
    position: 'sticky',
    top: 0,
    zIndex: 10
  };

  const topRowStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.75rem 1rem'
  };

  const titleStyle = {
    fontSize: '1.125rem',
    fontWeight: 700,
    color: 'var(--text-primary)'
  };

  const buttonGroupStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    position: 'relative'
  };

  const buttonStyle = {
    padding: '0.5rem',
    borderRadius: '0.5rem',
    color: 'var(--text-secondary)',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer'
  };

  const dropdownStyle = {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: '0.5rem',
    backgroundColor: 'var(--bg-secondary)',
    borderRadius: '0.5rem',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    minWidth: '160px',
    overflow: 'hidden',
    display: showSettingsMenu ? 'block' : 'none',
    zIndex: 20
  };

  const dropdownItemStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    width: '100%',
    padding: '0.75rem 1rem',
    color: 'var(--text-primary)',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.875rem',
    textAlign: 'left'
  };

  const navStyle = {
    display: 'flex',
    borderTop: '1px solid var(--border-color)'
  };

  const navItemStyle = (isActive) => ({
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.25rem',
    padding: '0.75rem 0.5rem',
    fontSize: '0.875rem',
    fontWeight: 500,
    cursor: 'pointer',
    backgroundColor: isActive ? 'var(--bg-accent)' : 'transparent',
    color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
    borderBottom: isActive ? '2px solid var(--accent-primary)' : 'none',
    border: 'none'
  });

  const navLabelStyle = {
    fontSize: '0.75rem'
  };

  return (
    <header style={headerStyle}>
      <div style={topRowStyle}>
        <h1 style={titleStyle}>Ticket KPIs</h1>
        <div style={buttonGroupStyle}>
          {isAdmin && (
            <button
              onClick={() => setActiveView('admin')}
              style={{ 
                ...buttonStyle, 
                color: activeView === 'admin' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                backgroundColor: activeView === 'admin' ? 'var(--bg-accent)' : 'transparent'
              }}
              aria-label="Admin"
            >
              <Shield size={20} />
            </button>
          )}
          <button
            onClick={() => setShowSettingsMenu(!showSettingsMenu)}
            style={buttonStyle}
            aria-label="Einstellungen"
          >
            <Settings size={20} />
            {showSettingsMenu ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <div style={dropdownStyle}>
            <div style={dropdownItemStyle} onClick={() => { setShowPasswordModal(true); setShowSettingsMenu(false); }}>
              <Key size={18} />
              Passwort ändern
            </div>
            <div style={dropdownItemStyle} onClick={() => setDarkMode(!darkMode)}>
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
              {darkMode ? ' Light Mode' : ' Dark Mode'}
            </div>
            <div style={{ ...dropdownItemStyle, color: '#dc2626' }} onClick={onLogout}>
              <LogOut size={18} />
              Logout
            </div>
          </div>
        </div>
      </div>
      
      <nav style={navStyle}>
        {availableViews.map((item) => {
          const Icon = item.id === 'reporter' ? User : item.id === 'management' ? LayoutDashboard : Users;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              style={navItemStyle(isActive)}
            >
              <Icon size={20} />
              <span style={navLabelStyle}>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {showPasswordModal && (
        <PasswordModal onClose={() => setShowPasswordModal(false)} />
      )}
    </header>
  );
}

const dropdownStyle = {
  position: 'absolute',
  top: '100%',
  right: 0,
  backgroundColor: 'var(--bg-secondary)',
  border: '1px solid var(--border-color)',
  borderRadius: '0.5rem',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  minWidth: '160px',
  overflow: 'hidden',
  display: 'var(--dropdown-display, none)',
  zIndex: 20
};

function PasswordModal({ onClose }) {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const getApiBase = () => {
    const host = window.location.hostname;
    return `http://${host}:3001/api`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (form.newPassword !== form.confirmPassword) {
      setError('Neue Passwörter stimmen nicht überein');
      return;
    }
    
    if (form.newPassword.length < 8) {
      setError('Passwort muss mindestens 8 Zeichen haben');
      return;
    }
    
    const userId = JSON.parse(localStorage.getItem('user') || '{}')?.id;
    if (!userId) {
      setError('Benutzer nicht gefunden');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch(`${getApiBase()}/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          currentPassword: form.currentPassword,
          newPassword: form.newPassword
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Passwort konnte nicht geändert werden');
      }
      
      setSuccess('Passwort erfolgreich geändert');
      setTimeout(() => onClose(), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '0.75rem',
    borderRadius: '0.375rem',
    border: '1px solid var(--border-color)',
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    fontSize: '0.875rem',
    marginBottom: '0.75rem'
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: '0.75rem',
        padding: '1.5rem',
        width: '100%',
        maxWidth: '400px',
        margin: '1rem'
      }}>
        <h3 style={{ margin: '0 0 1rem 0', color: 'var(--text-primary)', fontSize: '1.125rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Key size={20} />
          Passwort ändern
        </h3>
        {error && <div style={{ color: '#dc2626', fontSize: '0.875rem', marginBottom: '1rem' }}>{error}</div>}
        {success && <div style={{ color: '#059669', fontSize: '0.875rem', marginBottom: '1rem' }}>{success}</div>}
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="Aktuelles Passwort"
            value={form.currentPassword}
            onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
            style={inputStyle}
            required
          />
          <input
            type="password"
            placeholder="Neues Passwort (mind. 8 Zeichen)"
            value={form.newPassword}
            onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
            style={inputStyle}
            required
            minLength={8}
          />
          <input
            type="password"
            placeholder="Passwort bestätigen"
            value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            style={{ ...inputStyle, marginBottom: '1rem' }}
            required
          />
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <button 
              type="button" 
              onClick={onClose}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                border: '1px solid var(--border-color)',
                backgroundColor: 'transparent',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}
            >
              Abbrechen
            </button>
            <button 
              type="submit" 
              disabled={loading}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                border: 'none',
                backgroundColor: 'var(--accent-primary)',
                color: 'white',
                cursor: 'pointer',
                fontSize: '0.875rem',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? 'Speichern...' : 'Ändern'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
