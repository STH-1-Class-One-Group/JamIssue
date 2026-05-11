/*
 * File: read-service.ts
 * Purpose: Assemble festival read models for public Worker endpoints.
 * Primary Responsibility: Coordinate repository reads, configured-area filtering, grouping, and mapper output.
 * Design Intent: Keep HTTP handlers thin while keeping Supabase access and DTO mapping behind festival-domain APIs.
 * Non-Goals: This file does not parse import payloads, authorize requests, or mutate festival data.
 * Dependencies: Worker environment contract, festival repository, mapper, and runtime config.
 */
import { WorkerFestivalRuntimeConfig } from '../../config/runtime';
import type { WorkerEnv } from '../../types';
import { buildBannerItem, buildFestivalCard, getFestivalWindowEnd, getTargetFestivalCityKeyword, groupFestivalRowsBySeries, isFestivalRowInConfiguredArea } from './mapper';
import { loadFestivalRows, loadFestivalSourceMetadata } from './repository';

async function loadConfiguredFestivalRows(env: WorkerEnv, now: number, limit: number) {
  const nowIso = new Date(now).toISOString();
  const windowEndIso = getFestivalWindowEnd(now).toISOString();
  const cityKeyword = getTargetFestivalCityKeyword(env);
  const rows = await loadFestivalRows(env, nowIso, windowEndIso, limit);
  return groupFestivalRowsBySeries((rows || []).filter((row) => isFestivalRowInConfiguredArea(row, cityKeyword)));
}

/**
 * Loads festival cards for `/api/festivals`.
 */
export async function loadFestivalCards(env: WorkerEnv, now: number) {
  const rows = await loadConfiguredFestivalRows(env, now, WorkerFestivalRuntimeConfig.dbQueryLimit);
  const windowEndTime = getFestivalWindowEnd(now).getTime();
  return rows
    .filter((row) => {
      const startTime = new Date(row.starts_at).getTime();
      const endTime = new Date(row.ends_at).getTime();
      return Number.isFinite(startTime) && Number.isFinite(endTime) && endTime >= now && startTime <= windowEndTime;
    })
    .slice(0, WorkerFestivalRuntimeConfig.cardDisplayLimit)
    .map((row) => buildFestivalCard(row, now));
}

/**
 * Loads banner event response fields for `/api/banner/events`.
 */
export async function loadBannerEvents(now: number, env: WorkerEnv) {
  const [eventRows, sourceRows] = await Promise.all([
    loadConfiguredFestivalRows(env, now, WorkerFestivalRuntimeConfig.bannerQueryLimit),
    loadFestivalSourceMetadata(env),
  ]);
  const source = sourceRows[0] ?? null;
  const items =
    eventRows.length > 0
      ? eventRows.slice(0, WorkerFestivalRuntimeConfig.bannerDisplayLimit).map((row) => buildBannerItem(row, now))
      : [];
  return {
    sourceReady: items.length > 0 || Boolean(source?.last_imported_at),
    sourceName: source?.name ?? null,
    importedAt: source?.last_imported_at ?? null,
    items,
  };
}
