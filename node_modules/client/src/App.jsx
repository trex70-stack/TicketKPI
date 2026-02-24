import { useState, useEffect } from 'react';
import { Header, Sidebar } from './components/Header';
import ReporterDashboard from './pages/ReporterDashboard';
import ManagementDashboard from './pages/ManagementDashboard';
import AgentDashboard from './pages/AgentDashboard';
import { fetchFilters } from './services/api';

function App() {
  const [activeView, setActiveView] = useState('reporter');
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });
  const [isMobile, setIsMobile] = useState(false);
  const [filters, setFilters] = useState({
    reporters: [],
    agents: [],
    categories: [],
    priorities: []
  });

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
  };

  const renderDashboard = () => {
    switch (activeView) {
      case 'reporter':
        return <ReporterDashboard filters={filters} />;
      case 'management':
        return <ManagementDashboard filters={filters} />;
      case 'agent':
        return <AgentDashboard filters={filters} />;
      default:
        return <ReporterDashboard filters={filters} />;
    }
  };

  const containerStyle = {
    display: 'flex',
    flexDirection: isMobile ? 'column' : 'row',
    minHeight: '100vh',
    backgroundColor: 'var(--bg-primary)'
  };

  const mainStyle = {
    flex: 1,
    padding: isMobile ? '1rem' : '1.5rem',
    overflow: 'auto'
  };

  return (
    <div style={containerStyle}>
      {isMobile ? (
        <>
          <Header
            activeView={activeView}
            setActiveView={setActiveView}
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            isMobile={isMobile}
          />
          <main style={mainStyle}>
            {renderDashboard()}
          </main>
        </>
      ) : (
        <>
          <Sidebar
            activeView={activeView}
            setActiveView={setActiveView}
            darkMode={darkMode}
            setDarkMode={setDarkMode}
          />
          <main style={mainStyle}>
            {renderDashboard()}
          </main>
        </>
      )}
    </div>
  );
}

export default App;
