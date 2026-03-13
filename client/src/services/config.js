let cachedConfig = null;

const defaultClaimMapping = {
  azureId: 'oid',
  email: 'preferred_username',
  name: 'name',
  kuerzel: 'onprem_sam_account_name'
};

export async function getClientConfig() {
  if (cachedConfig) {
    return cachedConfig;
  }
  
  const host = window.location.hostname;
  
  try {
    const protocol = window.location.protocol === 'https:' ? 'https' : 'http';
    const port = window.location.protocol === 'https:' ? '443' : '3001';
    
    const response = await fetch(`${protocol}://${host}:${port}/api/config`);
    
    if (response.ok) {
      cachedConfig = await response.json();
    } else {
      cachedConfig = { 
        protocol: 'http', 
        port: '3001',
        azureClaimMapping: defaultClaimMapping
      };
    }
  } catch (error) {
    console.warn('Could not fetch client config, using defaults:', error);
    cachedConfig = { 
      protocol: 'http', 
      port: '3001',
      azureClaimMapping: defaultClaimMapping
    };
  }
  
  return cachedConfig;
}

export function getApiBase() {
  const host = window.location.hostname;
  
  const savedConfig = localStorage.getItem('clientConfig');
  if (savedConfig) {
    try {
      const config = JSON.parse(savedConfig);
      return `${config.protocol}://${host}:${config.port}/api`;
    } catch (e) {
      // Fall through to default
    }
  }
  
  if (window.location.protocol === 'https:') {
    return `https://${host}:443/api`;
  }
  
  return `http://${host}:3001/api`;
}

export function getClaimMapping() {
  const savedConfig = localStorage.getItem('clientConfig');
  if (savedConfig) {
    try {
      const config = JSON.parse(savedConfig);
      return config.azureClaimMapping || defaultClaimMapping;
    } catch (e) {
      // Fall through to default
    }
  }
  return defaultClaimMapping;
}

export function extractClaims(tokenPayload) {
  const mapping = getClaimMapping();
  
  return {
    azureId: tokenPayload[mapping.azureId] || tokenPayload.oid || tokenPayload.sub,
    email: tokenPayload[mapping.email] || tokenPayload.preferred_username || tokenPayload.email,
    name: tokenPayload[mapping.name] || tokenPayload.name,
    kuerzel: tokenPayload[mapping.kuerzel] || tokenPayload.onprem_sam_account_name
  };
}

export async function initConfig() {
  const config = await getClientConfig();
  localStorage.setItem('clientConfig', JSON.stringify(config));
  return config;
}
