import { useState } from 'react';
import { LayoutDashboard, User, Users, Moon, Sun, LogOut, Settings, ChevronLeft, ChevronRight } from 'lucide-react';

export function Sidebar({ activeView, setActiveView, darkMode, setDarkMode, isAdmin, onLogout, availableViews }) {
  const [collapsed, setCollapsed] = useState(false);

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

  const getIcon = (id) => {
    switch (id) {
      case 'reporter': return User;
      case 'management': return LayoutDashboard;
      case 'agent': return Users;
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
            onClick={() => window.location.href = '/admin'}
            style={adminButtonStyle}
            title={collapsed ? 'Admin Panel' : undefined}
          >
            <Settings size={20} />
            {!collapsed && <span>Admin Panel</span>}
          </button>
        )}
        <button
          onClick={() => setDarkMode(!darkMode)}
          style={buttonStyle}
          title={collapsed ? (darkMode ? 'Light Mode' : 'Dark Mode') : undefined}
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          {!collapsed && <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>
        <button
          onClick={onLogout}
          style={buttonStyle}
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut size={20} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
