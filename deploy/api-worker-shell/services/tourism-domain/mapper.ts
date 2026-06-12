/*
 * File: mapper.ts
 * Purpose: Map stored public-place rows to the public tourism Front DTO.
 * Primary Responsibility: Convert Supabase row naming and scalar types into stable API response fields.
 * Design Intent: Keep public JSON allowlisted so internal IDs, payloads, and provider secrets cannot leak.
 * Non-Goals: This file does not query Supabase, decide filters, or sync upstream KTO records.
 * Dependencies: Tourism domain contracts.
 */
import type { TourismCuratedPlace, TourismPlaceItem, TourismPlaceRow } from './contracts';

function parseCoordinate(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function mapCuratedPlace(row: TourismPlaceRow): TourismCuratedPlace | null {
  const link = row.kto_place_map_link?.find((candidate) => {
    const map = candidate?.map;
    return map?.position_id !== null && map?.position_id !== undefined && Boolean(map?.slug) && Boolean(map?.name);
  });
  if (!link?.map) {
    return null;
  }
  const positionId = Number(link.map.position_id);
  if (!Number.isFinite(positionId)) {
    return null;
  }
  return {
    positionId,
    slug: String(link.map.slug),
    name: String(link.map.name),
  };
}

/**
 * Builds the Front-safe tourism place item.
 *
 * Adding new public fields must happen through the documented API contract and
 * tests because this mapper is the boundary that prevents raw KTO/Supabase data
 * from reaching browsers.
 */
export function mapTourismPlace(row: TourismPlaceRow): TourismPlaceItem {
  const curatedPlace = mapCuratedPlace(row);
  return {
    id: String(row.external_id),
    name: row.display_name,
    category: row.category,
    ktoContentTypeId: row.content_type_id ?? null,
    ktoContentTypeLabel: row.content_type_label ?? null,
    ktoCategoryCode1: row.cat1 ?? null,
    ktoCategoryLabel1: row.cat1_label ?? null,
    ktoCategoryCode2: row.cat2 ?? null,
    ktoCategoryLabel2: row.cat2_label ?? null,
    ktoCategoryCode3: row.cat3 ?? null,
    ktoCategoryLabel3: row.cat3_label ?? null,
    ktoFacet: row.kto_facet ?? null,
    district: row.district,
    address: row.address ?? null,
    roadAddress: row.road_address ?? null,
    summary: row.summary ?? '',
    imageUrl: row.image_url ?? null,
    sourcePageUrl: row.source_page_url ?? null,
    latitude: parseCoordinate(row.latitude),
    longitude: parseCoordinate(row.longitude),
    sourceUpdatedAt: row.source_updated_at ?? null,
    isCurated: Boolean(curatedPlace),
    curatedPlace,
  };
}
