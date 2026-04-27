import { useState } from 'react';
import { getApiBase } from '../services/config.js';
import { LayoutDashboard, User, Users, Settings, ChevronLeft, ChevronRight, Shield, Moon, Sun, LogOut, Key, ChevronDown, ChevronUp, Kanban } from 'lucide-react';

export function Sidebar({ activeView, setActiveView, isAdmin, availableViews, darkMode, setDarkMode, onLogout }) {
  const [collapsed, setCollapsed] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const asideStyle = {
    width: collapsed ? '60px' : '256px',
    backgroundColor: 'var(--bg-secondary)',
    borderRight: '1px solid var(--border-color)',
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    flexShrink: 0,
    transition: 'width 0.2s ease',
    position: 'relative',
    overflow: 'visible'
  };

  const headerStyle = {
    padding: collapsed ? '1rem 0.5rem' : '1.5rem',
    borderBottom: '1px solid var(--border-color)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: collapsed ? 'center' : 'space-between',
    position: 'relative'
  };

  const titleStyle = {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    display: collapsed ? 'none' : 'block'
  };

  const subtitleStyle = {
    fontSize: '0.875rem',
    color: 'var(--text-secondary)',
    marginTop: '0.25rem',
    display: collapsed ? 'none' : 'block'
  };

  const toggleButtonStyle = {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    backgroundColor: 'var(--bg-tertiary)',
    border: '1px solid var(--border-color)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--text-secondary)',
    flexShrink: 0
  };

  const navStyle = {
    flex: 1,
    padding: collapsed ? '0.5rem' : '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    marginTop: collapsed ? '1rem' : 0
  };

  const footerStyle = {
    padding: collapsed ? '0.5rem' : '1rem',
    borderTop: '1px solid var(--border-color)',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem'
  };

  const buttonStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: collapsed ? 'center' : 'flex-start',
    gap: '0.75rem',
    width: '100%',
    padding: collapsed ? '0.75rem' : '0.75rem 1rem',
    borderRadius: '0.5rem',
    color: 'var(--text-primary)',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    whiteSpace: 'nowrap'
  };

  const adminButtonStyle = {
    ...buttonStyle,
    color: 'var(--accent-primary)'
  };

  const submenuStyle = {
    marginLeft: collapsed ? 0 : '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    overflow: 'hidden',
    maxHeight: showSettingsMenu ? '200px' : '0',
    transition: 'max-height 0.2s ease'
  };

  const submenuButtonStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: collapsed ? 'center' : 'flex-start',
    gap: '0.5rem',
    width: '100%',
    padding: collapsed ? '0.5rem' : '0.5rem 0.75rem',
    borderRadius: '0.375rem',
    color: 'var(--text-secondary)',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.875rem',
    whiteSpace: 'nowrap'
  };

  const getIcon = (id) => {
    switch (id) {
      case 'reporter': return User;
      case 'management': return LayoutDashboard;
      case 'agent': return Users;
      case 'kanban': return Kanban;
      default: return User;
    }
  };

  const iconOnlyStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  return (
    <aside style={asideStyle}>
      <div style={headerStyle}>
        <div style={iconOnlyStyle}>
          {collapsed ? (
            <LayoutDashboard size={24} style={{ color: 'var(--accent-primary)' }} />
          ) : (
            <div>
              <h1 style={titleStyle}>Ticket KPIs</h1>
              <p style={subtitleStyle}>Dashboard</p>
            </div>
          )}
        </div>
        <button 
          style={toggleButtonStyle} 
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? 'Sidebar aufklappen' : 'Sidebar einklappen'}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      <nav style={navStyle}>
        {availableViews.map((item) => {
          const Icon = getIcon(item.id);
          return (
            <div
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`sidebar-item ${activeView === item.id ? 'active' : ''}`}
              title={collapsed ? item.label : undefined}
              style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}
            >
              <Icon size={20} />
              {!collapsed && <span>{item.label}</span>}
            </div>
          );
        })}
      </nav>

      <div style={footerStyle}>
        {isAdmin && (
          <button
            onClick={() => setActiveView('admin')}
            style={{
              ...adminButtonStyle,
              backgroundColor: activeView === 'admin' ? 'var(--bg-accent)' : 'transparent'
            }}
            title={collapsed ? 'Admin Panel' : undefined}
          >
            <Shield size={20} />
            {!collapsed && <span>Admin Panel</span>}
          </button>
        )}
        <div>
          <button
            onClick={() => setShowSettingsMenu(!showSettingsMenu)}
            style={buttonStyle}
            title={collapsed ? 'Einstellungen' : undefined}
          >
            <Settings size={20} />
            {!collapsed && (
              <>
                <span style={{ flex: 1 }}>Einstellungen</span>
                {showSettingsMenu ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </>
            )}
          </button>
          {!collapsed && (
            <div style={submenuStyle}>
              <button
                onClick={() => setShowPasswordModal(true)}
                style={submenuButtonStyle}
              >
                <Key size={16} />
                <span>Passwort ändern</span>
              </button>
              <button
                onClick={() => setDarkMode(!darkMode)}
                style={submenuButtonStyle}
              >
                {darkMode ? <Sun size={16} /> : <Moon size={16} />}
                <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
              </button>
              <button
                onClick={onLogout}
                style={{ ...submenuButtonStyle, color: '#dc2626' }}
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {showPasswordModal && (
        <PasswordModal 
          onClose={() => setShowPasswordModal(false)} 
        />
      )}
    </aside>
  );
}

function PasswordModal({ onClose }) {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
