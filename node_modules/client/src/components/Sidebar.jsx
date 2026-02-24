import { LayoutDashboard, User, Users, Moon, Sun, LogOut, Settings } from 'lucide-react';

export function Sidebar({ activeView, setActiveView, darkMode, setDarkMode, isAdmin, onLogout, availableViews }) {
  const asideStyle = {
    width: '256px',
    backgroundColor: 'var(--bg-secondary)',
    borderRight: '1px solid var(--border-color)',
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    flexShrink: 0
  };

  const headerStyle = {
    padding: '1.5rem',
    borderBottom: '1px solid var(--border-color)'
  };

  const titleStyle = {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: 'var(--text-primary)'
  };

  const subtitleStyle = {
    fontSize: '0.875rem',
    color: 'var(--text-secondary)',
    marginTop: '0.25rem'
  };

  const navStyle = {
    flex: 1,
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  };

  const footerStyle = {
    padding: '1rem',
    borderTop: '1px solid var(--border-color)',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  };

  const buttonStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    width: '100%',
    padding: '0.75rem 1rem',
    borderRadius: '0.5rem',
    color: 'var(--text-primary)',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  };

  const adminButtonStyle = {
    ...buttonStyle,
    color: 'var(--accent-primary)'
  };

  const getIcon = (id) => {
    switch (id) {
      case 'reporter': return User;
      case 'management': return LayoutDashboard;
      case 'agent': return Users;
      default: return User;
    }
  };

  return (
    <aside style={asideStyle}>
      <div style={headerStyle}>
        <h1 style={titleStyle}>Ticket KPIs</h1>
        <p style={subtitleStyle}>Dashboard</p>
      </div>

      <nav style={navStyle}>
        {availableViews.map((item) => {
          const Icon = getIcon(item.id);
          return (
            <div
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`sidebar-item ${activeView === item.id ? 'active' : ''}`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </div>
          );
        })}
      </nav>

      <div style={footerStyle}>
        {isAdmin && (
          <button
            onClick={() => window.location.href = '/admin'}
            style={adminButtonStyle}
          >
            <Settings size={20} />
            <span>Admin Panel</span>
          </button>
        )}
        <button
          onClick={() => setDarkMode(!darkMode)}
          style={buttonStyle}
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
        <button
          onClick={onLogout}
          style={buttonStyle}
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
