let cachedConfig = null;

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
      cachedConfig = { protocol: 'http', port: '3001' };
    }
  } catch (error) {
    console.warn('Could not fetch client config, using defaults:', error);
    cachedConfig = { protocol: 'http', port: '3001' };
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

export async function initConfig() {
  const config = await getClientConfig();
  localStorage.setItem('clientConfig', JSON.stringify(config));
  return config;
}
