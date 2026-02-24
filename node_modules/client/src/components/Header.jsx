import { LayoutDashboard, User, Users, Moon, Sun } from 'lucide-react';

const navItems = [
  { id: 'reporter', label: 'Reporter', icon: User },
  { id: 'management', label: 'Management', icon: LayoutDashboard },
  { id: 'agent', label: 'Agent', icon: Users },
];

export function Header({ activeView, setActiveView, darkMode, setDarkMode, isMobile }) {
  if (!isMobile) return null;

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
    backgroundColor: isActive ? '#e0f2fe' : 'transparent',
    color: isActive ? '#0284c7' : 'var(--text-secondary)',
    borderBottom: isActive ? '2px solid #0ea5e9' : 'none',
    border: 'none'
  });

  const navLabelStyle = {
    fontSize: '0.75rem'
  };

  return (
    <header style={headerStyle}>
      <div style={topRowStyle}>
        <h1 style={titleStyle}>Ticket KPIs</h1>
        <button
          onClick={() => setDarkMode(!darkMode)}
          style={buttonStyle}
          aria-label={darkMode ? 'Light Mode' : 'Dark Mode'}
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
      
      <nav style={navStyle}>
        {navItems.map((item) => {
          const Icon = item.icon;
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

export function Sidebar({ activeView, setActiveView, darkMode, setDarkMode }) {
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
    borderTop: '1px solid var(--border-color)'
  };

  const darkModeButtonStyle = {
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

  return (
    <aside style={asideStyle}>
      <div style={headerStyle}>
        <h1 style={titleStyle}>Ticket KPIs</h1>
        <p style={subtitleStyle}>Dashboard</p>
      </div>

      <nav style={navStyle}>
        {navItems.map((item) => {
          const Icon = item.icon;
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
        <button
          onClick={() => setDarkMode(!darkMode)}
          style={darkModeButtonStyle}
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
      </div>
    </aside>
  );
}
