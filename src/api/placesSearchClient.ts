import { fetchJson } from './core';

export interface PlaceSearchResult {
  placeId: string;
  label: string;
  subLabel: string;
  matchType: string;
}

export interface PlacesSearchResponse {
  items: PlaceSearchResult[];
}

export function buildPlacesSearchPath({ q, limit = 10 }: { q: string; limit?: number }) {
  const params = new URLSearchParams();
  params.set('q', q.trim());
  params.set('limit', String(limit));
  return `/api/places/search?${params.toString()}`;
}

export function searchPlaces(params: { q: string; limit?: number }, init?: RequestInit) {
  return fetchJson<PlacesSearchResponse>(buildPlacesSearchPath(params), init);
}
