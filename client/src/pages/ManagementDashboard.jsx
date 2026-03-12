import { useState, useEffect, useMemo } from 'react';
import { Ticket, Clock, FileCheck, AlertCircle, Hourglass } from 'lucide-react';
import KPICard from '../components/KPICard';
import FilterDropdowns from '../components/FilterDropdowns';
import StatusBarChart from '../components/charts/StatusBarChart';
import CategoryPieChart from '../components/charts/CategoryPieChart';
import TimeToProcessingChart from '../components/charts/TimeToProcessingChart';
import { fetchManagementKPIs, fetchTimeToProcessing } from '../services/api';

const currentYear = new Date().getFullYear();

export default function ManagementDashboard({ filters }) {
  const [category, setCategory] = useState('all');
  const [priority, setPriority] = useState('all');
  const [kpiData, setKpiData] = useState(null);
  const [timeToProcessingData, setTimeToProcessingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeLoading, setTimeLoading] = useState(true);

  useEffect(() => {
    loadKPIs();
    loadTimeToProcessing();
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

  const loadTimeToProcessing = async () => {
    setTimeLoading(true);
    try {
      const data = await fetchTimeToProcessing();
      setTimeToProcessingData(data);
    } catch (error) {
      console.error('Error loading time to processing:', error);
    }
    setTimeLoading(false);
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

  const avgTimeToProcessing = useMemo(() => {
    if (!timeToProcessingData || timeToProcessingData.length === 0) return null;
    const totalTime = timeToProcessingData.reduce((sum, d) => sum + (d.avgTime || 0) * (d.count || 1), 0);
    const totalCount = timeToProcessingData.reduce((sum, d) => sum + (d.count || 1), 0);
    return totalCount > 0 ? Math.round(totalTime / totalCount) : null;
  }, [timeToProcessingData]);

  const timeToProcessingTrend = useMemo(() => {
    if (!timeToProcessingData || timeToProcessingData.length === 0) return null;
    
    const months = [...new Set(timeToProcessingData.map(d => d.month))].sort();
    if (months.length < 2) return null;
    
    const lastMonth = months[months.length - 1];
    const prevMonth = months[months.length - 2];
    
    const lastMonthData = timeToProcessingData.filter(d => d.month === lastMonth);
    const prevMonthData = timeToProcessingData.filter(d => d.month === prevMonth);
    
    if (lastMonthData.length === 0 || prevMonthData.length === 0) return null;
    
    const lastTotalTime = lastMonthData.reduce((sum, d) => sum + (d.avgTime || 0) * (d.count || 1), 0);
    const lastTotalCount = lastMonthData.reduce((sum, d) => sum + (d.count || 1), 0);
    const lastAvg = lastTotalCount > 0 ? lastTotalTime / lastTotalCount : 0;
    
    const prevTotalTime = prevMonthData.reduce((sum, d) => sum + (d.avgTime || 0) * (d.count || 1), 0);
    const prevTotalCount = prevMonthData.reduce((sum, d) => sum + (d.count || 1), 0);
    const prevAvg = prevTotalCount > 0 ? prevTotalTime / prevTotalCount : 0;
    
    if (prevAvg === 0) return null;
    
    const change = ((lastAvg - prevAvg) / prevAvg) * 100;
    
    return {
      currentMonth: lastMonth,
      currentAvg: Math.round(lastAvg),
      prevMonth: prevMonth,
      prevAvg: Math.round(prevAvg),
      changePercent: change
    };
  }, [timeToProcessingData]);

  const titleStyle = {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginBottom: '1rem'
  };

  const sectionTitleStyle = {
    fontSize: '1rem',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    marginBottom: '0.75rem',
    marginTop: '1.5rem'
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

      <div style={sectionTitleStyle}>Zeit bis zur Bearbeitung (letzte 12 Monate)</div>
      
      {!timeLoading && avgTimeToProcessing && (
        <div style={{ 
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '0.75rem',
          padding: '1rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '1rem'
        }}>
          <div style={{ 
            padding: '0.75rem',
            backgroundColor: '#fef3c7',
            borderRadius: '0.5rem'
          }}>
            <Hourglass size={24} style={{ color: '#d97706' }} />
          </div>
          <div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
              Ø Zeit bis Bearbeitung (letzte 12 Monate)
            </p>
            <p style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {formatTime(avgTimeToProcessing)}
              {timeToProcessingTrend && (
                <span style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: timeToProcessingTrend.changePercent < 0 ? '#16a34a' : '#dc2626'
                }}>
                  <svg 
                    width={Math.min(16 + Math.abs(timeToProcessingTrend.changePercent) * 0.3, 28)} 
                    height={14} 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke={timeToProcessingTrend.changePercent < 0 ? '#16a34a' : '#dc2626'}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ transform: timeToProcessingTrend.changePercent < 0 ? 'rotate(0deg)' : 'rotate(180deg)', marginRight: '0.25rem' }}
                  >
                    <path d="M12 5v14M5 12l7-7 7 7" />
                  </svg>
                  {timeToProcessingTrend.changePercent > 0 ? '+' : ''}{timeToProcessingTrend.changePercent.toFixed(1)}%
                </span>
              )}
            </p>
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
              Gewichtet nach Ticketanzahl
            </p>
            {timeToProcessingTrend && (
              <p style={{ fontSize: '0.75rem', color: timeToProcessingTrend.changePercent < 0 ? '#16a34a' : '#dc2626', margin: 0 }}>
                {timeToProcessingTrend.changePercent < 0 ? 'Verbessert' : 'Verschlechtert'} zum Vormonat
              </p>
            )}
          </div>
        </div>
      )}
      
      {timeLoading ? (
        <div style={centerStyle}>
          <div style={spinnerStyle}></div>
        </div>
      ) : (
        <TimeToProcessingChart 
          data={timeToProcessingData}
          title="Ø Zeit von Neuanlage bis 'In Bearbeitung' nach Kategorie"
        />
      )}
    </div>
  );
}