import { useState, useEffect } from 'react';
import { Ticket, Clock, FileCheck, AlertCircle } from 'lucide-react';
import KPICard from '../components/KPICard';
import FilterDropdowns from '../components/FilterDropdowns';
import StatusBarChart from '../components/charts/StatusBarChart';
import CategoryPieChart from '../components/charts/CategoryPieChart';
import { fetchManagementKPIs } from '../services/api';

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
            />
            <KPICard
              title="In Bearbeitung"
              value={kpiData.ticketsInProgress}
              icon={Ticket}
            />
            <KPICard
              title="Dieses Jahr geschlossen"
              value={kpiData.ticketsClosedThisYear}
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
            <StatusBarChart 
              data={kpiData.byPriority} 
              title="Tickets nach Priorität"
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
              title="Verteilung nach Kategorie"
            />
          </div>
        </>
      )}
    </div>
  );
}
