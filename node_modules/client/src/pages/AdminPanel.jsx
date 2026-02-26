import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Shield, User, Briefcase, Trash2, UserPlus, Pencil, X, Check, Sun, Moon } from 'lucide-react';

const getApiBase = () => {
  const host = window.location.hostname;
  return `http://${host}:3001/api`;
};

export default function AdminPanel() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'standard', kuerzel: '' });
  
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', kuerzel: '' });
  
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const loadUsers = async () => {
    try {
      const response = await fetch(`${getApiBase()}/users`);
      if (!response.ok) throw new Error('Failed to load users');
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const updateRole = async (userId, newRole) => {
    setError('');
    setSuccess('');
    try {
      const response = await fetch(`${getApiBase()}/users/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });
      if (!response.ok) throw new Error('Failed to update role');
      
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      setSuccess('Rolle erfolgreich geändert');
    } catch (err) {
      setError(err.message);
    }
  };

  const updateKuerzel = async (userId, newKuerzel) => {
    setError('');
    setSuccess('');
    try {
      const response = await fetch(`${getApiBase()}/users/${userId}/kuerzel`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kuerzel: newKuerzel })
      });
      if (!response.ok) throw new Error('Failed to update kuerzel');
      
      setUsers(users.map(u => u.id === userId ? { ...u, kuerzel: newKuerzel } : u));
      setSuccess('Kürzel erfolgreich geändert');
    } catch (err) {
      setError(err.message);
    }
  };

  const updateUser = async (userId, data) => {
    setError('');
    setSuccess('');
    try {
      const response = await fetch(`${getApiBase()}/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update user');
      
      setUsers(users.map(u => u.id === userId ? { ...u, ...data } : u));
      setEditingUser(null);
      setSuccess('Benutzer erfolgreich geändert');
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm('Benutzer wirklich löschen?')) return;
    
    setError('');
    setSuccess('');
    try {
      const response = await fetch(`${getApiBase()}/users/${userId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete user');
      
      setUsers(users.filter(u => u.id !== userId));
      setSuccess('Benutzer erfolgreich gelöscht');
    } catch (err) {
      setError(err.message);
    }
  };

  const addUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!newUser.name || !newUser.email) {
      setError('Name und E-Mail sind erforderlich');
      return;
    }

    try {
      const response = await fetch(`${getApiBase()}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create user');
      }
      
      const createdUser = await response.json();
      setUsers([...users, createdUser]);
      setNewUser({ name: '', email: '', role: 'standard', kuerzel: '' });
      setShowAddForm(false);
      setSuccess('Benutzer erfolgreich angelegt');
    } catch (err) {
      setError(err.message);
    }
  };

  const startEdit = (u) => {
    setEditingUser(u.id);
    setEditForm({ name: u.name, email: u.email, kuerzel: u.kuerzel || '' });
  };

  const cancelEdit = () => {
    setEditingUser(null);
    setEditForm({ name: '', email: '', kuerzel: '' });
  };

  const saveEdit = (userId) => {
    updateUser(userId, editForm);
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin': return <Shield size={16} style={{ color: '#dc2626' }} />;
      case 'management': return <Briefcase size={16} style={{ color: '#2563eb' }} />;
      default: return <User size={16} style={{ color: '#6b7280' }} />;
    }
  };

  const containerStyle = {
    minHeight: '100vh',
    backgroundColor: 'var(--bg-primary)',
    padding: '1.5rem'
  };

  const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '1.5rem'
  };

  const headerLeftStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  };

  const backButtonStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--text-secondary)',
    fontSize: '0.875rem',
    padding: '0.5rem'
  };

  const titleStyle = {
    fontSize: '1.5rem',
    fontWeight: 600,
    color: 'var(--text-primary)'
  };

  const headerRightStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  };

  const darkModeButtonStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    border: '1px solid var(--border-color)',
    backgroundColor: 'var(--bg-secondary)',
    color: 'var(--text-primary)',
    cursor: 'pointer'
  };

  const addButtonStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1rem',
    backgroundColor: 'var(--accent-primary)',
    color: 'white',
    border: 'none',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: 500
  };

  const tableContainerStyle = {
    backgroundColor: 'var(--bg-secondary)',
    borderRadius: '0.75rem',
    padding: '1.5rem',
    overflow: 'auto'
  };

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse'
  };

  const thStyle = {
    textAlign: 'left',
    padding: '0.75rem',
    borderBottom: '1px solid var(--border-color)',
    color: 'var(--text-secondary)',
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  };

  const tdStyle = {
    padding: '0.75rem',
    borderBottom: '1px solid var(--border-color)',
    color: 'var(--text-primary)',
    fontSize: '0.875rem'
  };

  const selectStyle = {
    padding: '0.5rem',
    borderRadius: '0.375rem',
    border: '1px solid var(--border-color)',
    backgroundColor: 'var(--bg-secondary)',
    color: 'var(--text-primary)',
    fontSize: '0.875rem'
  };

  const iconButtonStyle = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--text-secondary)',
    padding: '0.25rem',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  const errorStyle = {
    color: darkMode ? '#fca5a5' : '#dc2626',
    fontSize: '0.875rem',
    marginBottom: '1rem',
    padding: '0.75rem',
    backgroundColor: darkMode ? 'rgba(220, 38, 38, 0.2)' : '#fef2f2',
    border: darkMode ? '1px solid rgba(220, 38, 38, 0.3)' : 'none',
    borderRadius: '0.5rem'
  };

  const successStyle = {
    color: darkMode ? '#6ee7b7' : '#059669',
    fontSize: '0.875rem',
    marginBottom: '1rem',
    padding: '0.75rem',
    backgroundColor: darkMode ? 'rgba(5, 150, 105, 0.2)' : '#ecfdf5',
    border: darkMode ? '1px solid rgba(5, 150, 105, 0.3)' : 'none',
    borderRadius: '0.5rem'
  };

  const currentUserStyle = {
    backgroundColor: 'var(--bg-accent)',
    padding: '0.75rem',
    borderRadius: '0.5rem'
  };

  const formContainerStyle = {
    backgroundColor: 'var(--bg-secondary)',
    borderRadius: '0.75rem',
    padding: '1.5rem',
    marginBottom: '1rem'
  };

  const formRowStyle = {
    display: 'flex',
    gap: '1rem',
    flexWrap: 'wrap',
    marginBottom: '1rem'
  };

  const inputStyle = {
    flex: 1,
    minWidth: '200px',
    padding: '0.75rem',
    borderRadius: '0.375rem',
    border: '1px solid var(--border-color)',
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    fontSize: '0.875rem'
  };

  const smallInputStyle = {
    padding: '0.5rem',
    borderRadius: '0.375rem',
    border: '1px solid var(--border-color)',
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    fontSize: '0.875rem',
    minWidth: '100px'
  };

  const formActionsStyle = {
    display: 'flex',
    gap: '0.5rem',
    justifyContent: 'flex-end'
  };

  const cancelButtonStyle = {
    padding: '0.75rem 1rem',
    backgroundColor: 'transparent',
    color: 'var(--text-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    fontSize: '0.875rem'
  };

  const submitButtonStyle = {
    padding: '0.75rem 1rem',
    backgroundColor: 'var(--accent-primary)',
    color: 'white',
    border: 'none',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: 500
  };

  if (loading) {
    return (
      <div style={containerStyle}>
        <p style={{ color: 'var(--text-primary)' }}>Laden...</p>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <div style={headerLeftStyle}>
          <button style={backButtonStyle} onClick={() => navigate('/')}>
            <ArrowLeft size={20} />
            Zurück
          </button>
          <h1 style={titleStyle}>Benutzerverwaltung</h1>
        </div>
        <div style={headerRightStyle}>
          <button 
            style={darkModeButtonStyle} 
            onClick={() => setDarkMode(!darkMode)}
            title={darkMode ? 'Light Mode' : 'Dark Mode'}
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button style={addButtonStyle} onClick={() => setShowAddForm(!showAddForm)}>
            <UserPlus size={18} />
            Neuer Benutzer
          </button>
        </div>
      </div>

      {error && <div style={errorStyle}>{error}</div>}
      {success && <div style={successStyle}>{success}</div>}

      {showAddForm && (
        <div style={formContainerStyle}>
          <h3 style={{ margin: '0 0 1rem 0', color: 'var(--text-primary)', fontSize: '1rem' }}>Neuen Benutzer anlegen</h3>
          <form onSubmit={addUser}>
            <div style={formRowStyle}>
              <input
                type="text"
                placeholder="Name (z.B. Müller, Max)"
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                style={inputStyle}
              />
              <input
                type="email"
                placeholder="E-Mail (z.B. mm@contact.de)"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                style={inputStyle}
              />
              <input
                type="text"
                placeholder="Kürzel (z.B. MM)"
                value={newUser.kuerzel}
                onChange={(e) => setNewUser({ ...newUser, kuerzel: e.target.value })}
                style={{ ...inputStyle, minWidth: '100px', maxWidth: '120px' }}
              />
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                style={{ ...selectStyle, minWidth: '150px' }}
              >
                <option value="standard">Standard User</option>
                <option value="management">Management</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
            <div style={formActionsStyle}>
              <button type="button" style={cancelButtonStyle} onClick={() => {
                setShowAddForm(false);
                setNewUser({ name: '', email: '', role: 'standard', kuerzel: '' });
              }}>
                Abbrechen
              </button>
              <button type="submit" style={submitButtonStyle}>
                Anlegen
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={tableContainerStyle}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>E-Mail</th>
              <th style={thStyle}>Kürzel</th>
              <th style={thStyle}>Rolle</th>
              <th style={thStyle}>Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} style={u.id === user?.id ? currentUserStyle : {}}>
                <td style={tdStyle}>
                  {editingUser === u.id ? (
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      style={smallInputStyle}
                    />
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {getRoleIcon(u.role)}
                      {u.name}
                      {u.id === user?.id && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--accent-primary)' }}>(Du)</span>
                      )}
                    </div>
                  )}
                </td>
                <td style={tdStyle}>
                  {editingUser === u.id ? (
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      style={smallInputStyle}
                    />
                  ) : (
                    u.email
                  )}
                </td>
                <td style={tdStyle}>
                  {editingUser === u.id ? (
                    <input
                      type="text"
                      value={editForm.kuerzel}
                      onChange={(e) => setEditForm({ ...editForm, kuerzel: e.target.value })}
                      placeholder="z.B. MM"
                      style={{ ...smallInputStyle, minWidth: '60px', maxWidth: '80px' }}
                    />
                  ) : (
                    <input
                      type="text"
                      value={u.kuerzel || ''}
                      onChange={(e) => updateKuerzel(u.id, e.target.value)}
                      placeholder="z.B. MM"
                      style={{ ...smallInputStyle, minWidth: '60px', maxWidth: '80px' }}
                      disabled
                    />
                  )}
                </td>
                <td style={tdStyle}>
                  <select
                    value={u.role}
                    onChange={(e) => updateRole(u.id, e.target.value)}
                    style={selectStyle}
                    disabled={u.id === user?.id}
                  >
                    <option value="standard">Standard User</option>
                    <option value="management">Management</option>
                    <option value="admin">Administrator</option>
                  </select>
                </td>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {editingUser === u.id ? (
                      <>
                        <button 
                          style={{ ...iconButtonStyle, color: '#22c55e' }}
                          onClick={() => saveEdit(u.id)}
                          title="Speichern"
                        >
                          <Check size={16} />
                        </button>
                        <button 
                          style={{ ...iconButtonStyle, color: '#dc2626' }}
                          onClick={cancelEdit}
                          title="Abbrechen"
                        >
                          <X size={16} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button 
                          style={iconButtonStyle}
                          onClick={() => startEdit(u)}
                          title="Bearbeiten"
                        >
                          <Pencil size={16} />
                        </button>
                        {u.id !== user?.id && u.email !== 'tk@contact.de' && (
                          <button 
                            style={{ ...iconButtonStyle, color: '#dc2626' }}
                            onClick={() => deleteUser(u.id)}
                            title="Löschen"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ marginTop: '1.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          <p><strong>Rollen:</strong></p>
          <ul style={{ margin: '0.5rem 0 0 1rem' }}>
            <li><Shield size={12} style={{ display: 'inline', marginRight: '0.25rem' }} /> <strong>Administrator:</strong> Kann Rollen vergeben, alle Dashboards sehen</li>
            <li><Briefcase size={12} style={{ display: 'inline', marginRight: '0.25rem' }} /> <strong>Management:</strong> Kann Management-Dashboard sehen</li>
            <li><User size={12} style={{ display: 'inline', marginRight: '0.25rem' }} /> <strong>Standard User:</strong> Nur eigene Dashboards (Reporter/Agent)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
