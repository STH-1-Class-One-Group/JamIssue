import { afterEach, describe, expect, it, vi } from 'vitest';

import { clearFestivalCache } from '../../deploy/api-worker-shell/services/festival-domain/cache';
import {
  buildBannerItem,
  buildFestivalCard,
} from '../../deploy/api-worker-shell/services/festival-domain/festival-response-mapper';
import {
  deduplicateImportedFestivalItemsByExternalId,
  groupFestivalRowsBySeries,
  mergeImportedFestivalItems,
} from '../../deploy/api-worker-shell/services/festival-domain/festival-series';
import { normalizeImportedFestivalItems } from '../../deploy/api-worker-shell/services/festival-domain/mapper';
import { handleBannerEvents, handleFestivalImport, handleFestivals } from '../../deploy/api-worker-shell/services/festivals';
import type { WorkerEnv } from '../../deploy/api-worker-shell/types';

const apiUrl = 'https://api.daejeon.jamissue.com';

function buildEnv(overrides: WorkerEnv = {}): WorkerEnv {
  return {
    APP_SUPABASE_URL: 'https://supabase.example.test',
    APP_SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
    APP_EVENT_IMPORT_TOKEN: 'expected-token',
    ...overrides,
  };
}

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}

function sampleFestivalRow() {
  return {
    public_event_id: 11,
    title: '대전 봄 축제',
    venue_name: '대전시청 광장',
    district: '서구',
    address: '대전 서구 둔산동',
    road_address: '대전광역시 서구 둔산로 100',
    starts_at: '2026-05-10T00:00:00+09:00',
    ends_at: '2026-06-20T23:59:59+09:00',
    summary: '봄 행사',
    source_page_url: 'https://example.test/event',
    latitude: '36.3504',
    longitude: '127.3845',
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  clearFestivalCache(0);
});

describe('worker festival domain boundary', () => {
  it('keeps /api/festivals response shape and cache hit semantics', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-11T00:00:00+09:00'));
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse([{ source_id: 7, name: 'Daejeon Official Event Search', last_imported_at: '2026-05-11T00:00:00.000Z' }]))
      .mockResolvedValueOnce(jsonResponse([sampleFestivalRow()]));
    vi.stubGlobal('fetch', fetchMock);

    const request = new Request(`${apiUrl}/api/festivals`);
    const first = await handleFestivals(request, buildEnv());
    const second = await handleFestivals(request, buildEnv());

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(await first.json()).toEqual([
      {
        id: '11',
        title: '대전 봄 축제',
        venueName: '대전시청 광장',
        startDate: '2026-05-10',
        endDate: '2026-06-20',
        homepageUrl: 'https://example.test/event',
        roadAddress: '대전광역시 서구 둔산로 100',
        latitude: 36.3504,
        longitude: 127.3845,
        isOngoing: true,
      },
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[1][0])).toContain('source_id=eq.7');
    expect(String(fetchMock.mock.calls[1][0])).toContain('sync_status=neq.stale');
  });

  it('keeps /api/banner/events source and item response shape', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-11T00:00:00+09:00'));
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse([{ source_id: 7, name: 'Daejeon Official Event Search', last_imported_at: '2026-05-11T00:00:00.000Z' }]))
      .mockResolvedValueOnce(jsonResponse([sampleFestivalRow()]));
    vi.stubGlobal('fetch', fetchMock);

    const response = await handleBannerEvents(new Request(`${apiUrl}/api/banner/events`), buildEnv());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      sourceReady: true,
      sourceName: 'Daejeon Official Event Search',
      importedAt: '2026-05-11T00:00:00.000Z',
      items: [
        {
          id: '11',
          title: '대전 봄 축제',
          venueName: '대전시청 광장',
          district: '서구',
          startDate: '2026-05-10T00:00:00+09:00',
          endDate: '2026-06-20T23:59:59+09:00',
          dateLabel: '05. 10. - 06. 20.',
          summary: '봄 행사',
          sourcePageUrl: 'https://example.test/event',
          linkedPlaceName: null,
          isOngoing: true,
        },
      ],
    });
    expect(String(fetchMock.mock.calls[1][0])).toContain('source_id=eq.7');
    expect(String(fetchMock.mock.calls[1][0])).toContain('sync_status=neq.stale');
  });

  it('keeps festival import token and valid path semantics', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-11T00:00:00+09:00'));
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(jsonResponse([{ source_id: 7, source_key: 'jamissue-public-event-feed' }]))
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(jsonResponse([]));
    vi.stubGlobal('fetch', fetchMock);

    const response = await handleFestivalImport(
      new Request(`${apiUrl}/api/internal/public-events/import`, {
        method: 'POST',
        headers: { authorization: 'Bearer expected-token' },
        body: JSON.stringify({
          sourceName: 'Official',
          importedAt: '2026-05-11',
          items: [
            {
              externalId: 'event-1',
              title: '대전 봄 축제',
              venueName: '대전시청 광장',
              roadAddress: '대전광역시 서구 둔산로 100',
              startsAt: '2026-05-10',
              endsAt: '2026-05-12',
            },
          ],
        }),
      }),
      buildEnv(),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      importedEvents: 1,
      sourceName: 'Official',
      importedAt: '2026-05-11T00:00:00.000Z',
    });
    expect(fetchMock).toHaveBeenCalledTimes(5);
    expect(String(fetchMock.mock.calls[3][0])).toContain('public_event?on_conflict=source_id,external_id');
  });

  it('keeps festival import merge and deduplicate behavior in the mapper layer', () => {
    const items = normalizeImportedFestivalItems(
      [
        {
          externalId: 'event-1',
          title: '대전 봄 축제',
          venueName: '대전시청 광장',
          roadAddress: '대전광역시 서구 둔산로 100',
          startsAt: '2026-05-10',
          endsAt: '2026-05-11',
          summary: '',
        },
        {
          externalId: 'event-2',
          title: '대전 봄 축제',
          venueName: '대전시청 광장',
          roadAddress: '대전광역시 서구 둔산로 100',
          startsAt: '2026-05-12',
          endsAt: '2026-05-13',
          summary: '상세 행사',
        },
      ],
      '대전',
    );

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      title: '대전 봄 축제',
      startsAt: '2026-05-10T00:00:00.000Z',
      endsAt: '2026-05-13T23:59:59.000Z',
      summary: '대전시청 광장에서 열리는 대전 행사예요.',
    });
  });

  it('maps festival cards and banners with null date/address/coordinate fallbacks', () => {
    const row = {
      ...sampleFestivalRow(),
      address: 'fallback address',
      ends_at: '',
      latitude: 'not-a-number',
      longitude: null,
      public_event_id: 12,
      road_address: null,
      source_page_url: null,
      starts_at: '',
      summary: null,
      venue_name: null,
    };

    expect(buildFestivalCard(row, Date.parse('2026-05-11T00:00:00+09:00'))).toEqual({
      id: '12',
      title: row.title,
      venueName: null,
      startDate: '',
      endDate: '',
      homepageUrl: null,
      roadAddress: 'fallback address',
      latitude: null,
      longitude: null,
      isOngoing: false,
    });
    expect(buildBannerItem(row, Date.parse('2026-05-11T00:00:00+09:00'), '일정 확인 필요')).toMatchObject({
      id: '12',
      venueName: null,
      district: row.district,
      dateLabel: '일정 확인 필요',
      summary: '',
      sourcePageUrl: null,
      linkedPlaceName: null,
      isOngoing: false,
    });
  });

  it('merges imported festival items across overlaps, fallbacks, and duplicate external ids', () => {
    const items = [
      {
        externalId: 'external-1',
        title: 'Same Festival (A)',
        venueName: 'Venue',
        roadAddress: '',
        address: '',
        startsAt: '2026-05-12T00:00:00+09:00',
        endsAt: '2026-05-12T23:59:59+09:00',
        latitude: 'not-a-number',
        longitude: 'not-a-number',
        summary: '',
        homepageUrl: '',
        rawPayload: { mergedExternalIds: ['legacy-1'] },
      },
      {
        externalId: 'external-2',
        title: 'Same Festival (B)',
        venueName: 'Venue',
        roadAddress: 'Road',
        address: 'Address',
        startsAt: '2026-05-11T00:00:00+09:00',
        endsAt: '2026-05-13T23:59:59+09:00',
        latitude: 36.35,
        longitude: 127.38,
        summary: 'summary',
        homepageUrl: 'https://festival.test',
        rawPayload: { mergedExternalIds: ['legacy-2'] },
      },
    ];

    const [merged] = mergeImportedFestivalItems(items);
    expect(merged).toMatchObject({
      startsAt: '2026-05-11T00:00:00+09:00',
      endsAt: '2026-05-13T23:59:59+09:00',
      summary: 'summary',
      homepageUrl: 'https://festival.test',
      roadAddress: 'Road',
      address: 'Address',
      latitude: 36.35,
      longitude: 127.38,
    });
    expect(merged.rawPayload.mergedExternalIds).toEqual(expect.arrayContaining(['external-1', 'external-2']));

    const [deduped] = deduplicateImportedFestivalItemsByExternalId([
      { ...merged, externalId: 'same-id', startsAt: '2026-05-12T00:00:00+09:00', endsAt: '2026-05-12T23:59:59+09:00', summary: '' },
      { ...merged, externalId: 'same-id', startsAt: '2026-05-10T00:00:00+09:00', endsAt: '2026-05-14T23:59:59+09:00', summary: 'deduped summary' },
    ]);
    expect(deduped).toMatchObject({
      startsAt: '2026-05-10T00:00:00+09:00',
      endsAt: '2026-05-14T23:59:59+09:00',
      summary: 'deduped summary',
    });
  });

  it('groups stored festival rows only when series keys and periods are mergeable', () => {
    const grouped = groupFestivalRowsBySeries([
      {
        ...sampleFestivalRow(),
        public_event_id: 21,
        title: 'Series [1]',
        summary: '',
        source_page_url: '',
        road_address: '',
        address: '',
        latitude: 'not-a-number',
        longitude: 'not-a-number',
        starts_at: '2026-05-10T00:00:00+09:00',
        ends_at: '2026-05-10T23:59:59+09:00',
      },
      {
        ...sampleFestivalRow(),
        public_event_id: 22,
        title: 'Series [2]',
        summary: 'filled summary',
        source_page_url: 'https://source.test',
        road_address: 'Road',
        address: 'Address',
        latitude: '36.35',
        longitude: '127.38',
        starts_at: '2026-05-11T00:00:00+09:00',
        ends_at: '2026-05-12T23:59:59+09:00',
      },
      {
        ...sampleFestivalRow(),
        public_event_id: 23,
        title: 'Other Series',
        starts_at: 'bad-date',
        ends_at: 'bad-date',
      },
    ]);

    expect(grouped).toHaveLength(2);
    expect(grouped[0]).toMatchObject({
      public_event_id: 21,
      ends_at: '2026-05-12T23:59:59+09:00',
      summary: 'filled summary',
      source_page_url: 'https://source.test',
      road_address: 'Road',
      address: 'Address',
      latitude: '36.35',
      longitude: '127.38',
    });
    expect(grouped[1]).toMatchObject({ public_event_id: 23 });
  });
});
