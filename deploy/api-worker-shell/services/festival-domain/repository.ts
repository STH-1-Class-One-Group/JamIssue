/*
 * File: repository.ts
 * Purpose: Encapsulate Supabase REST access for the Worker festival domain.
 * Primary Responsibility: Own festival source/event queries, upserts, stale deletes, and source metadata updates.
 * Design Intent: Keep persistence mechanics behind a domain repository so handlers and mappers stay I/O-free.
 * Non-Goals: This file does not normalize import payloads, build HTTP responses, or manage in-memory cache state.
 * Dependencies: Worker Supabase REST helper and festival domain contracts.
 */
import type { WorkerEnv } from '../../types';
import { encodeFilterValue, supabaseRequest } from '../../lib/supabase';
import { WorkerFestivalRuntimeConfig } from '../../config/runtime';
import type { FestivalEventRow, FestivalExistingEventRow, FestivalSourceRow, FestivalUpsertRow } from './contracts';

const INTERNAL_FESTIVAL_SOURCE_KEY = WorkerFestivalRuntimeConfig.internalSourceKey;

/**
 * Loads or creates the configured public-event source row.
 */
export async function ensureImportedFestivalSource(env: WorkerEnv, requestUrl: string, sourceName: string) {
  const rows = await supabaseRequest<FestivalSourceRow[]>(
    env,
    `public_data_source?select=source_id,source_key&source_key=eq.${encodeFilterValue(INTERNAL_FESTIVAL_SOURCE_KEY)}&limit=1`,
  );
  if (rows?.[0]) {
    return rows[0];
  }
  const created = await supabaseRequest<FestivalSourceRow[]>(env, 'public_data_source', {
    method: 'POST',
    body: JSON.stringify({
      source_key: INTERNAL_FESTIVAL_SOURCE_KEY,
      provider: 'public-event',
      name: sourceName,
      source_url: requestUrl,
      updated_at: new Date().toISOString(),
    }),
  });
  return Array.isArray(created) ? created[0] : created;
}

/**
 * Loads imported festival external IDs so the import service can remove stale rows.
 */
export function loadExistingFestivalRows(env: WorkerEnv, sourceId: string | number) {
  return supabaseRequest<FestivalExistingEventRow[]>(
    env,
    `public_event?select=public_event_id,external_id&source_id=eq.${encodeFilterValue(sourceId)}`,
  );
}

/**
 * Upserts normalized festival event rows by source and external ID.
 */
export async function upsertFestivalRows(env: WorkerEnv, rows: FestivalUpsertRow[]) {
  if (rows.length === 0) {
    return;
  }
  await supabaseRequest(env, 'public_event?on_conflict=source_id,external_id', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(rows),
  });
}

/**
 * Deletes imported festival rows that are no longer present in the latest import payload.
 */
export async function deleteStaleFestivalRows(env: WorkerEnv, staleIds: Array<string | number>) {
  if (staleIds.length === 0) {
    return;
  }
  await supabaseRequest(env, `public_event?public_event_id=in.(${staleIds.join(',')})`, { method: 'DELETE' });
}

/**
 * Records the latest source display metadata after a successful import.
 */
export function updateFestivalSourceMetadata(
  env: WorkerEnv,
  sourceId: string | number,
  sourceName: string,
  requestUrl: string,
  importedAt: string,
  nowIso: string,
) {
  return supabaseRequest(env, `public_data_source?source_id=eq.${encodeFilterValue(sourceId)}`, {
    method: 'PATCH',
    body: JSON.stringify({
      name: sourceName,
      source_url: requestUrl,
      last_imported_at: importedAt,
      updated_at: nowIso,
    }),
  });
}

/**
 * Loads upcoming public event rows for festival card and banner responses.
 */
export function loadFestivalRows(env: WorkerEnv, nowIso: string, windowEndIso: string, limit: number) {
  return supabaseRequest<FestivalEventRow[]>(
    env,
    `public_event?select=public_event_id,title,venue_name,district,address,road_address,starts_at,ends_at,summary,source_page_url,latitude,longitude&ends_at=gte.${encodeFilterValue(nowIso)}&starts_at=lte.${encodeFilterValue(windowEndIso)}&order=starts_at.asc&limit=${limit}`,
  );
}

/**
 * Loads source metadata for the banner response readiness fields.
 */
export function loadFestivalSourceMetadata(env: WorkerEnv) {
  return supabaseRequest<Array<Pick<FestivalSourceRow, 'name' | 'last_imported_at'>>>(
    env,
    `public_data_source?select=name,last_imported_at&source_key=eq.${encodeFilterValue(INTERNAL_FESTIVAL_SOURCE_KEY)}&limit=1`,
  );
}
