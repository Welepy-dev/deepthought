import { refreshToken } from './refresh';
import { logout } from '../auth/logout';

export async function apiFetch(url: string, options: RequestInit = {}) {
  let response = await fetch(url, options);

  if (response.status !== 401) {
    return response;
  }

  const ok = await refreshToken();

  if (!ok) {
    logout();
    window.location.href = '/';
    return response;
  }

  return fetch(url, options);
}