/*
 * File: contracts.ts
 * Purpose: Define public tourism read-model contracts for Worker responses.
 * Primary Responsibility: Keep stored KTO row shapes and Front DTO shapes near the tourism read domain.
 * Design Intent: Expose KTO-backed tourism data without leaking Supabase internals or upstream raw payloads.
 * Non-Goals: This file does not sync KTO data, call external APIs, or modify curated map data.
 * Dependencies: Worker JSON primitives and Supabase kto_place/kto_sync_state rows.
 */
import type { WorkerJsonRecord } from '../../types';

export interface TourismSourceRow extends WorkerJsonRecord {
  resource_type: 'places';
  source_name?: string | null;
  last_success_at?: string | null;
  last_imported_at?: string | null;
}

export interface TourismCuratedLinkRow {
  map?: {
    position_id?: string | number | null;
    slug?: string | null;
    name?: string | null;
  } | null;
}

export interface TourismPlaceRow extends WorkerJsonRecord {
  external_id: string;
  display_name: string;
  category: string;
  district: string;
  content_type_id?: string | null;
  content_type_label?: string | null;
  cat1?: string | null;
  cat1_label?: string | null;
  cat2?: string | null;
  cat2_label?: string | null;
  cat3?: string | null;
  cat3_label?: string | null;
  kto_facet?: string | null;
  address?: string | null;
  road_address?: string | null;
  summary?: string | null;
  image_url?: string | null;
  source_page_url?: string | null;
  latitude?: string | number | null;
  longitude?: string | number | null;
  source_updated_at?: string | null;
  kto_place_map_link?: TourismCuratedLinkRow[] | null;
}

export interface TourismFacetRow extends WorkerJsonRecord {
  content_type_id?: string | null;
  content_type_label?: string | null;
  kto_facet?: string | null;
  district?: string | null;
}

export interface TourismCuratedPlace {
  positionId: number;
  slug: string;
  name: string;
}

export interface TourismFacets {
  contentTypes: Array<{ id: string; label: string | null; count: number }>;
  ktoFacets: Array<{ key: string; label: string | null; count: number }>;
  districts: Array<{ name: string; count: number }>;
}

export interface TourismPlaceItem {
  id: string;
  name: string;
  category: string;
  ktoContentTypeId: string | null;
  ktoContentTypeLabel: string | null;
  ktoCategoryCode1: string | null;
  ktoCategoryLabel1: string | null;
  ktoCategoryCode2: string | null;
  ktoCategoryLabel2: string | null;
  ktoCategoryCode3: string | null;
  ktoCategoryLabel3: string | null;
  ktoFacet: string | null;
  district: string;
  address: string | null;
  roadAddress: string | null;
  summary: string;
  imageUrl: string | null;
  sourcePageUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  sourceUpdatedAt: string | null;
  isCurated: boolean;
  curatedPlace: TourismCuratedPlace | null;
}

export interface TourismPlacesResponse {
  sourceReady: boolean;
  sourceName: string | null;
  importedAt: string | null;
  facets: TourismFacets;
  items: TourismPlaceItem[];
}
