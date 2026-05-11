/*
 * File: festivals.ts
 * Purpose: Expose public festival Worker HTTP handlers.
 * Primary Responsibility: Validate HTTP inputs and delegate festival read/import work to festival-domain modules.
 * Design Intent: Keep the public handler surface stable while hiding cache, mapper, import, and repository details.
 * Non-Goals: This file does not own Supabase queries, payload normalization, cache state, or festival DTO mapping.
 * Dependencies: Worker HTTP helpers, runtime config, and festival-domain services.
 */
import { WorkerFestivalRuntimeConfig } from '../config/runtime';
import { jsonResponse } from '../lib/http';
import type { WorkerEnv, WorkerJsonRecord } from '../types';
import { clearFestivalCache, loadCachedFestivalCards } from './festival-domain/cache';
import { upsertImportedFestivalItems } from './festival-domain/import-service';
import { parseFestivalDate } from './festival-domain/mapper';
import { loadBannerEvents, loadFestivalCards } from './festival-domain/read-service';

const INTERNAL_FESTIVAL_SOURCE_NAME = WorkerFestivalRuntimeConfig.internalSourceName;

function readFestivalImportToken(env: WorkerEnv) {
  return String(env.APP_EVENT_IMPORT_TOKEN || '').trim();
}

function readBearerToken(request: Request) {
  const authorization = request.headers.get('authorization') || '';
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : '';
}

async function readFestivalImportPayload(request: Request) {
  const payload = await request.json().catch(() => null);
  return payload && typeof payload === 'object' ? (payload as WorkerJsonRecord) : null;
}

/**
 * Handles `/api/festivals` without exposing cache or repository internals to routing.
 */
export async function handleFestivals(request: Request, env: WorkerEnv) {
  const now = Date.now();
  const festivals = await loadCachedFestivalCards(now, () => loadFestivalCards(env, now));
  return jsonResponse(200, festivals, env, request);
}

/**
 * Handles `/api/banner/events` using the festival read model service.
 */
export async function handleBannerEvents(request: Request, env: WorkerEnv) {
  return jsonResponse(200, await loadBannerEvents(Date.now(), env), env, request);
}

/**
 * Handles `/api/internal/public-events/import` while preserving token and response semantics.
 */
export async function handleFestivalImport(request: Request, env: WorkerEnv) {
  const configuredToken = readFestivalImportToken(env);
  if (!configuredToken) {
    return jsonResponse(503, { detail: 'APP_EVENT_IMPORT_TOKEN is empty.' }, env, request);
  }

  const bearerToken = readBearerToken(request);
  if (!bearerToken || bearerToken !== configuredToken) {
    return jsonResponse(401, { detail: '공공 행사 import 토큰이 올바르지 않아요.' }, env, request);
  }

  const payload = await readFestivalImportPayload(request);
  if (!payload || !Array.isArray(payload.items)) {
    return jsonResponse(400, { detail: 'items 배열이 필요해요.' }, env, request);
  }

  let importedItems;
  try {
    importedItems = await upsertImportedFestivalItems(env, payload.items, {
      sourceName: payload.sourceName,
      sourceUrl: payload.sourceUrl,
      importedAt: payload.importedAt,
    });
  } catch (error) {
    console.error('[worker] festival import failed', error);
    return jsonResponse(422, { detail: '공공 행사 데이터를 정리할 수 없어요.' }, env, request);
  }

  clearFestivalCache();
  return jsonResponse(
    200,
    {
      importedEvents: importedItems.length,
      sourceName: String(payload.sourceName || INTERNAL_FESTIVAL_SOURCE_NAME),
      importedAt: parseFestivalDate(payload.importedAt)?.toISOString() || new Date().toISOString(),
    },
    env,
    request,
  );
}
