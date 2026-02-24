import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const statusLabels = {
  '0': 'Neu',
  '80': 'Bearbeitung',
  '200': 'Geschlossen'
};

const colors = {
  '0': '#f97316',
  '80': '#3b82f6',
  '200': '#22c55e'
};

export default function StatusBarChart({ data, title, groupBy = 'category' }) {
  const groupedData = {};
  
  data.forEach((item) => {
    const key = item[groupBy];
    if (!groupedData[key]) {
      groupedData[key] = { name: key };
    }
    groupedData[key][statusLabels[item.status]] = item.count;
  });

  const chartData = Object.values(groupedData);

  const truncateLabel = (label) => {
    if (typeof label !== 'string') return label;
    return label.length > 12 ? label.substring(0, 12) + '...' : label;
  };

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
      <div style={{ width: '100%', height: '400px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={chartData} 
            margin={{ top: 20, right: 30, left: 0, bottom: 60 }}
            barCategoryGap="30%"
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="name" 
              tick={{ fill: '#6b7280', fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
              interval={0}
              tickFormatter={truncateLabel}
            />
            <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} width={45} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '12px'
              }}
              wrapperStyle={{ fontSize: '12px' }}
            />
            <Legend 
              wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }}
              iconSize={12}
            />
            <Bar dataKey="Neu" fill={colors['0']} name="Neu" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Bearbeitung" fill={colors['80']} name="Bearb." radius={[4, 4, 0, 0]} />
            <Bar dataKey="Geschlossen" fill={colors['200']} name="Geschl." radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}