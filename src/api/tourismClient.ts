/*
 * File: tourismClient.ts
 * Purpose: Request KTO tourism places through the Worker consumer API.
 * Primary Responsibility: Convert UI list/detail requests into stable Worker tourism API paths.
 * Design Intent: Keep browser code behind the Worker contract and prevent direct KTO/OpenAPI, Supabase, or admin import calls.
 * Non-Goals: This client does not normalize provider rows or perform admin import/sync operations.
 * Dependencies: `fetchJson` API wrapper and `TourismPlacesResponse` DTO.
 */
import type { TourismPlaceDetailResponse, TourismPlacesQuery, TourismPlacesResponse } from '../tourismTypes';
import { fetchJson } from './core';

function appendOptionalParam(params: URLSearchParams, key: string, value: string | number | null | undefined) {
  if (value === null || value === undefined || value === '') {
    return;
  }
  params.set(key, String(value));
}

export function buildTourismPlacesPath(query: TourismPlacesQuery = {}) {
  const params = new URLSearchParams();

  appendOptionalParam(params, 'scope', query.scope);
  appendOptionalParam(params, 'category', query.category);
  appendOptionalParam(params, 'displayGroup', query.displayGroup);
  appendOptionalParam(params, 'primaryType', query.primaryType);
  appendOptionalParam(params, 'subType', query.subType);
  appendOptionalParam(params, 'district', query.district);
  appendOptionalParam(params, 'ktoContentTypeId', query.ktoContentTypeId);
  appendOptionalParam(params, 'ktoFacet', query.ktoFacet);
  appendOptionalParam(params, 'limit', query.limit);

  const queryString = params.toString();
  return queryString ? `/api/tourism/places?${queryString}` : '/api/tourism/places';
}

export function getTourismPlaces(query: TourismPlacesQuery = {}, init?: RequestInit) {
  return fetchJson<TourismPlacesResponse>(buildTourismPlacesPath(query), init);
}

export function buildTourismPlaceDetailPath(placeId: string) {
  return `/api/tourism/places/${encodeURIComponent(placeId)}`;
}

export function getTourismPlaceDetail(placeId: string, init?: RequestInit) {
  return fetchJson<TourismPlaceDetailResponse>(buildTourismPlaceDetailPath(placeId), init);
}
