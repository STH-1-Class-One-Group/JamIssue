/*
 * File: festival-series.ts
 * Purpose: Merge adjacent or overlapping festival periods into readable event series.
 * Primary Responsibility: Own festival series keys, period merge rules, and row grouping.
 * Design Intent: Keep deduplication and grouping policy separate from payload parsing and DTO assembly.
 * Non-Goals: This file does not read HTTP requests, query Supabase, or write responses.
 * Dependencies: Festival ID, text payload helpers, date helpers, and domain contracts.
 */
import { toSeoulDateKey } from '../../lib/dates';
import type { FestivalEventRow, NormalizedFestivalItem } from './contracts';
import { createFestivalExternalId } from './festival-id';
import { isFestivalRowInTargetArea, readMergedExternalIds, readObjectPayload } from './festival-text';

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

export function mergeImportedFestivalItems(items: NormalizedFestivalItem[]) {
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

export function deduplicateImportedFestivalItemsByExternalId(items: NormalizedFestivalItem[]) {
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
