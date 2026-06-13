/*
 * File: tourismTypes.ts
 * Purpose: Define the Web Front consumer contract for Worker-provided KTO tourism places.
 * Primary Responsibility: Keep tourism API response and item shapes stable at the browser boundary.
 * Design Intent: Store the public consumer DTO near the front-end API client instead of mixing it into map UI internals.
 * Non-Goals: This file does not define admin import payloads, Supabase rows, or KTO/OpenAPI provider contracts.
 * Dependencies: Worker endpoint `GET /api/tourism/places`.
 */

export interface TourismFacetOption {
  key?: string;
  id?: string;
  name?: string;
  label: string;
  count: number;
}

export interface TourismFacets {
  categories: TourismFacetOption[];
  districts: TourismFacetOption[];
  contentTypes: TourismFacetOption[];
  ktoFacets: TourismFacetOption[];
}

export interface TourismCuratedPlaceLink {
  id: string;
  slug?: string | null;
  name: string;
}

export interface TourismPlaceItem {
  id: string;
  name: string;
  title?: string;
  category: string | null;
  ktoContentTypeId?: string | null;
  ktoContentTypeLabel?: string | null;
  ktoFacet?: string | null;
  district: string | null;
  address: string | null;
  roadAddress?: string | null;
  summary: string | null;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  imageUrl: string | null;
  sourcePageUrl?: string | null;
  homepageUrl?: string | null;
  sourceUpdatedAt?: string | null;
  sourceName: string | null;
  isCurated: boolean;
  curatedPlace: TourismCuratedPlaceLink | null;
}

export interface TourismPlacesResponse {
  sourceReady: boolean;
  sourceName: string | null;
  importedAt: string | null;
  facets: TourismFacets;
  items: TourismPlaceItem[];
}

export interface TourismPlacesQuery {
  category?: string | null;
  district?: string | null;
  ktoContentTypeId?: string | null;
  ktoFacet?: string | null;
  limit?: number | null;
}
