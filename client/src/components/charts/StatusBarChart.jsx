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
    groupedData[key][`${statusLabels[item.status]}_original`] = item.count;
  });

  const chartData = Object.values(groupedData);

  const allCounts = data.map(item => item.count);
  const maxCount = Math.max(...allCounts);
  const sortedCounts = [...allCounts].sort((a, b) => b - a);
  const secondMax = sortedCounts[1] || maxCount;
  
  const yAxisMax = Math.max(secondMax * 2, 10);
  
  const cappedData = chartData.map(item => ({
    ...item,
    Neu: item.Neu > yAxisMax ? yAxisMax : item.Neu,
    Bearbeitung: item.Bearbeitung > yAxisMax ? yAxisMax : item.Bearbeitung,
    Geschlossen: item.Geschlossen > yAxisMax ? yAxisMax : item.Geschlossen
  }));

  const truncateLabel = (label) => {
    if (typeof label !== 'string') return label;
    return label.length > 12 ? label.substring(0, 12) + '...' : label;
  };

  const CustomBar = (props) => {
    const { x, y, width, height, fill, payload, dataKey } = props;
    const originalKey = `${dataKey}_original`;
    const originalValue = payload?.[originalKey] ?? payload?.[dataKey] ?? 0;
    const isCapped = originalValue > yAxisMax;
    
    return (
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill={fill}
          radius={isCapped ? [0, 0, 0, 0] : [4, 4, 0, 0]}
        />
        {isCapped && (
          <>
            <path
              d={`M${x},${y} L${x + width/4},${y - 8} L${x + width/2},${y} L${x + 3*width/4},${y - 8} L${x + width},${y}`}
              fill="none"
              stroke={fill}
              strokeWidth="3"
            />
            <rect
              x={x}
              y={y - 8}
              width={width}
              height={8}
              fill="white"
            />
          </>
        )}
        <text
          x={x + width / 2}
          y={y + (height > 20 ? 15 : -5)}
          textAnchor="middle"
          fill={height > 20 ? '#fff' : '#374151'}
          fontSize={11}
          fontWeight={600}
        >
          {originalValue}
        </text>
      </g>
    );
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
            data={cappedData} 
            margin={{ top: 30, right: 30, left: 0, bottom: 60 }}
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
            <YAxis 
              tick={{ fill: '#6b7280', fontSize: 12 }} 
              width={45}
              domain={[0, yAxisMax]}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '12px'
              }}
              wrapperStyle={{ fontSize: '12px' }}
              formatter={(value, name, props) => {
                const originalKey = `${name}_original`;
                return [props.payload?.[originalKey] ?? value, name];
              }}
            />
            <Legend 
              wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }}
              iconSize={12}
            />
            <Bar dataKey="Neu" fill={colors['0']} name="Neu" shape={<CustomBar />} />
            <Bar dataKey="Bearbeitung" fill={colors['80']} name="Bearb." shape={<CustomBar />} />
            <Bar dataKey="Geschlossen" fill={colors['200']} name="Geschl." shape={<CustomBar />} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}