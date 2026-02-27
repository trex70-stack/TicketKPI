import { useState, useEffect } from 'react';
import { Ticket, Clock, FileCheck, AlertCircle } from 'lucide-react';
import KPICard from '../components/KPICard';
import FilterDropdowns from '../components/FilterDropdowns';
import StatusBarChart from '../components/charts/StatusBarChart';
import CategoryPieChart from '../components/charts/CategoryPieChart';
import { fetchManagementKPIs } from '../services/api';

const currentYear = new Date().getFullYear();

export default function ManagementDashboard({ filters }) {
  const [category, setCategory] = useState('all');
  const [priority, setPriority] = useState('all');
  const [kpiData, setKpiData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadKPIs();
  }, [category, priority]);

  const loadKPIs = async () => {
    setLoading(true);
    try {
      const data = await fetchManagementKPIs(category, priority);
      setKpiData(data);
    } catch (error) {
      console.error('Error loading KPIs:', error);
    }
    setLoading(false);
  };

  const formatTime = (minutes) => {
    if (!minutes) return '0';
    const days = Math.floor(minutes / (60 * 24));
    const hours = Math.round((minutes % (60 * 24)) / 60);
    return `${days}d ${hours}h`;
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
    height: '200px'
  };

  const spinnerStyle = {
    width: '32px',
    height: '32px',
    border: '3px solid #e5e7eb',
    borderTop: '3px solid #0ea5e9',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  };

  return (
    <div>
      <h2 style={titleStyle}>Management Dashboard</h2>

      <FilterDropdowns
        filters={filters}
        category={category}
        setCategory={setCategory}
        priority={priority}
        setPriority={setPriority}
      />

      {loading && (
        <div style={centerStyle}>
          <div style={spinnerStyle}></div>
        </div>
      )}

      {kpiData && !loading && (
        <>
<div className="kpi-grid">
            <KPICard
              title="Neu ohne Agent"
              value={kpiData.ticketsNewWithoutAgent}
              icon={AlertCircle}
              tooltip="Neue Tickets ohne zugewiesenen Agent (alle Jahre)"
            />
            <KPICard
              title="Aktuell in Bearbeitung"
              value={kpiData.ticketsInProgress}
              icon={Ticket}
              tooltip="Alle Tickets im Status 'Bearbeitung' (alle Jahre)"
            />
            <KPICard
              title={`Geschlossen ${currentYear}`}
              value={kpiData.ticketsClosedThisYear}
              icon={FileCheck}
              tooltip={`Tickets, die ${currentYear} geschlossen wurden (unabhängig vom Erstellungsdatum)`}
            />
            <KPICard
              title={`Ø Bearbeitungszeit ${currentYear}`}
              value={formatTime(kpiData.avgProcessingTimeMinutes)}
              icon={Clock}
              tooltip={`Durchschnittliche Zeit von Erstellung bis Schließung für Tickets, die ${currentYear} erstellt UND geschlossen wurden`}
            />
          </div>

<div className="chart-grid">
            <StatusBarChart 
              data={kpiData.byCategory} 
              title={`Tickets ${currentYear} nach Kategorie`}
              groupBy="category"
            />
            <StatusBarChart 
              data={kpiData.byPriority} 
              title={`Tickets ${currentYear} nach Priorität`}
              groupBy="priority"
            />
          </div>

          <div className="chart-grid">
            <CategoryPieChart 
              data={kpiData.newTicketsWithoutAgentByCategory} 
              title="Neue Tickets ohne Agent"
            />
            <CategoryPieChart 
              data={getCategoryPieData()} 
              title={`Tickets ${currentYear} nach Kategorie`}
            />
          </div>
        </>
      )}
    </div>
  );
}
