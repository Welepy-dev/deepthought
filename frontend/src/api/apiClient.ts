import { refreshToken } from './refresh';
import { logout } from '../auth/logout';

export async function apiFetch(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token');
  const headers = new Headers(options.headers);

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response = await fetch(url, { ...options, headers });

  if (response.status !== 401) {
    return response;
  }

  const ok = await refreshToken();

  if (!ok) {
    logout();
    window.location.href = '/';
    return response;
  }

  const newToken = localStorage.getItem('token');

  if (newToken) {
    headers.set('Authorization', `Bearer ${newToken}`);
  }

  return fetch(url, { ...options, headers });
}
