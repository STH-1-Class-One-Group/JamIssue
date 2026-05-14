import { getProtectedAuthHeaders } from './protected';

export interface ProtectedWriteSmokeConfig {
  placeId: string;
  stampId: string;
  reviewBody: string;
  commentBody: string;
}

export function isProtectedWriteSmokeEnabled(env = process.env) {
  return String(env.SMOKE_WRITE_ENABLED || '').toLowerCase() === 'true';
}

export function getProtectedWriteSmokeSkipReason(env = process.env) {
  if (!isProtectedWriteSmokeEnabled(env)) {
    return 'SMOKE_WRITE_ENABLED is not true';
  }
  if (!String(env.SMOKE_AUTH_BEARER_TOKEN || '').trim()) {
    return 'SMOKE_AUTH_BEARER_TOKEN is not configured';
  }
  if (!String(env.SMOKE_WRITE_PLACE_ID || '').trim() || !String(env.SMOKE_WRITE_STAMP_ID || '').trim()) {
    return 'SMOKE_WRITE_PLACE_ID and SMOKE_WRITE_STAMP_ID are required for protected write smoke checks';
  }
  return null;
}

export function getProtectedWriteSmokeConfig(env = process.env): ProtectedWriteSmokeConfig {
  const placeId = String(env.SMOKE_WRITE_PLACE_ID || '').trim();
  const stampId = String(env.SMOKE_WRITE_STAMP_ID || '').trim();
  if (!placeId || !stampId) {
    throw new Error('SMOKE_WRITE_PLACE_ID and SMOKE_WRITE_STAMP_ID are required for protected write smoke checks');
  }

  return {
    placeId,
    stampId,
    reviewBody: String(env.SMOKE_WRITE_REVIEW_BODY || 'protected smoke review roundtrip'),
    commentBody: String(env.SMOKE_WRITE_COMMENT_BODY || 'protected smoke comment'),
  };
}

export function getProtectedWriteAuthHeaders(env = process.env) {
  return getProtectedAuthHeaders(env);
}
