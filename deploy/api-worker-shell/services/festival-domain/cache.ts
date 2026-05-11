/*
 * File: cache.ts
 * Purpose: Own the Worker festival in-memory cache state.
 * Primary Responsibility: Coordinate cache hit, pending-load sharing, and cache invalidation for festival cards.
 * Design Intent: Keep mutable cache state out of the HTTP handler and away from persistence code.
 * Non-Goals: This file does not query Supabase, normalize rows, or build banner/import responses.
 * Dependencies: Worker runtime config, pending-request helper, and festival card contract.
 */
import { WorkerFestivalRuntimeConfig } from '../../config/runtime';
import { rememberPending } from '../../lib/supabase';
import type { FestivalCacheState, FestivalCard } from './contracts';

const FESTIVALS_CACHE_TTL_MS = WorkerFestivalRuntimeConfig.cacheTtlMs;

let festivalsCache: FestivalCacheState = { expiresAt: 0, syncAt: 0, value: null, pending: null };

/**
 * Returns cached festival cards or shares a pending load for concurrent requests.
 */
export async function loadCachedFestivalCards(now: number, loader: () => Promise<FestivalCard[]>) {
  if (festivalsCache.value && festivalsCache.expiresAt > now) {
    return festivalsCache.value;
  }

  return rememberPending(festivalsCache, async () => {
    const value = await loader();
    festivalsCache = {
      ...festivalsCache,
      value,
      expiresAt: Date.now() + FESTIVALS_CACHE_TTL_MS,
      pending: null,
    };
    return value;
  });
}

/**
 * Invalidates cards after an import so the next read reflects fresh source rows.
 */
export function clearFestivalCache(syncAt = Date.now()) {
  festivalsCache = { expiresAt: 0, syncAt, value: null, pending: null };
}
