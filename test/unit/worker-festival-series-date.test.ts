import { describe, expect, it } from 'vitest';
import {
  getFestivalWindowEnd,
  isFestivalOngoingInSeoul,
  parseFestivalDate,
} from '../../deploy/api-worker-shell/services/festival-domain/festival-date';
import {
  deduplicateImportedFestivalItemsByExternalId,
  groupFestivalRowsBySeries,
  isFestivalRowInConfiguredArea,
  mergeImportedFestivalItems,
} from '../../deploy/api-worker-shell/services/festival-domain/festival-series';
import type { FestivalEventRow, NormalizedFestivalItem } from '../../deploy/api-worker-shell/services/festival-domain/contracts';

function importedFestivalFixture(overrides: Partial<NormalizedFestivalItem> = {}): NormalizedFestivalItem {
  return {
    externalId: 'external-1',
    title: 'Jam Festival',
    venueName: 'Daejeon Hall',
    district: 'Daejeon',
    address: null,
    roadAddress: 'Daejeon Road',
    startsAt: '2026-05-14T00:00:00+09:00',
    endsAt: '2026-05-14T23:59:59+09:00',
    homepageUrl: null,
    latitude: null,
    longitude: null,
    summary: '',
    rawPayload: {},
    sourceUpdatedAt: null,
    ...overrides,
  };
}

function festivalRowFixture(overrides: Partial<FestivalEventRow> = {}): FestivalEventRow {
  return {
    public_event_id: 'event-1',
    title: 'Jam Festival',
    venue_name: 'Daejeon Hall',
    district: 'Daejeon',
    address: null,
    road_address: 'Daejeon Road',
    starts_at: '2026-05-14T00:00:00+09:00',
    ends_at: '2026-05-14T23:59:59+09:00',
    summary: null,
    source_page_url: null,
    latitude: null,
    longitude: null,
    ...overrides,
  };
}

describe('festival date policy', () => {
  it('parses supported festival date inputs and rejects empty or invalid values', () => {
    expect(parseFestivalDate(null)).toBeNull();
    expect(parseFestivalDate('')).toBeNull();
    expect(parseFestivalDate('not-a-date')).toBeNull();
    expect(parseFestivalDate('20260514')?.toISOString()).toBe('2026-05-14T00:00:00.000Z');
    expect(parseFestivalDate('20260514', true)?.toISOString()).toBe('2026-05-14T23:59:59.000Z');
    expect(parseFestivalDate('2026-05-14', true)?.toISOString()).toContain('23:59:59');
  });

  it('checks ongoing festival windows and derives the configured window end', () => {
    const now = new Date('2026-05-14T12:00:00+09:00').getTime();

    expect(isFestivalOngoingInSeoul('2026-05-14T00:00:00+09:00', '2026-05-15T23:59:59+09:00', now)).toBe(true);
    expect(isFestivalOngoingInSeoul('', '2026-05-15T23:59:59+09:00', now)).toBe(false);
    expect(isFestivalOngoingInSeoul('2026-05-10T00:00:00+09:00', '2026-05-13T23:59:59+09:00', now)).toBe(false);
    expect(getFestivalWindowEnd(now).getTime()).toBeGreaterThan(now);
  });
});

describe('festival series policy', () => {
  it('merges adjacent imported festival items with the same normalized series key', () => {
    const merged = mergeImportedFestivalItems([
      importedFestivalFixture({
        externalId: 'external-2',
        title: 'Jam Festival [2회]',
        startsAt: '2026-05-15T00:00:00+09:00',
        endsAt: '2026-05-16T23:59:59+09:00',
        homepageUrl: 'https://festival.test',
        roadAddress: null,
        address: 'Daejeon Address',
        latitude: 36.35,
        longitude: 127.38,
        summary: 'summary',
        rawPayload: { mergedExternalIds: ['external-2'] },
      }),
      importedFestivalFixture({
        externalId: 'external-1',
        title: 'Jam Festival [1회]',
        startsAt: '2026-05-14T00:00:00+09:00',
        endsAt: '2026-05-14T23:59:59+09:00',
        rawPayload: { mergedExternalIds: ['external-1'] },
      }),
    ]);

    expect(merged).toHaveLength(1);
    expect(merged[0]).toMatchObject({
      startsAt: '2026-05-14T00:00:00+09:00',
      endsAt: '2026-05-16T23:59:59+09:00',
      summary: 'summary',
      homepageUrl: 'https://festival.test',
      address: 'Daejeon Address',
    });
    expect(merged[0].rawPayload).toMatchObject({
      mergedExternalIds: ['external-1', 'external-2'],
    });
  });

  it('deduplicates imported items by generated external id and keeps separated series distinct', () => {
    const duplicateA = importedFestivalFixture({
      externalId: 'same',
      startsAt: '2026-05-14T00:00:00+09:00',
      endsAt: '2026-05-14T23:59:59+09:00',
    });
    const duplicateB = importedFestivalFixture({
      externalId: 'same',
      startsAt: '2026-05-13T00:00:00+09:00',
      endsAt: '2026-05-15T23:59:59+09:00',
      summary: 'existing summary',
    });

    const deduped = deduplicateImportedFestivalItemsByExternalId([duplicateA, duplicateB]);
    expect(deduped).toEqual([
      expect.objectContaining({
        externalId: expect.stringMatching(/^festival-/),
        startsAt: '2026-05-13T00:00:00+09:00',
        endsAt: '2026-05-15T23:59:59+09:00',
        summary: 'existing summary',
      }),
    ]);
    expect(deduped[0].rawPayload).toMatchObject({ mergedExternalIds: ['same'] });
    expect(mergeImportedFestivalItems([
      importedFestivalFixture({ externalId: 'first', startsAt: '2026-05-10T00:00:00+09:00', endsAt: '2026-05-10T23:59:59+09:00' }),
      importedFestivalFixture({ externalId: 'second', startsAt: '2026-05-20T00:00:00+09:00', endsAt: '2026-05-20T23:59:59+09:00' }),
    ])).toHaveLength(2);
  });

  it('keeps non-mergeable imported periods separate and fills optional fields during merge', () => {
    expect(mergeImportedFestivalItems([
      importedFestivalFixture({ externalId: 'gap-1', startsAt: '2026-05-10T00:00:00+09:00', endsAt: '2026-05-10T23:59:59+09:00' }),
      importedFestivalFixture({ externalId: 'gap-2', startsAt: '2026-05-20T00:00:00+09:00', endsAt: '2026-05-20T23:59:59+09:00' }),
    ])).toHaveLength(2);

    const [merged] = mergeImportedFestivalItems([
      importedFestivalFixture({
        externalId: 'base',
        startsAt: '2026-05-14T00:00:00+09:00',
        endsAt: '2026-05-14T23:59:59+09:00',
        homepageUrl: null,
        roadAddress: null,
        address: null,
        latitude: 'bad',
        longitude: 'bad',
        rawPayload: { mergedExternalIds: ['base'] },
      }),
      importedFestivalFixture({
        externalId: 'fill',
        startsAt: '2026-05-15T00:00:00+09:00',
        endsAt: '2026-05-15T23:59:59+09:00',
        homepageUrl: 'https://festival.test/fill',
        roadAddress: 'Filled Road',
        address: 'Filled Address',
        latitude: 36.35,
        longitude: 127.38,
        rawPayload: { mergedExternalIds: ['fill'] },
      }),
    ]);

    expect(merged).toMatchObject({
      homepageUrl: 'https://festival.test/fill',
      roadAddress: 'Filled Road',
      address: 'Filled Address',
      latitude: 36.35,
      longitude: 127.38,
    });
    expect(merged.rawPayload).toMatchObject({ mergedExternalIds: ['base', 'fill'] });
  });

  it('groups Supabase festival rows by adjacent series and filters configured area text', () => {
    const grouped = groupFestivalRowsBySeries([
      festivalRowFixture({
        public_event_id: 'row-1',
        title: 'Jam Festival (A)',
        starts_at: '2026-05-14T00:00:00+09:00',
        ends_at: '2026-05-14T23:59:59+09:00',
      }),
      festivalRowFixture({
        public_event_id: 'row-2',
        title: 'Jam Festival (B)',
        starts_at: '2026-05-15T00:00:00+09:00',
        ends_at: '2026-05-16T23:59:59+09:00',
        summary: 'row summary',
        source_page_url: 'https://festival.test',
        road_address: null,
        address: 'Daejeon Address',
        latitude: '36.35',
        longitude: '127.38',
      }),
    ]);

    expect(grouped).toHaveLength(1);
    expect(grouped[0]).toMatchObject({
      public_event_id: 'row-1',
      ends_at: '2026-05-16T23:59:59+09:00',
      summary: 'row summary',
      source_page_url: 'https://festival.test',
      address: 'Daejeon Address',
    });
    expect(isFestivalRowInConfiguredArea(grouped[0], 'Daejeon')).toBe(true);
    expect(isFestivalRowInConfiguredArea(festivalRowFixture({
      venue_name: 'Other City',
      district: null,
      address: null,
      road_address: null,
    }), 'Daejeon')).toBe(false);
  });

  it('keeps invalid Supabase row periods separate and fills missing row fields on merge', () => {
    expect(groupFestivalRowsBySeries([
      festivalRowFixture({ public_event_id: 'bad-1', starts_at: 'not-a-date' }),
      festivalRowFixture({ public_event_id: 'bad-2', ends_at: 'not-a-date' }),
    ])).toHaveLength(2);

    const grouped = groupFestivalRowsBySeries([
      festivalRowFixture({
        public_event_id: 'row-base',
        starts_at: '2026-05-14T00:00:00+09:00',
        ends_at: '2026-05-14T23:59:59+09:00',
        source_page_url: null,
        road_address: null,
        address: null,
        latitude: 'bad',
        longitude: 'bad',
      }),
      festivalRowFixture({
        public_event_id: 'row-fill',
        starts_at: '2026-05-15T00:00:00+09:00',
        ends_at: '2026-05-15T23:59:59+09:00',
        source_page_url: 'https://festival.test/fill',
        road_address: 'Filled Road',
        address: 'Filled Address',
        latitude: '36.35',
        longitude: '127.38',
      }),
    ]);

    expect(grouped).toHaveLength(1);
    expect(grouped[0]).toMatchObject({
      source_page_url: 'https://festival.test/fill',
      road_address: 'Filled Road',
      address: 'Filled Address',
      latitude: '36.35',
      longitude: '127.38',
    });
  });

  it('keeps invalid imported periods separate and preserves already populated merge fields', () => {
    const [merged] = mergeImportedFestivalItems([
      importedFestivalFixture({
        externalId: 'base',
        startsAt: '2026-05-14T00:00:00+09:00',
        endsAt: '2026-05-15T23:59:59+09:00',
        summary: 'base summary',
        homepageUrl: 'https://festival.test/base',
        roadAddress: 'Base Road',
        address: 'Base Address',
        latitude: 36.35,
        longitude: 127.38,
        rawPayload: { mergedExternalIds: ['base'] },
      }),
      importedFestivalFixture({
        externalId: 'source',
        startsAt: '2026-05-15T12:00:00+09:00',
        endsAt: '2026-05-16T23:59:59+09:00',
        summary: 'source summary',
        homepageUrl: 'https://festival.test/source',
        roadAddress: 'Source Road',
        address: 'Source Address',
        latitude: 36.36,
        longitude: 127.39,
        rawPayload: { mergedExternalIds: ['source'] },
      }),
    ]);

    expect(merged).toMatchObject({
      startsAt: '2026-05-14T00:00:00+09:00',
      endsAt: '2026-05-16T23:59:59+09:00',
      summary: 'base summary',
      homepageUrl: 'https://festival.test/base',
      roadAddress: 'Base Road',
      address: 'Base Address',
      latitude: 36.35,
      longitude: 127.38,
    });
    expect(merged.rawPayload).toMatchObject({ mergedExternalIds: ['base', 'source'] });
  });

  it('uses venue fallback text while grouping and preserves populated Supabase row fields', () => {
    const grouped = groupFestivalRowsBySeries([
      festivalRowFixture({
        public_event_id: 'base',
        title: 'Jam Festival (A)',
        venue_name: null,
        road_address: null,
        address: 'Shared Address',
        starts_at: '2026-05-14T00:00:00+09:00',
        ends_at: '2026-05-15T23:59:59+09:00',
        summary: 'base summary',
        source_page_url: 'https://festival.test/base',
        latitude: '36.35',
        longitude: '127.38',
      }),
      festivalRowFixture({
        public_event_id: 'source',
        title: 'Jam Festival [B]',
        venue_name: null,
        road_address: null,
        address: 'Shared Address',
        starts_at: '2026-05-15T12:00:00+09:00',
        ends_at: '2026-05-16T23:59:59+09:00',
        summary: 'source summary',
        source_page_url: 'https://festival.test/source',
        latitude: '36.36',
        longitude: '127.39',
      }),
    ]);

    expect(grouped).toHaveLength(1);
    expect(grouped[0]).toMatchObject({
      public_event_id: 'base',
      ends_at: '2026-05-16T23:59:59+09:00',
      summary: 'base summary',
      source_page_url: 'https://festival.test/base',
      address: 'Shared Address',
      latitude: '36.35',
      longitude: '127.38',
    });
  });
});
