/*
 * File: repository.ts
 * Purpose: Encapsulate Supabase REST reads for the public tourism API.
 * Primary Responsibility: Own KTO sync-state lookup and filtered kto_place queries for Front read contracts.
 * Design Intent: Keep query construction away from handlers so response mapping remains testable and safe.
 * Non-Goals: This file does not call KTO APIs, perform sync writes, or merge data into curated map rows.
 * Dependencies: Worker Supabase REST helper, Worker runtime limits, and tourism read contracts.
 */
import { WorkerTourismRuntimeConfig } from '../../config/runtime';
import { encodeFilterValue, supabaseRequest } from '../../lib/supabase';
import type { WorkerEnv } from '../../types';
import type { TourismFacetRow, TourismPlaceRow, TourismSourceRow } from './contracts';

export interface TourismPlaceQueryOptions {
  category: string | null;
  district: string | null;
  ktoContentTypeId: string | null;
  ktoFacet: string | null;
  limit: number;
}

const TOURISM_PLACE_SELECT = [
  'external_id',
  'display_name',
  'category',
  'district',
  'content_type_id',
  'content_type_label',
  'cat1',
  'cat1_label',
  'cat2',
  'cat2_label',
  'cat3',
  'cat3_label',
  'kto_facet',
  'address',
  'road_address',
  'summary',
  'image_url',
  'source_page_url',
  'latitude',
  'longitude',
  'source_updated_at',
  'kto_place_map_link(map(position_id,slug,name))',
].join(',');

/**
 * Loads KTO source metadata used by the public tourism read response.
 *
 * A missing row means sync has not initialized the places resource yet; callers
 * convert that state into a stable empty public response.
 */
export async function loadKtoTourismSource(env: WorkerEnv) {
  const rows = await supabaseRequest<TourismSourceRow[]>(
    env,
    'kto_sync_state?select=resource_type,source_name,last_success_at,last_imported_at&resource_type=eq.places&limit=1',
  );
  return rows?.[0] ?? null;
}

/**
 * Loads non-stale KTO public places for Front tourism lists.
 *
 * Filters are intentionally small and explicit to preserve the first public
 * contract and keep ranking/recommendation policy out of this read layer.
 */
export function loadKtoTourismPlaces(env: WorkerEnv, options: TourismPlaceQueryOptions) {
  const filters = ['sync_status=neq.stale'];
  if (options.category) {
    filters.push(`category=eq.${encodeFilterValue(options.category)}`);
  }
  if (options.district) {
    filters.push(`district=eq.${encodeFilterValue(options.district)}`);
  }
  if (options.ktoContentTypeId) {
    filters.push(`content_type_id=eq.${encodeFilterValue(options.ktoContentTypeId)}`);
  }
  if (options.ktoFacet) {
    filters.push(`kto_facet=eq.${encodeFilterValue(options.ktoFacet)}`);
  }
  return supabaseRequest<TourismPlaceRow[]>(
    env,
    `kto_place?select=${TOURISM_PLACE_SELECT}&${filters.join('&')}&order=display_name.asc&limit=${options.limit}`,
  );
}

/**
 * Loads facet source rows from the whole non-stale place set, not the limited
 * card list, so filters remain useful even when the visible list is capped.
 */
export function loadKtoTourismFacetRows(env: WorkerEnv) {
  return supabaseRequest<TourismFacetRow[]>(
    env,
    `kto_place?select=content_type_id,content_type_label,kto_facet,district&sync_status=neq.stale&limit=${WorkerTourismRuntimeConfig.facetQueryLimit}`,
  );
}
