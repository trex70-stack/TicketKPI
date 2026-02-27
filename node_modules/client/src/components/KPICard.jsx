export default function KPICard({ title, value, unit, icon: Icon, trend, tooltip }) {
  return (
    <div className="kpi-card" title={tooltip} style={{ cursor: tooltip ? 'help' : 'default' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <p style={{ 
            fontSize: '0.75rem', 
            fontWeight: 500, 
            color: 'var(--text-secondary)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {title}
          </p>
          <p style={{ 
            marginTop: '0.25rem', 
            fontSize: '1.25rem', 
            fontWeight: 700, 
            color: 'var(--text-primary)' 
          }}>
            {typeof value === 'number' ? value.toLocaleString('de-DE') : value}
            {unit && <span style={{ fontSize: '0.875rem', fontWeight: 400, color: 'var(--text-secondary)', marginLeft: '0.25rem' }}>{unit}</span>}
          </p>
        </div>
        {Icon && (
          <div style={{ 
            padding: '0.5rem', 
            backgroundColor: '#e0f2fe', 
            borderRadius: '0.5rem',
            flexShrink: 0
          }}>
            <Icon style={{ color: '#0284c7' }} size={20} />
          </div>
        )}
      </div>
      {trend !== undefined && (
        <div style={{ 
          marginTop: '0.5rem', 
          fontSize: '0.75rem',
          color: trend >= 0 ? '#16a34a' : '#dc2626'
        }}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
        </div>
      )}
    </div>
  );
}
