import type { AuthSessionResponse, ProfileUpdateRequest, ProviderKey } from '../types';
import { fetchJson, getApiBaseUrl, invalidateApiCache } from './core';

export function getProviderLoginUrl(provider: ProviderKey, nextUrl: string, mode: 'login' | 'link' = 'login') {
  return `${getApiBaseUrl()}/api/auth/${provider}/login?next=${encodeURIComponent(nextUrl)}&mode=${mode}`;
}

export async function logout() {
  const response = await fetchJson<AuthSessionResponse>('/api/auth/logout', {
    method: 'POST',
  });
  invalidateApiCache(['/api/auth/me', '/api/map-bootstrap', '/api/my/summary', '/api/community-routes', '/api/reviews']);
  return response;
}

export async function updateProfile(payload: ProfileUpdateRequest) {
  const response = await fetchJson<AuthSessionResponse>('/api/auth/profile', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  invalidateApiCache(['/api/auth/me', '/api/my/summary', '/api/community-routes', '/api/reviews']);
  return response;
}

