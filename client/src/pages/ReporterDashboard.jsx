import { useState, useEffect } from 'react';
import { Ticket, Clock, FileCheck, AlertCircle } from 'lucide-react';
import KPICard from '../components/KPICard';
import FilterDropdowns from '../components/FilterDropdowns';
import StatusBarChart from '../components/charts/StatusBarChart';
import CategoryPieChart from '../components/charts/CategoryPieChart';
import { fetchReporterKPIs, fetchManagementKPIs } from '../services/api';

export default function ReporterDashboard({ filters, preselectedReporter }) {
  const [reporter, setReporter] = useState('');
  const [reporterId, setReporterId] = useState(null);
  const [notInList, setNotInList] = useState(false);
  const [category, setCategory] = useState('all');
  const [priority, setPriority] = useState('all');
  const [kpiData, setKpiData] = useState(null);
  const [overallKPIs, setOverallKPIs] = useState(null);
  const [loading, setLoading] = useState(false);
  const [overallLoading, setOverallLoading] = useState(true);

  useEffect(() => {
    loadOverallKPIs();
  }, [category, priority]);

  useEffect(() => {
    if (preselectedReporter && filters?.reporters) {
      const found = filters.reporters.find(r => 
        r.name && r.name.toLowerCase() === preselectedReporter.toLowerCase()
      );
      if (found) {
        setReporter(found.name);
        setReporterId(found.id);
        setNotInList(false);
      } else {
        setNotInList(true);
      }
    } else if (!preselectedReporter) {
      setNotInList(false);
    }
  }, [preselectedReporter, filters?.reporters]);

  useEffect(() => {
    if (reporterId) {
      loadKPIs();
    }
  }, [reporterId, category, priority]);

  const loadOverallKPIs = async () => {
    try {
      const data = await fetchManagementKPIs(category, priority);
      setOverallKPIs(data);
    } catch (error) {
      console.error('Error loading overall KPIs:', error);
    }
    setOverallLoading(false);
  };

  const loadKPIs = async () => {
    setLoading(true);
    try {
      const data = await fetchReporterKPIs(reporterId, category, priority);
      setKpiData(data);
    } catch (error) {
      console.error('Error loading KPIs:', error);
    }
    setLoading(false);
  };

  const handleReporterChange = (name) => {
    setReporter(name);
    const found = filters?.reporters?.find(r => r.name === name);
    setReporterId(found?.id || null);
  };

  const formatTime = (minutes) => {
    if (!minutes) return '0';
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  const getCategoryPieData = () => {
    if (!kpiData?.byCategory) return [];
    const grouped = {};
    kpiData.byCategory.forEach(item => {
      grouped[item.category] = (grouped[item.category] || 0) + item.count;
    });
    return Object.entries(grouped).map(([name, value]) => ({ category: name, count: value }));
  };

  const titleStyle = {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginBottom: '1rem'
  };

  const centerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '200px',
    color: 'var(--text-secondary)'
  };

  const errorStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '200px',
    color: '#dc2626',
    textAlign: 'center',
    padding: '2rem'
  };

  const spinnerStyle = {
    width: '32px',
    height: '32px',
    border: '3px solid #e5e7eb',
    borderTop: '3px solid #0ea5e9',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  };

  const highlightGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '1rem',
    marginBottom: '2rem'
  };

  const highlightCardStyle = {
    backgroundColor: 'var(--bg-secondary)',
    borderRadius: '1rem',
    padding: '2rem',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    border: '2px solid var(--accent-primary)',
    textAlign: 'center'
  };

  const highlightValueStyle = {
    fontSize: '3rem',
    fontWeight: 700,
    color: 'var(--accent-primary)',
    margin: '0.5rem 0'
  };

  const highlightLabelStyle = {
    fontSize: '1rem',
    fontWeight: 500,
    color: 'var(--text-secondary)'
  };

  const sectionTitleStyle = {
    fontSize: '1rem',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    marginBottom: '0.75rem',
    marginTop: '1.5rem'
  };

  if (notInList) {
    return (
      <div>
        <h2 style={titleStyle}>Reporter Dashboard</h2>
        <div style={errorStyle}>
          Sie sind nicht in der Reporter-Liste enthalten.<br/>
          Dieses Dashboard ist für Sie nicht verfügbar.
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 style={titleStyle}>Reporter Dashboard</h2>

      {!overallLoading && overallKPIs && (
        <div style={highlightGridStyle}>
          <div style={highlightCardStyle}>
            <div style={highlightLabelStyle}>Aktuell in Bearbeitung</div>
            <div style={highlightValueStyle}>{overallKPIs.ticketsInProgress}</div>
          </div>
          <div style={highlightCardStyle}>
            <div style={highlightLabelStyle}>Dieses Jahr geschlossen</div>
            <div style={highlightValueStyle}>{overallKPIs.ticketsClosedThisYear}</div>
          </div>
        </div>
      )}

      <FilterDropdowns
        filters={filters}
        category={category}
        setCategory={setCategory}
        priority={priority}
        setPriority={setPriority}
        selectedPerson={reporter}
        setSelectedPerson={handleReporterChange}
        personLabel="Reporter"
        personType="reporters"
        personDisabled={!!preselectedReporter}
      />

      {!reporter && (
        <div style={centerStyle}>
          Bitte wählen Sie einen Reporter aus.
        </div>
      )}

      {loading && (
        <div style={centerStyle}>
          <div style={spinnerStyle}></div>
        </div>
      )}

      {reporter && kpiData && !loading && (
        <>
          <div style={sectionTitleStyle}>Meine Tickets</div>
          <div className="kpi-grid">
            <KPICard
              title="Neue Tickets"
              value={kpiData.ticketsNew}
              icon={AlertCircle}
            />
            <KPICard
              title="Aktuell in Bearbeitung"
              value={kpiData.ticketsInProgress}
              icon={Ticket}
            />
            <KPICard
              title="Gesamt"
              value={kpiData.ticketsTotal}
              icon={FileCheck}
            />
            <KPICard
              title="Ø Bearbeitungszeit"
              value={formatTime(kpiData.avgProcessingTimeMinutes)}
              icon={Clock}
            />
          </div>

          <div className="chart-grid">
            <StatusBarChart 
              data={kpiData.byCategory} 
              title="Tickets nach Kategorie"
              groupBy="category"
            />
            <CategoryPieChart 
              data={getCategoryPieData()} 
              title="Verteilung nach Kategorie"
            />
          </div>
        </>
      )}
    </div>
  );
}
