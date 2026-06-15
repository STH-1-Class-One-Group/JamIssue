/*
 * File: tourismTaxonomy.ts
 * Purpose: Adapt Worker tourism taxonomy fields into Web Front display labels and filters.
 * Primary Responsibility: Keep KTO canonical taxonomy presentation rules out of map components.
 * Design Intent: Preserve official provider categories while letting the UI use display groups such as cafe.
 * Non-Goals: This module does not infer taxonomy from names, mutate API payloads, or define provider import rules.
 * Dependencies: Tourism consumer contract types from `tourismTypes`.
 */
import type { TourismDisplayGroup, TourismDisplayGroupFilter, TourismFacetOption, TourismPlaceItem } from '../tourismTypes';

type TourismDisplayGroupMeta = {
  label: string;
  icon: string;
};

export const tourismDisplayGroupInfo: Record<TourismDisplayGroup, TourismDisplayGroupMeta> = {
  restaurant: { label: '음식점', icon: '🍽️' },
  cafe: { label: '카페', icon: '☕' },
  attraction: { label: '관광지', icon: '🌸' },
  culture: { label: '문화시설', icon: '🎨' },
  leports: { label: '레포츠', icon: '🚲' },
  lodging: { label: '숙박', icon: '🛏️' },
  shopping: { label: '쇼핑', icon: '🛍️' },
};

const defaultDisplayGroupOrder: TourismDisplayGroup[] = [
  'restaurant',
  'cafe',
  'attraction',
  'culture',
  'leports',
  'lodging',
  'shopping',
];

export type TourismDisplayGroupItem = {
  key: TourismDisplayGroupFilter;
  label: string;
  icon?: string;
  count?: number;
};

/**
 * Resolves the Web Front display group for a tourism item.
 *
 * The function prefers the canonical Worker `displayGroup` field and only falls back
 * to legacy `category` values for compatibility with older bootstrap fixtures.
 */
export function getTourismDisplayGroup(place: TourismPlaceItem): TourismDisplayGroup | null {
  if (isTourismDisplayGroup(place.displayGroup)) {
    return place.displayGroup;
  }
  if (place.category === 'cafe') {
    return 'cafe';
  }
  if (isTourismDisplayGroup(place.category)) {
    return place.category;
  }
  return null;
}

/**
 * Returns the user-facing group label for tourism map chips and badges.
 *
 * Official provider labels remain available as fallback metadata, but the primary
 * label follows the canonical `displayGroup` contract.
 */
export function getTourismDisplayGroupLabel(place: TourismPlaceItem) {
  const displayGroup = getTourismDisplayGroup(place);
  return displayGroup ? tourismDisplayGroupInfo[displayGroup].label : place.officialCategoryLabel || place.ktoContentTypeLabel || place.category || null;
}

/**
 * Builds KTO display-group chip items from Worker facets.
 *
 * Unsupported provider keys are ignored so source taxonomy drift cannot leak into
 * the map filter UI before the consumer contract is updated.
 */
export function buildTourismDisplayGroupItems(facets: TourismFacetOption[] | undefined): TourismDisplayGroupItem[] {
  const byKey = new Map<TourismDisplayGroup, TourismFacetOption>();
  for (const facet of facets ?? []) {
    if (isTourismDisplayGroup(facet.key)) {
      byKey.set(facet.key, facet);
    }
  }

  const groups = defaultDisplayGroupOrder
    .filter((key) => byKey.has(key))
    .map((key) => {
      const facet = byKey.get(key);
      const info = tourismDisplayGroupInfo[key];
      return {
        key,
        label: facet?.label || info.label,
        icon: info.icon,
        count: facet?.count,
      };
    });

  return [{ key: 'all', label: '전체' }, ...groups];
}

function isTourismDisplayGroup(value: unknown): value is TourismDisplayGroup {
  return typeof value === 'string' && value in tourismDisplayGroupInfo;
}
