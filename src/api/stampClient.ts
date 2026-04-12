import type { StampClaimRequest, StampState } from '../types';
import { fetchJson, invalidateApiCache } from './core';

export async function claimStamp(payload: StampClaimRequest) {
  const response = await fetchJson<StampState>('/api/stamps/toggle', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  invalidateApiCache(['/api/map-bootstrap', '/api/my/summary', '/api/community-routes']);
  return response;
}

