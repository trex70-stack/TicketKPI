import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import { fetchFilters } from './services/api';
import Login from './pages/Login';
import AuthCallback from './pages/AuthCallback';
import SetPassword from './pages/SetPassword';
import AdminPanel from './pages/AdminPanel';
import ReporterDashboard from './pages/ReporterDashboard';
import ManagementDashboard from './pages/ManagementDashboard';
import AgentDashboard from './pages/AgentDashboard';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';

export default function App() {
  const { isAuthenticated, loading, error } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
        Laden...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: 'var(--bg-primary)', color: 'red' }}>
        Fehler: {error}
      </div>
    );
  }

return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/set-password" element={<SetPassword />} />
        <Route path="/login" element={!isAuthenticated() ? <Login /> : <Navigate to="/" />} />
        <Route path="/admin" element={isAuthenticated() ? <AdminPanel /> : <Navigate to="/login" />} />
        <Route path="/*" element={isAuthenticated() ? <DashboardLayout /> : <Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

function DashboardLayout() {
  const { user, logout, isAdmin } = useAuth();
  const [activeView, setActiveView] = useState('reporter');
  const [filters, setFilters] = useState(null);
  const [filtersLoading, setFiltersLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    loadFilters();
  }, []);

  const loadFilters = async () => {
    try {
      const data = await fetchFilters();
      setFilters(data);
    } catch (error) {
      console.error('Error loading filters:', error);
    }
    setFiltersLoading(false);
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const isInReporterList = () => {
    if (user?.role === 'admin') return true;
    if (!user?.kuerzel || !filters?.reporters) return false;
    return filters.reporters.some(r => r.id === user.kuerzel);
  };

  const isInAgentList = () => {
    if (user?.role === 'admin') return true;
    if (!user?.kuerzel || !filters?.agents) return false;
    return filters.agents.some(r => r.id === user.kuerzel);
  };

  const canViewManagement = () => {
    return user?.role === 'admin' || user?.role === 'management';
  };

  const renderDashboard = () => {
    const isPreselected = user?.role !== 'admin';
    
    switch (activeView) {
      case 'reporter':
        if (isInReporterList()) {
          return <ReporterDashboard filters={filters} preselectedReporter={isPreselected ? user.kuerzel : null} />;
        }
        return null;
      case 'management':
        if (canViewManagement()) {
          return <ManagementDashboard filters={filters} />;
        }
        return null;
      case 'agent':
        if (isInAgentList()) {
          return <AgentDashboard filters={filters} preselectedAgent={isPreselected ? user.kuerzel : null} />;
        }
        return null;
      default:
        return null;
    }
  };

  const containerStyle = {
    display: 'flex',
    flexDirection: isMobile ? 'column' : 'row',
    minHeight: '100vh',
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-primary)'
  };

  const mainStyle = {
    flex: 1,
    padding: isMobile ? '1rem' : '1.5rem',
    overflow: 'auto'
  };

  const noAccessStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '200px',
    color: 'var(--text-secondary)',
    textAlign: 'center',
    padding: '2rem'
  };

  const getAvailableViews = () => {
    if (filtersLoading || !filters) return [];
    
    const views = [];
    
    if (isInReporterList()) {
      views.push({ id: 'reporter', label: 'Reporter' });
    }
    
    if (canViewManagement()) {
      views.push({ id: 'management', label: 'Management' });
    }
    
    if (isInAgentList()) {
      views.push({ id: 'agent', label: 'Agent' });
    }
    
    return views;
  };

  const availableViews = getAvailableViews();

  useEffect(() => {
    if (availableViews.length > 0 && !availableViews.find(v => v.id === activeView)) {
      setActiveView(availableViews[0].id);
    }
  }, [availableViews.length, activeView]);

  return (
    <div style={containerStyle}>
      {!isMobile && (
        <Sidebar
          activeView={activeView}
          setActiveView={setActiveView}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          isAdmin={isAdmin()}
          onLogout={logout}
          availableViews={availableViews}
        />
      )}
      {isMobile && (
        <Header
          activeView={activeView}
          setActiveView={setActiveView}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          isAdmin={isAdmin()}
          onLogout={logout}
          availableViews={availableViews}
        />
      )}
      <main style={mainStyle}>
        {filtersLoading ? (
          <div style={noAccessStyle}>
            Filter werden geladen...
          </div>
        ) : renderDashboard() || (
          <div style={noAccessStyle}>
            Sie haben keine Berechtigung für diesen Bereich.
          </div>
        )}
      </main>
    </div>
  );
}
