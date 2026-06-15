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

export type TourismPrimaryType = 'restaurant' | 'attraction' | 'culture' | 'leports' | 'lodging' | 'shopping';
export type TourismSubType = 'cafe' | 'bakery' | 'restaurant_general' | 'unknown';
export type TourismDisplayGroup = 'restaurant' | 'cafe' | 'attraction' | 'culture' | 'leports' | 'lodging' | 'shopping';
export type TourismCurationStatus = 'raw_kto' | 'curated';
export type TourismDisplayGroupFilter = 'all' | TourismDisplayGroup;

export interface TourismFacets {
  categories: TourismFacetOption[];
  districts: TourismFacetOption[];
  contentTypes: TourismFacetOption[];
  ktoFacets: TourismFacetOption[];
  primaryTypes?: TourismFacetOption[];
  subTypes?: TourismFacetOption[];
  displayGroups?: TourismFacetOption[];
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
  primaryType?: TourismPrimaryType | null;
  subType?: TourismSubType | null;
  displayGroup?: TourismDisplayGroup | null;
  officialCategoryLabel?: string | null;
  curationStatus?: TourismCurationStatus | null;
  ktoContentTypeId?: string | null;
  ktoContentTypeLabel?: string | null;
  ktoCategoryCode1?: string | null;
  ktoCategoryLabel1?: string | null;
  ktoCategoryCode2?: string | null;
  ktoCategoryLabel2?: string | null;
  ktoCategoryCode3?: string | null;
  ktoCategoryLabel3?: string | null;
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
  hasDetail?: boolean;
  detailKind?: string | null;
  isCurated: boolean;
  curatedPlace: TourismCuratedPlaceLink | null;
}

export interface TourismPlacesResponse {
  sourceReady: boolean;
  sourceName: string | null;
  importedAt: string | null;
  total?: number;
  facets: TourismFacets;
  items: TourismPlaceItem[];
}

export interface TourismDetailImage {
  url: string;
  thumbnailUrl: string | null;
}

export interface TourismDetailSectionItem {
  label: string;
  value: string;
}

export interface TourismDetailSection {
  title: string;
  items: TourismDetailSectionItem[];
}

export interface TourismPlaceDetailItem extends TourismPlaceItem {
  overview: string | null;
  contact: string | null;
  homepageUrl: string | null;
  images: TourismDetailImage[];
  displaySections: TourismDetailSection[];
  detail: {
    restaurant?: Record<string, unknown>;
    lodging?: Record<string, unknown>;
    attraction?: Record<string, unknown>;
    culture?: Record<string, unknown>;
    leports?: Record<string, unknown>;
    shopping?: Record<string, unknown>;
  };
}

export interface TourismPlaceDetailResponse {
  sourceReady: boolean;
  item: TourismPlaceDetailItem | null;
}

export interface TourismPlacesQuery {
  scope?: 'all' | string | null;
  category?: string | null;
  displayGroup?: TourismDisplayGroup | string | null;
  primaryType?: TourismPrimaryType | string | null;
  subType?: TourismSubType | string | null;
  district?: string | null;
  ktoContentTypeId?: string | null;
  ktoFacet?: string | null;
  limit?: number | null;
}
