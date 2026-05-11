/*
 * File: import-service.ts
 * Purpose: Orchestrate public festival import normalization and persistence.
 * Primary Responsibility: Convert import payloads into repository operations without exposing Supabase details to handlers.
 * Design Intent: Keep the HTTP handler as a thin boundary while retaining one place for import sequencing.
 * Non-Goals: This file does not parse HTTP authorization, build response DTOs, or manage response cache state directly.
 * Dependencies: Festival mapper, repository functions, Worker runtime config, and Worker environment contract.
 */
import { WorkerFestivalRuntimeConfig } from '../../config/runtime';
import type { WorkerEnv } from '../../types';
import type { FestivalImportOptions } from './contracts';
import { buildFestivalUpsertRows, getTargetFestivalCityKeyword, normalizeImportedFestivalItems, parseFestivalDate } from './mapper';
import {
  deleteStaleFestivalRows,
  ensureImportedFestivalSource,
  loadExistingFestivalRows,
  updateFestivalSourceMetadata,
  upsertFestivalRows,
} from './repository';

const INTERNAL_FESTIVAL_SOURCE_NAME = WorkerFestivalRuntimeConfig.internalSourceName;
const INTERNAL_FESTIVAL_SOURCE_URL = WorkerFestivalRuntimeConfig.internalSourceUrl;

/**
 * Imports public festival rows while preserving source metadata and stale-row cleanup semantics.
 */
export async function upsertImportedFestivalItems(env: WorkerEnv, items: unknown[], options: FestivalImportOptions = {}) {
  const cityKeyword = getTargetFestivalCityKeyword(env);
  const normalizedItems = normalizeImportedFestivalItems(items || [], cityKeyword);
  if (normalizedItems.length === 0) {
    throw new Error('No valid festival items were provided for import.');
  }

  const sourceName = String(options.sourceName || INTERNAL_FESTIVAL_SOURCE_NAME).trim() || INTERNAL_FESTIVAL_SOURCE_NAME;
  const requestUrl = String(options.sourceUrl || INTERNAL_FESTIVAL_SOURCE_URL).trim() || INTERNAL_FESTIVAL_SOURCE_URL;
  const importedAt = parseFestivalDate(options.importedAt)?.toISOString() || new Date().toISOString();
  const source = await ensureImportedFestivalSource(env, requestUrl, sourceName);
  const sourceId = source.source_id;
  const existingRows = await loadExistingFestivalRows(env, sourceId);
  const seenExternalIds = new Set<string>();
  const nowIso = new Date().toISOString();

  for (const item of normalizedItems) {
    seenExternalIds.add(item.externalId);
  }

  await upsertFestivalRows(env, buildFestivalUpsertRows(sourceId, normalizedItems, nowIso));

  const staleIds = (existingRows || [])
    .filter((row) => !seenExternalIds.has(String(row.external_id)))
    .map((row) => row.public_event_id);
  await deleteStaleFestivalRows(env, staleIds);
  await updateFestivalSourceMetadata(env, sourceId, sourceName, requestUrl, importedAt, nowIso);
  return normalizedItems;
}
