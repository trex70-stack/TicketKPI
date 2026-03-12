import { useMemo } from 'react';

const COLORS = [
  '#0284c7', '#16a34a', '#dc2626', '#9333ea', '#ea580c', 
  '#0891b2', '#65a30d', '#d97706', '#7c3aed', '#2563eb'
];

function TrendArrow({ changePercent, size = 'normal' }) {
  if (changePercent === null || changePercent === undefined || isNaN(changePercent)) {
    return null;
  }

  const isImprovement = changePercent < 0;
  const absChange = Math.abs(changePercent);
  
  const baseSize = size === 'small' ? 14 : 18;
  const arrowLength = Math.min(baseSize + absChange * 0.4, 30);
  
  const color = isImprovement ? '#16a34a' : '#dc2626';
  
  const arrowStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: '0.25rem',
    verticalAlign: 'middle'
  };

  return (
    <span style={arrowStyle} title={`${isImprovement ? '' : '+'}${changePercent.toFixed(1)}%`}>
      <svg 
        width={arrowLength} 
        height={Math.max(baseSize * 0.8, 12)} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ transform: isImprovement ? 'rotate(0deg)' : 'rotate(180deg)' }}
      >
        <path d="M12 5v14M5 12l7-7 7 7" />
      </svg>
    </span>
  );
}

export default function TimeToProcessingChart({ data, title }) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return null;

    const categories = [...new Set(data.map(d => d.category))];
    const months = [...new Set(data.map(d => d.month))].sort();

    const maxTime = Math.max(...data.map(d => d.avgTime || 0), 1);

    const dataMap = data.reduce((acc, d) => {
      acc[`${d.month}-${d.category}`] = d;
      return acc;
    }, {});

    const changesMap = {};
    categories.forEach(category => {
      months.forEach((month, index) => {
        if (index > 0) {
          const current = dataMap[`${month}-${category}`]?.avgTime;
          const prevMonth = months[index - 1];
          const previous = dataMap[`${prevMonth}-${category}`]?.avgTime;
          
          if (current && previous && previous > 0) {
            const change = ((current - previous) / previous) * 100;
            changesMap[`${month}-${category}`] = change;
          }
        }
      });
    });

    return {
      categories,
      months,
      maxTime,
      dataMap,
      changesMap
    };
  }, [data]);

  const formatTime = (minutes) => {
    if (!minutes) return '-';
    const days = Math.floor(minutes / (60 * 24));
    const hours = Math.round((minutes % (60 * 24)) / 60);
    return `${days}d ${hours}h`;
  };

  const formatMonth = (monthStr) => {
    if (!monthStr) return '';
    const [year, month] = monthStr.split('-');
    const date = new Date(year, parseInt(month) - 1);
    return date.toLocaleDateString('de-DE', { month: 'short', year: '2-digit' });
  };

  const containerStyle = {
    backgroundColor: 'var(--bg-secondary)',
    borderRadius: '1rem',
    padding: '1.5rem',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
  };

  const titleStyle = {
    fontSize: '1rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginBottom: '1rem'
  };

  const chartContainerStyle = {
    overflowX: 'auto'
  };

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '0.75rem'
  };

  const thStyle = {
    padding: '0.5rem',
    textAlign: 'center',
    borderBottom: '1px solid var(--border-color)',
    color: 'var(--text-secondary)',
    fontWeight: 500,
    whiteSpace: 'nowrap'
  };

  const tdStyle = {
    padding: '0.5rem',
    textAlign: 'center',
    borderBottom: '1px solid var(--border-color)',
    color: 'var(--text-primary)'
  };

  const categoryHeaderStyle = {
    padding: '0.5rem',
    textAlign: 'left',
    borderBottom: '1px solid var(--border-color)',
    color: 'var(--text-primary)',
    fontWeight: 500,
    whiteSpace: 'nowrap'
  };

  const cellStyle = (avgTime, maxTime) => {
    if (!avgTime) return { ...tdStyle, color: 'var(--text-secondary)' };
    
    const intensity = Math.min(avgTime / maxTime, 1);
    const bgColor = `rgba(2, 132, 199, ${0.1 + intensity * 0.3})`;
    
    return {
      ...tdStyle,
      backgroundColor: bgColor,
      fontWeight: avgTime > maxTime * 0.7 ? 600 : 400
    };
  };

  const cellContentStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.25rem',
    flexWrap: 'nowrap'
  };

  const emptyStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '200px',
    color: 'var(--text-secondary)'
  };

  const legendContainerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
    marginTop: '1rem',
    fontSize: '0.75rem',
    color: 'var(--text-secondary)'
  };

  const legendItemStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem'
  };

  if (!chartData) {
    return (
      <div style={containerStyle}>
        <h3 style={titleStyle}>{title}</h3>
        <div style={emptyStyle}>Keine Daten verfügbar</div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <h3 style={titleStyle}>{title}</h3>
      
      <div style={chartContainerStyle}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Kategorie</th>
              {chartData.months.map(month => (
                <th key={month} style={thStyle}>{formatMonth(month)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {chartData.categories.map((category, catIndex) => (
              <tr key={category}>
                <td style={categoryHeaderStyle}>
                  <span style={{ 
                    display: 'inline-block',
                    width: '8px',
                    height: '8px',
                    backgroundColor: COLORS[catIndex % COLORS.length],
                    borderRadius: '2px',
                    marginRight: '0.5rem'
                  }} />
                  {category}
                </td>
                {chartData.months.map(month => {
                  const cellData = chartData.dataMap[`${month}-${category}`];
                  const change = chartData.changesMap[`${month}-${category}`];
                  
                  return (
                    <td 
                      key={`${month}-${category}`} 
                      style={cellStyle(cellData?.avgTime, chartData.maxTime)}
                    >
                      <div style={cellContentStyle}>
                        <span title={cellData ? `${formatTime(cellData.avgTime)} (${cellData.count} Tickets)` : 'Keine Daten'}>
                          {cellData ? formatTime(cellData.avgTime) : '-'}
                        </span>
                        {change !== undefined && (
                          <TrendArrow changePercent={change} size="small" />
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={legendContainerStyle}>
        <span>Ø Zeit von Neuanlage bis Status "Bearbeitung"</span>
        <span style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '1rem' }}>
          <span style={legendItemStyle}>
            <svg width="16" height="12" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12l7-7 7 7" />
            </svg>
            Verbessert (weniger Zeit)
          </span>
          <span style={{ ...legendItemStyle, marginLeft: '0.75rem' }}>
            <svg width="16" height="12" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'rotate(180deg)' }}>
              <path d="M12 5v14M5 12l7-7 7 7" />
            </svg>
            Verschlechtert (mehr Zeit)
          </span>
        </span>
        <span style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '1rem' }}>
          Pfeillänge = Veränderung in %
        </span>
      </div>
    </div>
  );
}