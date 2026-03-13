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
