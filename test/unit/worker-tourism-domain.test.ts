import { afterEach, describe, expect, it, vi } from 'vitest';

import { handleTourismPlaces } from '../../deploy/api-worker-shell/services/tourism';
import type { WorkerEnv } from '../../deploy/api-worker-shell/types';

const apiUrl = 'https://api.daejeon.jamissue.com';

function buildEnv(overrides: WorkerEnv = {}): WorkerEnv {
  return {
    APP_SUPABASE_URL: 'https://supabase.example.test',
    APP_SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
    ...overrides,
  };
}

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { 'content-type': 'application/json' },
  });
}

function tourismPlaceRow(overrides: Record<string, unknown> = {}) {
  return {
    external_id: 'kto-1',
    display_name: '대전 관광지',
    category: 'tourism',
    district: '유성구',
    content_type_id: '12',
    content_type_label: '관광지',
    cat1: 'A01',
    cat1_label: '자연',
    cat2: null,
    cat2_label: null,
    cat3: null,
    cat3_label: null,
    kto_facet: 'attraction',
    address: null,
    road_address: '대전 유성구 테스트로 1',
    summary: '관광지 설명',
    image_url: null,
    source_page_url: 'https://kto.example.test/place',
    latitude: '36.36',
    longitude: '127.36',
    source_updated_at: '2026-06-01T00:00:00Z',
    raw_payload: { secret: true },
    kto_place_id: 99,
    kto_place_map_link: [{ map: { position_id: 101, slug: 'daejeon-place', name: '지도 장소' } }],
    ...overrides,
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('worker tourism public contract', () => {
  it('returns allowlisted tourism places, facets, and curated projection from non-stale rows', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse([{ resource_type: 'places', source_name: 'KTO', last_success_at: '2026-06-01T00:00:00Z' }]))
      .mockResolvedValueOnce(jsonResponse([
        { content_type_id: '12', content_type_label: '관광지', kto_facet: 'attraction', district: '유성구' },
        { content_type_id: '39', content_type_label: '음식점', kto_facet: 'restaurant', district: '중구' },
      ]))
      .mockResolvedValueOnce(jsonResponse([tourismPlaceRow()]));
    vi.stubGlobal('fetch', fetchMock);

    const response = await handleTourismPlaces(
      new Request(`${apiUrl}/api/tourism/places?district=유성구&ktoContentTypeId=12&ktoFacet=attraction&limit=999`),
      buildEnv(),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({
      sourceReady: true,
      sourceName: 'KTO',
      importedAt: '2026-06-01T00:00:00Z',
      facets: {
        contentTypes: [
          { id: '12', label: '관광지', count: 1 },
          { id: '39', label: '음식점', count: 1 },
        ],
        ktoFacets: [
          { key: 'attraction', label: '관광지', count: 1 },
          { key: 'restaurant', label: '음식점', count: 1 },
        ],
        districts: [
          { name: '유성구', count: 1 },
          { name: '중구', count: 1 },
        ],
      },
      items: [
        {
          id: 'kto-1',
          name: '대전 관광지',
          category: 'tourism',
          ktoContentTypeId: '12',
          ktoContentTypeLabel: '관광지',
          ktoCategoryCode1: 'A01',
          ktoCategoryLabel1: '자연',
          ktoCategoryCode2: null,
          ktoCategoryLabel2: null,
          ktoCategoryCode3: null,
          ktoCategoryLabel3: null,
          ktoFacet: 'attraction',
          district: '유성구',
          address: null,
          roadAddress: '대전 유성구 테스트로 1',
          summary: '관광지 설명',
          imageUrl: null,
          sourcePageUrl: 'https://kto.example.test/place',
          latitude: 36.36,
          longitude: 127.36,
          sourceUpdatedAt: '2026-06-01T00:00:00Z',
          isCurated: true,
          curatedPlace: { positionId: 101, slug: 'daejeon-place', name: '지도 장소' },
        },
      ],
    });
    expect(JSON.stringify(payload)).not.toContain('kto_place_id');
    expect(JSON.stringify(payload)).not.toContain('raw_payload');
    expect(String(fetchMock.mock.calls[1][0])).toContain('sync_status=neq.stale');
    expect(String(fetchMock.mock.calls[1][0])).toContain('limit=10000');
    expect(String(fetchMock.mock.calls[2][0])).toContain('kto_place_map_link(map(position_id,slug,name))');
    expect(String(fetchMock.mock.calls[2][0])).toContain('district=eq.%EC%9C%A0%EC%84%B1%EA%B5%AC');
    expect(String(fetchMock.mock.calls[2][0])).toContain('content_type_id=eq.12');
    expect(String(fetchMock.mock.calls[2][0])).toContain('kto_facet=eq.attraction');
    expect(String(fetchMock.mock.calls[2][0])).toContain('limit=100');
  });

  it('maps missing curated links to an explicit false/null contract', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse([{ resource_type: 'places', source_name: 'KTO', last_imported_at: '2026-06-01T00:00:00Z' }]))
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(jsonResponse([tourismPlaceRow({ kto_place_map_link: [] })]));
    vi.stubGlobal('fetch', fetchMock);

    const response = await handleTourismPlaces(new Request(`${apiUrl}/api/tourism/places`), buildEnv());
    const payload = await response.json();

    expect(payload.items[0]).toMatchObject({
      isCurated: false,
      curatedPlace: null,
    });
  });

  it('returns an empty contract when the tourism source row is not initialized', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(jsonResponse([]));
    vi.stubGlobal('fetch', fetchMock);

    const response = await handleTourismPlaces(new Request(`${apiUrl}/api/tourism/places?category=tourism`), buildEnv());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      sourceReady: false,
      sourceName: null,
      importedAt: null,
      facets: { contentTypes: [], ktoFacets: [], districts: [] },
      items: [],
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('applies category filters and reports source readiness from imported metadata when rows are empty', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse([{ resource_type: 'places', source_name: 'KTO', last_imported_at: '2026-06-02T00:00:00Z' }]))
      .mockResolvedValueOnce(jsonResponse([{ content_type_id: null, content_type_label: null, kto_facet: null, district: null }]))
      .mockResolvedValueOnce(jsonResponse([]));
    vi.stubGlobal('fetch', fetchMock);

    const response = await handleTourismPlaces(
      new Request(`${apiUrl}/api/tourism/places?category=tourism&limit=1`),
      buildEnv(),
    );
    const payload = await response.json();

    expect(payload).toEqual({
      sourceReady: true,
      sourceName: 'KTO',
      importedAt: '2026-06-02T00:00:00Z',
      facets: { contentTypes: [], ktoFacets: [], districts: [] },
      items: [],
    });
    expect(String(fetchMock.mock.calls[2][0])).toContain('category=eq.tourism');
    expect(String(fetchMock.mock.calls[2][0])).toContain('limit=1');
  });

  it('returns a stable empty response when KTO schema is missing', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ code: 'PGRST205', message: 'Could not find public.kto_place' }, { status: 404 })));

    const response = await handleTourismPlaces(new Request(`${apiUrl}/api/tourism/places`), buildEnv());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      sourceReady: false,
      sourceName: null,
      importedAt: null,
      facets: { contentTypes: [], ktoFacets: [], districts: [] },
      items: [],
    });
  });

  it('rethrows non-schema tourism repository failures', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ message: 'temporary failure' }, { status: 503 })));

    await expect(handleTourismPlaces(new Request(`${apiUrl}/api/tourism/places`), buildEnv())).rejects.toThrow('temporary failure');
  });
});
