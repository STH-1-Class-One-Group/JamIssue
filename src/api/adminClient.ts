import type { AdminPlace, AdminSummaryResponse, PlaceVisibilityRequest, PublicImportResponse } from '../types';
import { fetchJson, invalidateApiCache } from './core';

export function getAdminSummary() {
  return fetchJson<AdminSummaryResponse>('/api/admin/summary');
}

export async function updatePlaceVisibility(placeId: string, payload: PlaceVisibilityRequest) {
  const response = await fetchJson<AdminPlace>(`/api/admin/places/${placeId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  invalidateApiCache(['/api/admin/summary', '/api/map-bootstrap']);
  return response;
}

export async function importPublicData() {
  const response = await fetchJson<PublicImportResponse>('/api/admin/import/public-data', {
    method: 'POST',
  });
  invalidateApiCache(['/api/admin/summary', '/api/map-bootstrap', '/api/courses/curated', '/api/festivals']);
  return response;
}

