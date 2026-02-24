import { useState, useEffect } from 'react';
import { Ticket, Clock, FileCheck, Users } from 'lucide-react';
import KPICard from '../components/KPICard';
import FilterDropdowns from '../components/FilterDropdowns';
import StatusBarChart from '../components/charts/StatusBarChart';
import ComparisonBarChart from '../components/charts/ComparisonBarChart';
import TimeComparisonChart from '../components/charts/TimeComparisonChart';
import { fetchAgentKPIs } from '../services/api';

export default function AgentDashboard({ filters, preselectedAgent }) {
  const [agent, setAgent] = useState('');
  const [agentId, setAgentId] = useState(null);
  const [notInList, setNotInList] = useState(false);
  const [category, setCategory] = useState('all');
  const [priority, setPriority] = useState('all');
  const [kpiData, setKpiData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (preselectedAgent && filters?.agents) {
      const found = filters.agents.find(r => 
        r.name && r.name.toLowerCase() === preselectedAgent.toLowerCase()
      );
      if (found) {
        setAgent(found.name);
        setAgentId(found.id);
        setNotInList(false);
      } else {
        setNotInList(true);
      }
    } else if (!preselectedAgent) {
      setNotInList(false);
    }
  }, [preselectedAgent, filters?.agents]);

  useEffect(() => {
    if (agentId) {
      loadKPIs();
    }
  }, [agentId, category, priority]);

  const loadKPIs = async () => {
    setLoading(true);
    try {
      const data = await fetchAgentKPIs(agentId, category, priority);
      setKpiData(data);
    } catch (error) {
      console.error('Error loading KPIs:', error);
    }
    setLoading(false);
  };

  const handleAgentChange = (name) => {
    setAgent(name);
    const found = filters?.agents?.find(r => r.name === name);
    setAgentId(found?.id || null);
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

  if (notInList) {
    return (
      <div>
        <h2 style={titleStyle}>Agent Dashboard</h2>
        <div style={errorStyle}>
          Sie sind nicht in der Agenten-Liste enthalten.<br/>
          Dieses Dashboard ist für Sie nicht verfügbar.
        </div>
      </div>
    );
  }

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
        setSelectedPerson={handleAgentChange}
        personLabel="Agent"
        personType="agents"
        personDisabled={!!preselectedAgent}
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
              title="Aktuell in Bearbeitung"
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
                  name: 'Aktuell in Bearbeitung', 
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
