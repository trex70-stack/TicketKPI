import { getApiBase } from './config.js';

export async function fetchFilters() {
  const response = await fetch(`${getApiBase()}/filters`);
  if (!response.ok) throw new Error('Failed to fetch filters');
  return response.json();
}

export async function fetchReporterKPIs(reporterId, category = 'all', priority = 'all') {
  const params = new URLSearchParams();
  if (category !== 'all') params.append('category', category);
  if (priority !== 'all') params.append('priority', priority);
  
  const response = await fetch(`${getApiBase()}/reporter/${encodeURIComponent(reporterId)}/kpis?${params}`);
  if (!response.ok) throw new Error('Failed to fetch reporter KPIs');
  return response.json();
}

export async function fetchManagementKPIs(category = 'all', priority = 'all') {
  const params = new URLSearchParams();
  if (category !== 'all') params.append('category', category);
  if (priority !== 'all') params.append('priority', priority);
  
  const response = await fetch(`${getApiBase()}/management/kpis?${params}`);
  if (!response.ok) throw new Error('Failed to fetch management KPIs');
  return response.json();
}

export async function fetchAgentKPIs(agentId, category = 'all', priority = 'all') {
  const params = new URLSearchParams();
  if (category !== 'all') params.append('category', category);
  if (priority !== 'all') params.append('priority', priority);
  
  const response = await fetch(`${getApiBase()}/agent/${encodeURIComponent(agentId)}/kpis?${params}`);
  if (!response.ok) throw new Error('Failed to fetch agent KPIs');
  return response.json();
}

export async function fetchTimeToProcessing() {
  const response = await fetch(`${getApiBase()}/management/time-to-processing`);
  if (!response.ok) throw new Error('Failed to fetch time to processing');
  return response.json();
}

export async function fetchKanbanTickets(filters = {}) {
  const params = new URLSearchParams();
  if (filters.category && filters.category !== 'all') params.append('category', filters.category);
  if (filters.priority && filters.priority !== 'all') params.append('priority', filters.priority);
  if (filters.agent && filters.agent !== 'all') params.append('agent', filters.agent);
  if (filters.status && filters.status !== 'all') params.append('status', filters.status);

  const response = await fetch(`${getApiBase()}/kanban/tickets?${params}`);
  if (!response.ok) throw new Error('Failed to fetch kanban tickets');
  return response.json();
}

export async function fetchStatusLabels() {
  const response = await fetch(`${getApiBase()}/kanban/status-labels`);
  if (!response.ok) throw new Error('Failed to fetch status labels');
  return response.json();
}

export async function saveStatusLabels(labels) {
  const response = await fetch(`${getApiBase()}/kanban/status-labels`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ labels })
  });
  if (!response.ok) throw new Error('Failed to save status labels');
  return response.json();
}
