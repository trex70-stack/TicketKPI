import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const COLORS = ['#3b82f6', '#22c55e', '#f97316', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f59e0b', '#84cc16'];

export default function CategoryPieChart({ data, title, dataKey = 'count', nameKey = 'category' }) {
  const truncateName = (name) => {
    if (typeof name !== 'string') return name;
    return name.length > 15 ? name.substring(0, 15) + '...' : name;
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
      <div style={{ width: '100%', height: '350px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey={dataKey}
              nameKey={nameKey}
              cx="50%"
              cy="50%"
              outerRadius={100}
              innerRadius={40}
              label={({ value }) => value}
              labelLine={true}
              paddingAngle={2}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="#fff" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value) => [value, 'Anzahl']}
              contentStyle={{ 
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '12px'
              }}
              wrapperStyle={{ fontSize: '12px' }}
            />
            <Legend 
              wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
              iconSize={10}
              formatter={truncateName}
              layout="horizontal"
              verticalAlign="bottom"
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}