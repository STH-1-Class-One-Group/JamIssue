/*
 * File: tourism.ts
 * Purpose: Expose public tourism Worker HTTP handlers.
 * Primary Responsibility: Render stored KTO tourism read-model responses for Front consumers.
 * Design Intent: Keep Front-facing reads separate from KTO sync and curated map bootstrap paths.
 * Non-Goals: This file does not call KTO TourAPI, mutate Supabase, or handle admin source operations.
 * Dependencies: Worker HTTP helpers and tourism-domain read service.
 */
import { jsonResponse } from '../lib/http';
import type { WorkerEnv } from '../types';
import { loadTourismPlaces } from './tourism-domain';

/**
 * Handles `GET /api/tourism/places`.
 *
 * This handler is read-only and database-backed; the domain service owns the
 * stable empty response for not-yet-created KTO tables.
 */
export async function handleTourismPlaces(request: Request, env: WorkerEnv) {
  return jsonResponse(200, await loadTourismPlaces(env, new URL(request.url)), env, request);
}
