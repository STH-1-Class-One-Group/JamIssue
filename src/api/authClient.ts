import type { AuthProvider, AuthSessionResponse, ProfileUpdateRequest } from '../types';
import { fetchJson, getApiBaseUrl, invalidateApiCache } from './core';
import { prepareProfileAvatarUpload } from '../lib/profileAvatarUpload';

type AvatarMutationResponse = AuthSessionResponse | { auth: AuthSessionResponse };

const AUTH_RELATED_CACHE_PREFIXES = [
  '/api/auth/me',
  '/api/map-bootstrap',
  '/api/my/summary',
  '/api/community-routes',
  '/api/reviews',
  '/api/review-feed',
];

function normalizeAuthResponse(response: AvatarMutationResponse) {
  return 'auth' in response ? response.auth : response;
}

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
  invalidateApiCache(AUTH_RELATED_CACHE_PREFIXES);
  return response;
}

export async function updateProfile(payload: ProfileUpdateRequest) {
  const response = await fetchJson<AuthSessionResponse>('/api/auth/profile', {
    method: 'PATCH',
    body: JSON.stringify({ nickname: payload.nickname }),
  });
  invalidateApiCache(AUTH_RELATED_CACHE_PREFIXES);
  return response;
}

export async function uploadProfileAvatar(file: File) {
  const preparedFile = await prepareProfileAvatarUpload(file);
  const formData = new FormData();
  formData.append('file', preparedFile);

  const response = await fetchJson<AvatarMutationResponse>('/api/me/avatar', {
    method: 'POST',
    body: formData,
  });
  invalidateApiCache(AUTH_RELATED_CACHE_PREFIXES);
  return normalizeAuthResponse(response);
}

export async function deleteProfileAvatar() {
  const response = await fetchJson<AvatarMutationResponse>('/api/me/avatar', {
    method: 'DELETE',
  });
  invalidateApiCache(AUTH_RELATED_CACHE_PREFIXES);
  return normalizeAuthResponse(response);
}

