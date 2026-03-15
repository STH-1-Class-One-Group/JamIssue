import { getClientConfig } from '../config';
import type {
  AdminPlace,
  AdminSummaryResponse,
  AuthSessionResponse,
  BootstrapResponse,
  Comment,
  CommentCreateRequest,
  MyPageResponse,
  PlaceVisibilityRequest,
  ProviderKey,
  PublicImportResponse,
  Review,
  ReviewCreateRequest,
  StampState,
  StampToggleRequest,
  UploadResponse,
} from '../types';

class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const { apiBaseUrl } = getClientConfig();
  const headers = new Headers(init?.headers || undefined);
  const isFormData = typeof FormData !== 'undefined' && init?.body instanceof FormData;

  if (!isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    credentials: 'include',
    cache: 'no-store',
    ...init,
    headers,
  });

  if (!response.ok) {
    let message = '요청을 처리하지 못했어요.';
    try {
      const payload = (await response.json()) as { detail?: string };
      if (payload.detail) {
        message = payload.detail;
      }
    } catch {
      message = response.statusText || message;
    }
    throw new ApiError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export function getApiBaseUrl() {
  return getClientConfig().apiBaseUrl;
}

export function getProviderLoginUrl(provider: ProviderKey, nextUrl: string) {
  return `${getApiBaseUrl()}/api/auth/${provider}/login?next=${encodeURIComponent(nextUrl)}`;
}

export function getAuthSession() {
  return fetchJson<AuthSessionResponse>('/api/auth/me');
}

export function logout() {
  return fetchJson<AuthSessionResponse>('/api/auth/logout', {
    method: 'POST',
  });
}

export function getBootstrap() {
  return fetchJson<BootstrapResponse>('/api/bootstrap');
}

export function getReviews(params?: { placeId?: string; userId?: string }) {
  const search = new URLSearchParams();
  if (params?.placeId) {
    search.set('placeId', params.placeId);
  }
  if (params?.userId) {
    search.set('userId', params.userId);
  }
  const query = search.toString();
  return fetchJson<Review[]>(`/api/reviews${query ? `?${query}` : ''}`);
}

export function createReview(payload: ReviewCreateRequest) {
  return fetchJson<Review>('/api/reviews', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function getReviewComments(reviewId: string) {
  return fetchJson<Comment[]>(`/api/reviews/${reviewId}/comments`);
}

export function createComment(reviewId: string, payload: CommentCreateRequest) {
  return fetchJson<Comment[]>(`/api/reviews/${reviewId}/comments`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function uploadReviewImage(file: File) {
  const body = new FormData();
  body.append('file', file);
  return fetchJson<UploadResponse>('/api/reviews/upload', {
    method: 'POST',
    body,
  });
}

export function getMySummary() {
  return fetchJson<MyPageResponse>('/api/my/summary');
}

export function toggleStamp(payload: StampToggleRequest) {
  return fetchJson<StampState>('/api/stamps/toggle', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function getAdminSummary() {
  return fetchJson<AdminSummaryResponse>('/api/admin/summary');
}

export function updatePlaceVisibility(placeId: string, payload: PlaceVisibilityRequest) {
  return fetchJson<AdminPlace>(`/api/admin/places/${placeId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function importPublicData() {
  return fetchJson<PublicImportResponse>('/api/admin/import/public-data', {
    method: 'POST',
  });
}