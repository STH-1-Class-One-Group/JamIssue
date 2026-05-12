/*
 * File: festival-id.ts
 * Purpose: Build stable public event IDs for normalized festival records.
 * Primary Responsibility: Own festival external ID token generation.
 * Design Intent: Keep identifier policy separate from import normalization and response mapping.
 * Non-Goals: This file does not parse payloads, query Supabase, or assemble API responses.
 * Dependencies: Worker runtime config.
 */
import { WorkerFestivalRuntimeConfig } from '../../config/runtime';

const textEncoder = new TextEncoder();

function base64UrlEncode(bytes: Uint8Array) {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export function createFestivalExternalId(
  title: string,
  startDate: Date,
  venueName: string | null,
  roadAddress: string | null,
) {
  const seed = `${title}|${startDate.toISOString()}|${venueName || ''}|${roadAddress || ''}`;
  const bytes = textEncoder.encode(seed);
  return `festival-${base64UrlEncode(bytes).slice(0, WorkerFestivalRuntimeConfig.externalIdTokenLength)}`;
}
