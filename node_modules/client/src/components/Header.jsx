import { LayoutDashboard, User, Users, Moon, Sun, LogOut, Settings } from 'lucide-react';

export function Header({ activeView, setActiveView, darkMode, setDarkMode, isAdmin, onLogout, availableViews }) {
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
    gap: '0.5rem'
  };

  const buttonStyle = {
    padding: '0.5rem',
    borderRadius: '0.5rem',
    color: 'var(--text-secondary)',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer'
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
          <button
            onClick={() => setDarkMode(!darkMode)}
            style={buttonStyle}
            aria-label={darkMode ? 'Light Mode' : 'Dark Mode'}
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          {isAdmin && (
            <button
              onClick={() => window.location.href = '/admin'}
              style={buttonStyle}
              aria-label="Admin"
            >
              <Settings size={20} />
            </button>
          )}
          <button
            onClick={onLogout}
            style={buttonStyle}
            aria-label="Logout"
          >
            <LogOut size={20} />
          </button>
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
    </header>
  );
}
