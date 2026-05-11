/*
 * File: contracts.ts
 * Purpose: Define Worker festival domain-local contracts.
 * Primary Responsibility: Keep festival row, DTO, import, and cache shapes near their owning domain.
 * Design Intent: Prevent festival implementation details from leaking into the global Worker type barrel.
 * Non-Goals: This file does not perform Supabase I/O, response mapping, or request handling.
 * Dependencies: Worker JSON primitives from the local Worker runtime contract.
 */
import type { WorkerJsonRecord } from '../../types';

export interface FestivalEventRow {
  public_event_id: string | number;
  title: string;
  venue_name?: string | null;
  district?: string | null;
  address?: string | null;
  road_address?: string | null;
  starts_at: string;
  ends_at: string;
  summary?: string | null;
  source_page_url?: string | null;
  latitude?: unknown;
  longitude?: unknown;
}

export interface FestivalSourceRow {
  source_id: string | number;
  source_key?: string | null;
  name?: string | null;
  last_imported_at?: string | null;
}

export interface FestivalExistingEventRow {
  public_event_id: string | number;
  external_id?: string | null;
}

export interface NormalizedFestivalItem {
  externalId: string;
  title: string;
  venueName: string | null;
  district: string;
  address: string | null;
  roadAddress: string | null;
  startsAt: string;
  endsAt: string;
  homepageUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  summary: string;
  rawPayload: unknown;
  sourceUpdatedAt: string | null;
}

export interface FestivalImportOptions {
  sourceName?: unknown;
  sourceUrl?: unknown;
  importedAt?: unknown;
}

export interface FestivalUpsertRow {
  source_id: string | number;
  external_id: string;
  title: string;
  venue_name: string | null;
  district: string;
  address: string | null;
  road_address: string | null;
  latitude: number | null;
  longitude: number | null;
  starts_at: string;
  ends_at: string;
  summary: string;
  description: string;
  source_page_url: string | null;
  source_updated_at: string | null;
  sync_status: 'imported';
  raw_payload: unknown;
  normalized_payload: WorkerJsonRecord;
  updated_at: string;
  created_at: string;
}

export interface FestivalCard {
  id: string;
  title: string;
  venueName: string | null;
  startDate: string;
  endDate: string;
  homepageUrl: string | null;
  roadAddress: string | null;
  latitude: number | null;
  longitude: number | null;
  isOngoing: boolean;
}

export interface FestivalBannerItem {
  id: string;
  title: string;
  venueName: string | null;
  district: string;
  startDate: string;
  endDate: string;
  dateLabel: string;
  summary: string;
  sourcePageUrl: string | null;
  linkedPlaceName: null;
  isOngoing: boolean;
}

export interface FestivalCacheState {
  expiresAt: number;
  syncAt: number;
  value: FestivalCard[] | null;
  pending: Promise<FestivalCard[]> | null;
}
