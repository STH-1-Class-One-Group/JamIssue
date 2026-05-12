/*
 * File: festival-response-mapper.ts
 * Purpose: Map stored festival rows to public Worker response DTOs.
 * Primary Responsibility: Own festival card and banner item response assembly.
 * Design Intent: Keep response mapping separate from import normalization.
 * Non-Goals: This file does not parse import payloads, merge series, or query Supabase.
 * Dependencies: Date formatting, coordinate parsing, area filtering, and domain contracts.
 */
import { formatDate, toSeoulDateKey } from '../../lib/dates';
import type { FestivalBannerItem, FestivalCard, FestivalEventRow } from './contracts';
import { parseFestivalCoordinate } from './festival-coordinate';
import { isFestivalOngoingInSeoul } from './festival-date';

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
