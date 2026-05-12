/*
 * File: festival-import-mapper.ts
 * Purpose: Normalize festival import payloads into persistence-ready rows.
 * Primary Responsibility: Own incoming payload parsing and upsert row assembly.
 * Design Intent: Keep import-specific mapping separate from stored-row response mapping.
 * Non-Goals: This file does not query Supabase, manage cache, or write HTTP responses.
 * Dependencies: Festival date, text, coordinate, ID, series, and domain contracts.
 */
import type { FestivalUpsertRow, NormalizedFestivalItem } from './contracts';
import { parseFestivalCoordinate } from './festival-coordinate';
import { parseFestivalDate } from './festival-date';
import { createFestivalExternalId } from './festival-id';
import { deduplicateImportedFestivalItemsByExternalId, mergeImportedFestivalItems } from './festival-series';
import { deriveImportedFestivalDistrict, isFestivalRowInTargetArea, readFestivalText } from './festival-text';

function normalizeFestivalImportItem(payload: unknown, cityKeyword: string): NormalizedFestivalItem | null {
  if (!payload || typeof payload !== 'object') {
    return null;
  }
  const record = payload as Record<string, unknown>;
  const title = readFestivalText(record, ['title', 'eventTitle', 'name']);
  const venueName = readFestivalText(record, ['venueName', 'venue_name', 'placeName', 'location']);
  const roadAddress = readFestivalText(record, ['roadAddress', 'road_address', 'address']);
  const startsAt = parseFestivalDate(readFestivalText(record, ['startsAt', 'starts_at', 'startDate']));
  const endsAt = parseFestivalDate(readFestivalText(record, ['endsAt', 'ends_at', 'endDate']), true);
  const homepageUrl = readFestivalText(record, ['homepageUrl', 'homepage_url', 'sourcePageUrl', 'source_page_url']);
  const district = deriveImportedFestivalDistrict(
    {
      district: readFestivalText(record, ['district']),
      signguNm: readFestivalText(record, ['signguNm']),
      roadAddress,
      address: readFestivalText(record, ['address']),
      venueName,
      title,
    },
    cityKeyword,
  );
  const latitude = parseFestivalCoordinate(readFestivalText(record, ['latitude', 'lat']));
  const longitude = parseFestivalCoordinate(readFestivalText(record, ['longitude', 'lng']));
  const sourceUpdatedAt = parseFestivalDate(readFestivalText(record, ['sourceUpdatedAt', 'source_updated_at']));
  const areaProbe = {
    district,
    venueName,
    roadAddress,
    address: readFestivalText(record, ['address']),
    title,
  };
  if (!title || !startsAt || !endsAt || !isFestivalRowInTargetArea(areaProbe, cityKeyword)) {
    return null;
  }
  return {
    externalId:
      readFestivalText(record, ['externalId', 'external_id', 'eventSeq', 'id']) ||
      createFestivalExternalId(title, startsAt, venueName, roadAddress),
    title,
    venueName,
    district,
    address: readFestivalText(record, ['address']),
    roadAddress,
    startsAt: startsAt.toISOString(),
    endsAt: endsAt.toISOString(),
    homepageUrl,
    latitude,
    longitude,
    summary:
      readFestivalText(record, ['summary', 'description']) ||
      (venueName ? `${venueName}에서 열리는 ${cityKeyword} 행사예요.` : `${cityKeyword}에서 열리는 행사예요.`),
    rawPayload: record.rawPayload && typeof record.rawPayload === 'object' ? record.rawPayload : record,
    sourceUpdatedAt: sourceUpdatedAt ? sourceUpdatedAt.toISOString() : null,
  };
}

export function normalizeImportedFestivalItems(items: unknown[], cityKeyword: string) {
  return deduplicateImportedFestivalItemsByExternalId(
    mergeImportedFestivalItems(items.map((item) => normalizeFestivalImportItem(item, cityKeyword)).filter(Boolean)),
  );
}

export function buildFestivalUpsertRows(
  sourceId: string | number,
  normalizedItems: NormalizedFestivalItem[],
  nowIso: string,
): FestivalUpsertRow[] {
  return normalizedItems.map((item) => ({
    source_id: sourceId,
    external_id: item.externalId,
    title: item.title,
    venue_name: item.venueName,
    district: item.district,
    address: item.address,
    road_address: item.roadAddress,
    latitude: item.latitude,
    longitude: item.longitude,
    starts_at: item.startsAt,
    ends_at: item.endsAt,
    summary: item.summary,
    description: item.summary,
    source_page_url: item.homepageUrl,
    source_updated_at: item.sourceUpdatedAt,
    sync_status: 'imported',
    raw_payload: item.rawPayload,
    normalized_payload: {
      title: item.title,
      venue_name: item.venueName,
      address: item.address,
      road_address: item.roadAddress,
      starts_at: item.startsAt,
      ends_at: item.endsAt,
      homepage_url: item.homepageUrl,
      latitude: item.latitude,
      longitude: item.longitude,
    },
    updated_at: nowIso,
    created_at: nowIso,
  }));
}
