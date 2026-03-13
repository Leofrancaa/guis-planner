export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://guis-planner-api-i84a.vercel.app/api';

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  // Try to get the token, handle client/server differences if necessary
  let token = '';
  
  // Basic client-side token retrieval
  if (typeof window !== 'undefined') {
    // In a real production app, consider using httpOnly cookies, but for this project we'll use localStorage
    token = localStorage.getItem('token') || '';
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
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
