const GRAPH_API_BASE = 'https://graph.microsoft.com/v1.0';

export function getGraphScopes() {
  const savedConfig = localStorage.getItem('clientConfig');
  if (savedConfig) {
    try {
      const config = JSON.parse(savedConfig);
      if (config.graphApi?.enabled && config.graphApi?.scopes) {
        return config.graphApi.scopes;
      }
    } catch (e) {
      // Fall through to default
    }
  }
  return ['User.Read'];
}

export function getGraphFields() {
  const savedConfig = localStorage.getItem('clientConfig');
  if (savedConfig) {
    try {
      const config = JSON.parse(savedConfig);
      if (config.graphApi?.fields) {
        return config.graphApi.fields;
      }
    } catch (e) {
      // Fall through to default
    }
  }
  return { kuerzel: 'onPremisesSamAccountName' };
}

export function isGraphEnabled() {
  const savedConfig = localStorage.getItem('clientConfig');
  if (savedConfig) {
    try {
      const config = JSON.parse(savedConfig);
      return config.graphApi?.enabled === true;
    } catch (e) {
      // Fall through to default
    }
  }
  return false;
}

export async function getGraphAccessToken(clientId, tenantId) {
  const scopes = getGraphScopes();
  
  return new Promise((resolve, reject) => {
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    
    const state = Math.random().toString(36).substring(7);
    const redirectUri = `${window.location.origin}/auth/callback`;
    
    const authUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize` +
      `?client_id=${clientId}` +
      `&response_type=token` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=${encodeURIComponent(scopes.join(' '))}` +
      `&state=${state}` +
      `&response_mode=fragment`;
    
    let resolved = false;
    const timeout = setTimeout(() => {
      if (!resolved) {
        document.body.removeChild(iframe);
        reject(new Error('Graph token request timed out'));
      }
    }, 30000);
    
    const handleMessage = (event) => {
      if (event.origin !== window.location.origin) return;
      
      if (event.data?.type === 'graph-token' && event.data?.state === state) {
        resolved = true;
        clearTimeout(timeout);
        window.removeEventListener('message', handleMessage);
        document.body.removeChild(iframe);
        
        if (event.data.error) {
          reject(new Error(event.data.error));
        } else {
          resolve(event.data.accessToken);
        }
      }
    };
    
    window.addEventListener('message', handleMessage);
    document.body.appendChild(iframe);
    iframe.src = authUrl;
  });
}

export async function fetchGraphUser(accessToken) {
  const fields = getGraphFields();
  const graphFields = Object.values(fields).join(',');
  
  const response = await fetch(`${GRAPH_API_BASE}/me?$select=${graphFields}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error(`Graph API error: ${response.status}`);
  }
  
  const data = await response.json();
  
  const result = {};
  for (const [appField, graphField] of Object.entries(fields)) {
    result[appField] = data[graphField] || null;
  }
  
  return result;
}

export async function updateUserGraphFields(userId, fields) {
  const { getApiBase } = await import('./config.js');
  
  const response = await fetch(`${getApiBase()}/users/${userId}/graph-fields`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fields)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update user fields');
  }
  
  return response.json();
}
