/*
 * File: tourism-api-client.test.ts
 * Purpose: Verify the Front tourism API client consumes only the Worker public contract.
 * Primary Responsibility: Pin supported query parameter construction for `/api/tourism/places`.
 * Design Intent: Keep KTO/OpenAPI/Supabase details outside browser client tests and code.
 * Non-Goals: This file does not render UI, test Supabase rows, or validate deployed Worker data.
 * Dependencies: Vitest, browser fetch stubs, and Front runtime config.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getTourismPlaces } from '../../src/api/tourismClient';
import { invalidateApiCache } from '../../src/api/core';

const API_BASE_URL = 'https://api.example.test';

function jsonResponse(payload: unknown) {
  return new Response(JSON.stringify(payload), {
    headers: { 'content-type': 'application/json' },
    status: 200,
  });
}

beforeEach(() => {
  invalidateApiCache();
  window.__JAMISSUE_CONFIG__ = {
    apiBaseUrl: API_BASE_URL,
    naverMapClientId: 'naver-client',
    supabaseUrl: 'https://supabase.example.test',
    supabaseAnonKey: 'supabase-anon',
  };
});

describe('tourism API client', () => {
  it('builds supported Worker query filters without exposing upstream dependencies', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({
      sourceReady: true,
      sourceName: 'KTO',
      importedAt: null,
      facets: { contentTypes: [], ktoFacets: [], districts: [] },
      items: [],
    }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(getTourismPlaces({
      category: 'tourism',
      district: '유성구',
      ktoContentTypeId: '12',
      ktoFacet: 'attraction',
      limit: 100,
    })).resolves.toMatchObject({ sourceReady: true, items: [] });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      `${API_BASE_URL}/api/tourism/places?category=tourism&district=%EC%9C%A0%EC%84%B1%EA%B5%AC&ktoContentTypeId=12&ktoFacet=attraction&limit=100`,
    );
  });
});
