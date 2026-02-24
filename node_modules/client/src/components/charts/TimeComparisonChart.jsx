import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function TimeComparisonChart({ myTime, colleaguesTime, title }) {
  const formatTime = (minutes) => {
    if (!minutes) return '0';
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hours === 0) return `${mins}m`;
    return `${hours}h ${mins}m`;
  };

  const data = [
    { 
      name: 'Ø Bearbeitungszeit', 
      ich: Math.round(myTime || 0), 
      kollegen: Math.round(colleaguesTime || 0) 
    }
  ];

  return (
    <div className="kpi-card">
      <h3 style={{ 
        fontSize: '1rem', 
        fontWeight: 600, 
        color: 'var(--text-primary)',
        marginBottom: '1rem'
      }}>
        {title}
      </h3>
      <div style={{ width: '100%', height: '200px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={data} 
            layout="vertical"
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            barCategoryGap="30%"
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              type="number" 
              tick={{ fill: '#6b7280', fontSize: 12 }}
              tickFormatter={(value) => formatTime(value)}
            />
            <YAxis 
              type="category" 
              dataKey="name"
              tick={{ fill: '#6b7280', fontSize: 12 }}
              width={120}
            />
            <Tooltip 
              formatter={(value) => [formatTime(value), 'Zeit']}
              contentStyle={{ 
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '12px'
              }}
              wrapperStyle={{ fontSize: '12px' }}
            />
            <Legend 
              wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
              iconSize={12}
            />
            <Bar 
              dataKey="ich" 
              fill="#3b82f6" 
              name="Ich" 
              radius={[0, 4, 4, 0]}
              label={{ position: 'right', formatter: (value) => formatTime(value), fill: '#6b7280', fontSize: 11 }}
            />
            <Bar 
              dataKey="kollegen" 
              fill="#94a3b8" 
              name="Kollegen Ø" 
              radius={[0, 4, 4, 0]}
              label={{ position: 'right', formatter: (value) => formatTime(value), fill: '#6b7280', fontSize: 11 }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}