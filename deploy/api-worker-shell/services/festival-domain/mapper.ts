/*
 * File: mapper.ts
 * Purpose: Normalize festival import payloads and map stored festival rows to Worker response DTOs.
 * Primary Responsibility: Own festival parsing, grouping, deduplication, and DTO assembly rules.
 * Design Intent: Keep transformation policy out of HTTP handlers and Supabase repository functions.
 * Non-Goals: This file does not read requests, write responses, or call Supabase.
 * Dependencies: Worker runtime config and date formatting helpers.
 */
import { WorkerFestivalRuntimeConfig } from '../../config/runtime';
import { formatDate, toSeoulDateKey } from '../../lib/dates';
import type {
  FestivalBannerItem,
  FestivalCard,
  FestivalEventRow,
  FestivalUpsertRow,
  NormalizedFestivalItem,
} from './contracts';

const textEncoder = new TextEncoder();

function base64UrlEncode(bytes: Uint8Array) {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function createFestivalExternalId(
  title: string,
  startDate: Date,
  venueName: string | null,
  roadAddress: string | null,
) {
  const seed = `${title}|${startDate.toISOString()}|${venueName || ''}|${roadAddress || ''}`;
  const bytes = textEncoder.encode(seed);
  return `festival-${base64UrlEncode(bytes).slice(0, WorkerFestivalRuntimeConfig.externalIdTokenLength)}`;
}

function isFestivalOngoingInSeoul(startsAt: string, endsAt: string, nowValue = Date.now()) {
  if (!startsAt || !endsAt) {
    return false;
  }
  const startDateKey = toSeoulDateKey(startsAt);
  const endDateKey = toSeoulDateKey(endsAt);
  const nowDateKey = toSeoulDateKey(nowValue);
  return startDateKey <= nowDateKey && endDateKey >= nowDateKey;
}

function normalizeFestivalSeriesKeyPart(value: unknown) {
  return String(value || '')
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[&_·/|]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .toLowerCase();
}

function buildFestivalSeriesKey(row: FestivalEventRow) {
  return [
    normalizeFestivalSeriesKeyPart(row.title),
    normalizeFestivalSeriesKeyPart(row.venue_name ?? row.road_address ?? row.address ?? ''),
  ].join('|');
}

function parseSeoulDateKey(dateKey: string) {
  return new Date(`${dateKey}T00:00:00+09:00`);
}

function areFestivalSeriesDatesAdjacent(leftEnd: string, rightStart: string) {
  const leftKey = toSeoulDateKey(leftEnd);
  const rightKey = toSeoulDateKey(rightStart);
  if (!leftKey || !rightKey) {
    return false;
  }
  const nextDate = parseSeoulDateKey(leftKey);
  nextDate.setDate(nextDate.getDate() + 1);
  return parseSeoulDateKey(rightKey).getTime() <= nextDate.getTime();
}

function areFestivalSeriesPeriodsMergeable(leftRow: FestivalEventRow, rightRow: FestivalEventRow) {
  const leftStartTime = new Date(leftRow.starts_at).getTime();
  const leftEndTime = new Date(leftRow.ends_at).getTime();
  const rightStartTime = new Date(rightRow.starts_at).getTime();
  const rightEndTime = new Date(rightRow.ends_at).getTime();
  if (
    !Number.isFinite(leftStartTime) ||
    !Number.isFinite(leftEndTime) ||
    !Number.isFinite(rightStartTime) ||
    !Number.isFinite(rightEndTime)
  ) {
    return false;
  }
  if (rightStartTime <= leftEndTime && rightEndTime >= leftStartTime) {
    return true;
  }
  return areFestivalSeriesDatesAdjacent(leftRow.ends_at, rightRow.starts_at);
}

function buildImportedFestivalSeriesKey(item: NormalizedFestivalItem) {
  return [
    normalizeFestivalSeriesKeyPart(item.title),
    normalizeFestivalSeriesKeyPart(item.venueName ?? item.roadAddress ?? item.address ?? ''),
  ].join('|');
}

function areImportedFestivalSeriesPeriodsMergeable(
  leftItem: NormalizedFestivalItem,
  rightItem: NormalizedFestivalItem,
) {
  const leftStartTime = new Date(leftItem.startsAt).getTime();
  const leftEndTime = new Date(leftItem.endsAt).getTime();
  const rightStartTime = new Date(rightItem.startsAt).getTime();
  const rightEndTime = new Date(rightItem.endsAt).getTime();
  if (
    !Number.isFinite(leftStartTime) ||
    !Number.isFinite(leftEndTime) ||
    !Number.isFinite(rightStartTime) ||
    !Number.isFinite(rightEndTime)
  ) {
    return false;
  }
  if (rightStartTime <= leftEndTime && rightEndTime >= leftStartTime) {
    return true;
  }
  return areFestivalSeriesDatesAdjacent(leftItem.endsAt, rightItem.startsAt);
}

function mergeImportedFestivalItems(items: NormalizedFestivalItem[]) {
  const sortedItems = [...items].sort((left, right) => {
    const keyOrder = buildImportedFestivalSeriesKey(left).localeCompare(buildImportedFestivalSeriesKey(right));
    if (keyOrder !== 0) {
      return keyOrder;
    }
    return new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime();
  });
  const mergedItems: NormalizedFestivalItem[] = [];
  for (const item of sortedItems) {
    const previous = mergedItems[mergedItems.length - 1];
    if (
      previous &&
      buildImportedFestivalSeriesKey(previous) === buildImportedFestivalSeriesKey(item) &&
      areImportedFestivalSeriesPeriodsMergeable(previous, item)
    ) {
      mergeImportedFestivalItem(previous, item);
      continue;
    }
    mergedItems.push({
      ...item,
      externalId: createFestivalExternalId(item.title, new Date(item.startsAt), item.venueName, item.roadAddress),
      rawPayload: {
        ...readObjectPayload(item.rawPayload),
        mergedExternalIds: [item.externalId].filter(Boolean),
      },
    });
  }
  return mergedItems;
}

function mergeImportedFestivalItem(target: NormalizedFestivalItem, source: NormalizedFestivalItem) {
  if (new Date(source.startsAt).getTime() < new Date(target.startsAt).getTime()) {
    target.startsAt = source.startsAt;
  }
  if (new Date(source.endsAt).getTime() > new Date(target.endsAt).getTime()) {
    target.endsAt = source.endsAt;
  }
  if (!target.summary && source.summary) {
    target.summary = source.summary;
  }
  if (!target.homepageUrl && source.homepageUrl) {
    target.homepageUrl = source.homepageUrl;
  }
  if (!target.roadAddress && source.roadAddress) {
    target.roadAddress = source.roadAddress;
  }
  if (!target.address && source.address) {
    target.address = source.address;
  }
  if (
    (!Number.isFinite(Number(target.latitude)) || !Number.isFinite(Number(target.longitude))) &&
    Number.isFinite(Number(source.latitude)) &&
    Number.isFinite(Number(source.longitude))
  ) {
    target.latitude = source.latitude;
    target.longitude = source.longitude;
  }
  target.rawPayload = {
    ...readObjectPayload(target.rawPayload),
    mergedExternalIds: [
      ...new Set([
        ...readMergedExternalIds(target.rawPayload),
        ...readMergedExternalIds(source.rawPayload),
        source.externalId,
      ].filter(Boolean)),
    ],
  };
  target.externalId = createFestivalExternalId(target.title, new Date(target.startsAt), target.venueName, target.roadAddress);
}

function deduplicateImportedFestivalItemsByExternalId(items: NormalizedFestivalItem[]) {
  const grouped = new Map<string, NormalizedFestivalItem>();
  for (const item of items) {
    const key = String(item.externalId || '');
    const existing = grouped.get(key);
    if (!existing) {
      grouped.set(key, { ...item });
      continue;
    }
    mergeImportedFestivalItem(existing, item);
  }
  return [...grouped.values()];
}

function readObjectPayload(payload: unknown) {
  return payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : {};
}

function readMergedExternalIds(payload: unknown) {
  const mergedExternalIds = readObjectPayload(payload).mergedExternalIds;
  return Array.isArray(mergedExternalIds) ? mergedExternalIds : [];
}

function readFestivalText(payload: object | null | undefined, keys: string[]) {
  const record = (payload ?? {}) as Record<string, unknown>;
  for (const key of keys) {
    const value = record[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value).trim();
    }
  }
  return null;
}

export function parseFestivalDate(value: unknown, endOfDay = false) {
  if (!value) {
    return null;
  }
  const text = String(value).trim();
  if (!text) {
    return null;
  }
  if (/^\d{8}$/.test(text)) {
    const year = Number(text.slice(0, 4));
    const month = Number(text.slice(4, 6));
    const day = Number(text.slice(6, 8));
    const date = new Date(Date.UTC(year, month - 1, day, endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0));
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  if (endOfDay && /^\d{4}-\d{2}-\d{2}$/.test(text)) {
    parsed.setUTCHours(23, 59, 59, 0);
  }
  return parsed;
}

export function getFestivalWindowEnd(now: number) {
  return new Date(now + WorkerFestivalRuntimeConfig.windowMs);
}

export function getTargetFestivalCityKeyword(env: { APP_PUBLIC_EVENT_CITY_KEYWORD?: unknown }) {
  const cityKeyword = String(env.APP_PUBLIC_EVENT_CITY_KEYWORD || '대전').trim();
  return cityKeyword || '대전';
}

function getTargetFestivalAreaKeywords(cityKeyword: string) {
  const normalized = String(cityKeyword || '').trim();
  const keywords = new Set(normalized ? [normalized] : []);
  if (normalized.includes('대전')) {
    ['대전광역시', '동구', '중구', '서구', '유성구', '대덕구'].forEach((keyword) => keywords.add(keyword));
  }
  return [...keywords];
}

function isFestivalRowInTargetArea(payload: object, cityKeyword: string) {
  const haystack = [
    readFestivalText(payload, ['district', 'signguNm']),
    readFestivalText(payload, ['title', 'eventTitle', 'fstvlNm', 'eventNm']),
    readFestivalText(payload, ['venueName', 'venue_name', 'fstvlCo', 'opar']),
    readFestivalText(payload, ['roadAddress', 'road_address', 'rdnmadr']),
    readFestivalText(payload, ['address', 'lnmadr']),
  ]
    .filter(Boolean)
    .join(' ');
  return getTargetFestivalAreaKeywords(cityKeyword).some((keyword) => haystack.includes(keyword));
}

function deriveImportedFestivalDistrict(payload: object, cityKeyword: string) {
  const explicit = readFestivalText(payload, ['district', 'signguNm']);
  if (explicit) {
    return explicit;
  }
  const combined = [
    readFestivalText(payload, ['roadAddress', 'road_address', 'rdnmadr']),
    readFestivalText(payload, ['address', 'lnmadr']),
    readFestivalText(payload, ['venueName', 'venue_name', 'fstvlCo', 'opar']),
  ]
    .filter(Boolean)
    .join(' ');
  const districtMatch = combined.match(/([가-힣]+구)/);
  return districtMatch?.[1] || cityKeyword;
}

function parseFestivalCoordinate(value: unknown) {
  if (value === undefined || value === null || String(value).trim() === '') {
    return null;
  }
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

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

export function groupFestivalRowsBySeries(rows: FestivalEventRow[]) {
  return rows.reduce<FestivalEventRow[]>((acc, row) => {
    const previous = acc[acc.length - 1];
    if (
      previous &&
      buildFestivalSeriesKey(previous) === buildFestivalSeriesKey(row) &&
      areFestivalSeriesPeriodsMergeable(previous, row)
    ) {
      if (new Date(row.ends_at).getTime() > new Date(previous.ends_at).getTime()) {
        previous.ends_at = row.ends_at;
      }
      if (!previous.summary && row.summary) {
        previous.summary = row.summary;
      }
      if (!previous.source_page_url && row.source_page_url) {
        previous.source_page_url = row.source_page_url;
      }
      if (!previous.road_address && row.road_address) {
        previous.road_address = row.road_address;
      }
      if (!previous.address && row.address) {
        previous.address = row.address;
      }
      if (
        (!Number.isFinite(Number(previous.latitude)) || !Number.isFinite(Number(previous.longitude))) &&
        Number.isFinite(Number(row.latitude)) &&
        Number.isFinite(Number(row.longitude))
      ) {
        previous.latitude = row.latitude;
        previous.longitude = row.longitude;
      }
      return acc;
    }
    acc.push({ ...row });
    return acc;
  }, []);
}

export function isFestivalRowInConfiguredArea(row: FestivalEventRow, cityKeyword: string) {
  return isFestivalRowInTargetArea(row, cityKeyword);
}

export function buildFestivalCard(row: FestivalEventRow, now: number): FestivalCard {
  return {
    id: String(row.public_event_id),
    title: row.title,
    venueName: row.venue_name ?? null,
    startDate: row.starts_at ? toSeoulDateKey(row.starts_at) : '',
    endDate: row.ends_at ? toSeoulDateKey(row.ends_at) : '',
    homepageUrl: row.source_page_url ?? null,
    roadAddress: row.road_address ?? row.address ?? null,
    latitude: parseFestivalCoordinate(row.latitude),
    longitude: parseFestivalCoordinate(row.longitude),
    isOngoing: isFestivalOngoingInSeoul(row.starts_at, row.ends_at, now),
  };
}

export function buildBannerItem(row: FestivalEventRow, now: number, emptyDateLabel = ''): FestivalBannerItem {
  return {
    id: String(row.public_event_id),
    title: row.title,
    venueName: row.venue_name ?? null,
    district: row.district ?? '',
    startDate: row.starts_at,
    endDate: row.ends_at,
    dateLabel: row.starts_at && row.ends_at ? `${formatDate(row.starts_at)} - ${formatDate(row.ends_at)}` : emptyDateLabel,
    summary: row.summary ?? '',
    sourcePageUrl: row.source_page_url ?? null,
    linkedPlaceName: null,
    isOngoing: isFestivalOngoingInSeoul(row.starts_at, row.ends_at, now),
  };
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
