import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function ComparisonBarChart({ data, title }) {
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
      <div style={{ width: '100%', height: '300px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={data} 
            layout="vertical" 
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            barCategoryGap="40%"
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 12 }} />
            <YAxis 
              dataKey="name" 
              type="category" 
              tick={{ fill: '#6b7280', fontSize: 12 }} 
              width={120}
            />
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
              wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
              iconSize={12}
            />
            <Bar dataKey="ich" fill="#3b82f6" name="Ich" radius={[0, 4, 4, 0]} />
            <Bar dataKey="kollegen" fill="#94a3b8" name="Kollegen Ø" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}