import type { AuthProvider, AuthSessionResponse, ProfileUpdateRequest } from '../types';
import { fetchJson, getApiBaseUrl, invalidateApiCache } from './core';

function getProviderUrlBase() {
  const apiBaseUrl = getApiBaseUrl();
  if (apiBaseUrl) {
    return apiBaseUrl;
  }
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return 'http://localhost:8000';
}

export function buildProviderAuthUrl(providerUrl: string, nextUrl: string) {
  const url = new URL(providerUrl, getProviderUrlBase());
  url.searchParams.set('next', nextUrl);
  return url.toString();
}

export function getProviderLoginUrl(provider: AuthProvider, nextUrl: string) {
  return provider.loginUrl ? buildProviderAuthUrl(provider.loginUrl, nextUrl) : null;
}

export function getProviderLinkUrl(provider: AuthProvider, nextUrl: string) {
  return provider.linkUrl ? buildProviderAuthUrl(provider.linkUrl, nextUrl) : null;
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

