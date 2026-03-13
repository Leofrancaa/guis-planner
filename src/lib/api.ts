const rawBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://guis-planner-api-i84a.vercel.app';
export const API_BASE_URL = rawBaseUrl.endsWith('/api') ? rawBaseUrl : `${rawBaseUrl.replace(/\/$/, '')}/api`;

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  // ... resto do código ...
  const response = await fetch(`${API_BASE_URL}${cleanEndpoint}`, {
    ...options,
    headers,
  });

  // Automatically handle 401 Unauthorized globally if desired
  if (response.status === 401 && typeof window !== 'undefined') {
    localStorage.removeItem('token');
    // We could emit an event here or directly manipulate the store, 
    // but redirecting to login is a common pattern.
    if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
    }
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || data.message || `Request failed with status ${response.status}`);
  }

  return data;
}
