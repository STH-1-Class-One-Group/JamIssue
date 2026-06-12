/*
 * File: tourismTypes.ts
 * Purpose: Define Front-facing tourism API contracts consumed from the Worker.
 * Primary Responsibility: Keep KTO tourism response types separate from Supabase and upstream row details.
 * Design Intent: Make the browser depend only on documented Worker public JSON, not KTO/OpenAPI/Admin schema internals.
 * Non-Goals: This file does not define Supabase rows, KTO raw payloads, or curated map bootstrap models.
 * Dependencies: Worker `GET /api/tourism/places` public contract.
 */
export interface TourismCuratedPlace {
  positionId: number;
  slug: string;
  name: string;
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

export interface TourismFacets {
  contentTypes: Array<{ id: string; label: string | null; count: number }>;
  ktoFacets: Array<{ key: string; label: string | null; count: number }>;
  districts: Array<{ name: string; count: number }>;
}

export interface TourismPlacesResponse {
  sourceReady: boolean;
  sourceName: string | null;
  importedAt: string | null;
  facets: TourismFacets;
  items: TourismPlaceItem[];
}
