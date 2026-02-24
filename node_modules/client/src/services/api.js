const getApiBase = () => {
  const host = window.location.hostname;
  return `http://${host}:3001/api`;
};

const API_BASE = getApiBase();

export async function fetchFilters() {
  const response = await fetch(`${API_BASE}/filters`);
  if (!response.ok) throw new Error('Failed to fetch filters');
  return response.json();
}

export async function fetchReporterKPIs(reporterId, category = 'all', priority = 'all') {
  const params = new URLSearchParams();
  if (category !== 'all') params.append('category', category);
  if (priority !== 'all') params.append('priority', priority);
  
  const response = await fetch(`${API_BASE}/reporter/${encodeURIComponent(reporterId)}/kpis?${params}`);
  if (!response.ok) throw new Error('Failed to fetch reporter KPIs');
  return response.json();
}

export async function fetchManagementKPIs(category = 'all', priority = 'all') {
  const params = new URLSearchParams();
  if (category !== 'all') params.append('category', category);
  if (priority !== 'all') params.append('priority', priority);
  
  const response = await fetch(`${API_BASE}/management/kpis?${params}`);
  if (!response.ok) throw new Error('Failed to fetch management KPIs');
  return response.json();
}

export async function fetchAgentKPIs(agentId, category = 'all', priority = 'all') {
  const params = new URLSearchParams();
  if (category !== 'all') params.append('category', category);
  if (priority !== 'all') params.append('priority', priority);
  
  const response = await fetch(`${API_BASE}/agent/${encodeURIComponent(agentId)}/kpis?${params}`);
  if (!response.ok) throw new Error('Failed to fetch agent KPIs');
  return response.json();
}
