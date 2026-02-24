import { useState, useEffect } from 'react';
import { Ticket, Clock, FileCheck, Users } from 'lucide-react';
import KPICard from '../components/KPICard';
import FilterDropdowns from '../components/FilterDropdowns';
import StatusBarChart from '../components/charts/StatusBarChart';
import ComparisonBarChart from '../components/charts/ComparisonBarChart';
import TimeComparisonChart from '../components/charts/TimeComparisonChart';
import { fetchAgentKPIs } from '../services/api';

export default function AgentDashboard({ filters }) {
  const [agent, setAgent] = useState('');
  const [category, setCategory] = useState('all');
  const [priority, setPriority] = useState('all');
  const [kpiData, setKpiData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (agent) {
      loadKPIs();
    }
  }, [agent, category, priority]);

  const loadKPIs = async () => {
    setLoading(true);
    try {
      const data = await fetchAgentKPIs(agent, category, priority);
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
      <h2 style={titleStyle}>Agent Dashboard</h2>

      <FilterDropdowns
        filters={filters}
        category={category}
        setCategory={setCategory}
        priority={priority}
        setPriority={setPriority}
        selectedPerson={agent}
        setSelectedPerson={setAgent}
        personLabel="Agent"
        personType="agents"
      />

      {!agent && (
        <div style={centerStyle}>
          Bitte wählen Sie einen Agenten aus.
        </div>
      )}

      {loading && (
        <div style={centerStyle}>
          <div style={spinnerStyle}></div>
        </div>
      )}

      {agent && kpiData && !loading && (
        <>
          <div className="kpi-grid">
            <KPICard
              title="Neu ohne Agent"
              value={kpiData.ticketsNewNoAgent}
              icon={Ticket}
            />
            <KPICard
              title="In Bearbeitung"
              value={kpiData.ticketsInProgress}
              icon={Users}
            />
            <KPICard
              title="Dieses Jahr bearbeitet"
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
            <ComparisonBarChart
              data={[
                { 
                  name: 'In Bearbeitung', 
                  ich: kpiData.ticketsInProgress, 
                  kollegen: kpiData.avgColleaguesInProgress 
                },
                { 
                  name: 'Dieses Jahr bearbeitet', 
                  ich: kpiData.ticketsClosedThisYear, 
                  kollegen: kpiData.avgColleaguesClosedThisYear 
                },
              ]}
              title="Vergleich: Ich vs. Kollegen Ø"
            />
            <StatusBarChart 
              data={kpiData.byCategory} 
              title="Meine Tickets nach Kategorie"
              groupBy="category"
            />
          </div>

          <div className="chart-grid">
            <StatusBarChart 
              data={kpiData.byPriority} 
              title="Meine Tickets nach Priorität"
              groupBy="priority"
            />
            <TimeComparisonChart
              myTime={kpiData.avgProcessingTimeMinutes}
              colleaguesTime={kpiData.avgColleaguesProcessingTimeMinutes}
              title="Ø Bearbeitungszeit: Ich vs. Kollegen"
            />
          </div>
        </>
      )}
    </div>
  );
}