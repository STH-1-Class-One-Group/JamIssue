/*
 * File: tourismClient.ts
 * Purpose: Provide Front consumers with the Worker tourism places API client.
 * Primary Responsibility: Build supported `/api/tourism/places` query strings from public filter params.
 * Design Intent: Hide Worker endpoint mechanics behind a small typed client while avoiding any Supabase/KTO browser calls.
 * Non-Goals: This file does not call KTO/OpenAPI, read Supabase directly, or implement tourism rendering policy.
 * Dependencies: Front fetchJson helper and tourism public contract types.
 */
import type { TourismPlacesResponse } from '../tourismTypes';
import { fetchJson } from './core';

export interface TourismPlacesParams {
  category?: string | null;
  district?: string | null;
  ktoContentTypeId?: string | null;
  ktoFacet?: string | null;
  limit?: number | null;
}

function appendParam(searchParams: URLSearchParams, key: string, value: string | number | null | undefined) {
  if (value === null || value === undefined || value === '') {
    return;
  }
  searchParams.set(key, String(value));
}

/**
 * Loads KTO tourism places through the Worker public API.
 *
 * The browser intentionally knows only this contract and supported filters; all
 * Supabase row mapping and KTO sync details stay inside the Worker/Admin side.
 */
export function getTourismPlaces(params: TourismPlacesParams = {}) {
  const searchParams = new URLSearchParams();
  appendParam(searchParams, 'category', params.category);
  appendParam(searchParams, 'district', params.district);
  appendParam(searchParams, 'ktoContentTypeId', params.ktoContentTypeId);
  appendParam(searchParams, 'ktoFacet', params.ktoFacet);
  appendParam(searchParams, 'limit', params.limit);
  const query = searchParams.toString();
  return fetchJson<TourismPlacesResponse>(`/api/tourism/places${query ? `?${query}` : ''}`);
}
