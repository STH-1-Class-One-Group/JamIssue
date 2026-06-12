import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CATEGORY_META,
  deriveTags,
  MANUAL_OVERRIDES_BY_NUMBER,
  getImageFileName,
  inferDistrict,
  makeDescription,
  makeRouteHint,
  makeSummary,
  normalizeCategory,
  slugify,
} from '../../scripts/sample-place/derive';
import { decodeHtml, parseSamplePlaceRows } from '../../scripts/sample-place/parse';
import { buildSamplePlaceSeedSql, sqlJson, sqlString } from '../../scripts/sample-place/sql';
import { logCollectedEvents, logUploadResult } from '../../scripts/daejeon-event-sync/report';
import type { ImportedEvent } from '../../scripts/daejeon-event-sync/types';

function eventFixture(overrides: Partial<ImportedEvent> = {}): ImportedEvent {
  return {
    externalId: 'event-1',
    title: 'Event',
    venueName: 'Venue',
    district: 'District',
    address: null,
    roadAddress: null,
    startsAt: '2026-05-14T00:00:00Z',
    endsAt: '2026-05-15T00:00:00Z',
    homepageUrl: 'https://event.test',
    latitude: null,
    longitude: null,
    summary: 'summary',
    rawPayload: {
      eventSeq: 'event-1',
      theme: 'theme',
      venueName: 'Venue',
      startDate: '20260514',
      endDate: '20260515',
    },
    ...overrides,
  };
}

describe('sample place derivation scripts', () => {
  it('normalizes categories, districts, slugs, and derived content without touching source data', () => {
    const used = new Set<string>();

    expect(MANUAL_OVERRIDES_BY_NUMBER[70]).toMatchObject({ latitude: expect.any(Number), longitude: expect.any(Number) });
    expect(normalizeCategory(CATEGORY_META.cafe.name)).toBe('cafe');
    expect(normalizeCategory(CATEGORY_META.culture.name)).toBe('culture');
    expect(normalizeCategory(CATEGORY_META.attraction.name)).toBe('attraction');
    expect(normalizeCategory('unknown')).toBe('restaurant');
    expect(inferDistrict('Central', 36.3, 127.35)).not.toHaveLength(0);
    expect(inferDistrict('Central', 36.37, 127.38)).not.toHaveLength(0);
    expect(inferDistrict('Central', 36.34, 127.43)).not.toHaveLength(0);
    expect(inferDistrict('Central', 36.32, 127.39)).not.toHaveLength(0);
    expect(inferDistrict('Central', 36.4, 127.42)).not.toHaveLength(0);
    expect(slugify(1, 'A & B (Temp)!', used)).toBe('001-a-and-b');
    expect(slugify(1, 'A & B (Temp)!', used)).toBe('001-a-and-b-2');
    expect(slugify(2, '!!!', used)).toBe('002-place-002');
    expect(getImageFileName(1)).toBe('image.png');
    expect(getImageFileName(3)).toBe('image 2.png');
  });

  it('builds category-specific tags and text fields from the same public helpers used by generation', () => {
    const tags = deriveTags('Local Cafe', 'cafe', 'District', CATEGORY_META.cafe.name);

    expect(tags).toContain(CATEGORY_META.cafe.name);
    expect(tags).toContain('District');
    expect(tags.length).toBeLessThanOrEqual(4);
    expect(makeSummary('Place', 'restaurant')).toContain('Place');
    expect(makeDescription('Place', 'culture', 'District')).toContain('Place');
    expect(makeRouteHint('attraction', 'District')).toContain('District');
  });

  it('covers every sample category text path and district coordinate fallback', () => {
    const categories = ['restaurant', 'cafe', 'culture', 'attraction'] as const;

    for (const category of categories) {
      expect(makeSummary('Place', category)).toContain('Place');
      expect(makeDescription('Place', category, 'District')).toContain('Place');
      expect(makeRouteHint(category, 'District')).toContain('District');
    }

    expect(inferDistrict('Central', 36.3, 127.35)).not.toHaveLength(0);
    expect(inferDistrict('Central', 36.3, 127.37)).not.toHaveLength(0);
    expect(inferDistrict('Central', 36.34, 127.43)).not.toHaveLength(0);
    expect(inferDistrict('Central', 36.33, 127.43)).not.toHaveLength(0);
    expect(inferDistrict('Central', 36.37, 127.38)).not.toHaveLength(0);
    expect(inferDistrict('Central', 36.34, 127.39)).not.toHaveLength(0);
    expect(inferDistrict('Central', 36.4, 127.42)).not.toHaveLength(0);
  });

  it('keeps slug and tag derivation stable for duplicate, long, and keyword-rich source rows', () => {
    const used = new Set<string>();
    const longName = `${'Long '.repeat(30)}Bakery`;
    const firstSlug = slugify(9, longName, used);
    const secondSlug = slugify(9, longName, used);

    expect(firstSlug.length).toBeLessThanOrEqual(74);
    expect(secondSlug).toMatch(/-2$/);

    const tagged = deriveTags(
      'art bakery park',
      'culture',
      'District',
      `${CATEGORY_META.culture.name} ${CATEGORY_META.cafe.name}`,
    );
    expect(tagged[0]).toBe(CATEGORY_META.culture.name);
    expect(tagged).toContain('District');
    expect(tagged.length).toBeLessThanOrEqual(4);
  });

  it('parses sample place rows from safe HTML table content', () => {
    expect(decodeHtml('<strong>A &amp; B&nbsp;Cafe</strong>')).toBe('A & B Cafe');

    const rows = parseSamplePlaceRows(`
      <table>
        <tr><td>踰덊샇</td><td>Name</td><td>Category</td><td>lng</td><td>lat</td></tr>
        <tr><td>1</td><td><em>Jam &amp; Bread</em></td><td>Cafe</td><td>127.38</td><td>36.35</td></tr>
        <tr><td>bad</td><td>Skip</td><td>Cafe</td><td>127.38</td><td>36.35</td></tr>
        <tr><td>2</td><td>Wrong Cell Count</td></tr>
      </table>
    `);

    expect(rows).toEqual([
      {
        number: 1,
        name: 'Jam & Bread',
        rawCategory: 'Cafe',
        longitude: 127.38,
        latitude: 36.35,
      },
    ]);
  });
});

describe('sample place SQL script helpers', () => {
  it('escapes SQL strings and emits idempotent seed SQL', () => {
    const place = {
      slug: 'place-1',
      name: "Owner's Place",
      district: 'District',
      category: 'cafe',
      latitude: 36.35,
      longitude: 127.38,
      summary: 'summary',
      description: 'description',
      imageStoragePath: 'places/001/hero.png',
      vibeTags: ['tag'],
      visitTime: '1h',
      routeHint: 'hint',
      stampReward: 'reward',
      heroLabel: 'hero',
      jamColor: '#fff',
      accentColor: '#000',
    };

    expect(sqlString(null)).toBe('null');
    expect(sqlString("Owner's")).toBe("'Owner''s'");
    expect(sqlJson(['tag'])).toBe("'[\"tag\"]'::jsonb");
    expect(buildSamplePlaceSeedSql([place])).toContain("Owner''s Place");
    expect(buildSamplePlaceSeedSql([place])).toContain('on conflict (slug) do update set');
  });
});

describe('daejeon event sync fetch/upload/report scripts', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    delete process.env.PUBLIC_EVENT_IMPORT_URL;
    delete process.env.EVENT_IMPORT_TOKEN;
  });

  it('fetches event pages with the expected POST form body and rejects failed responses', async () => {
    const fetchMock = vi.fn(async () => new Response('<html>ok</html>', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const { fetchEventListPage } = await import('../../scripts/daejeon-event-sync/fetch');

    await expect(fetchEventListPage({ from: '20260501', to: '20260531', pageIndex: 2 })).resolves.toBe('<html>ok</html>');
    const [, init] = fetchMock.mock.calls[0];
    expect(init).toMatchObject({
      method: 'POST',
      headers: {
        Accept: 'text/html',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      },
    });
    expect(String(init?.body)).toContain('pageIndex=2');

    vi.stubGlobal('fetch', vi.fn(async () => new Response('bad', { status: 503 })));
    vi.resetModules();
    const failedFetchModule = await import('../../scripts/daejeon-event-sync/fetch');
    await expect(failedFetchModule.fetchEventListPage({ from: '20260501', to: '20260531', pageIndex: 1 })).rejects.toThrow(
      'Failed to fetch Daejeon event list (503).',
    );
  });

  it('collects unique events across pages through the normalizer boundary', async () => {
    const parseEventRows = vi.fn((html: string) => [
      eventFixture({ externalId: html.includes('second') ? 'event-2' : 'event-1', title: html }),
      eventFixture({ externalId: 'event-1', title: 'duplicate' }),
    ]);
    vi.doMock('../../scripts/daejeon-event-sync/normalize', () => ({
      normalizeCollectedEvents: vi.fn((items) => items),
      parseEventRows,
      parseMaxPage: vi.fn(() => 2),
    }));
    vi.stubGlobal('fetch', vi.fn(async (_url: string, init?: RequestInit) => {
      const body = String(init?.body);
      return new Response(body.includes('pageIndex=2') ? 'second-page' : 'first-page', { status: 200 });
    }));
    const { collectEvents } = await import('../../scripts/daejeon-event-sync/fetch');

    const result = await collectEvents({ from: '20260501', to: '20260531' });

    expect(result.pageCount).toBe(2);
    expect(result.items.map((item) => item.externalId)).toEqual(['event-1', 'event-2']);
  });

  it('uploads events with an authenticated payload and reports collected results', async () => {
    process.env.PUBLIC_EVENT_IMPORT_URL = 'https://api.test/import';
    process.env.EVENT_IMPORT_TOKEN = 'token';
    const fetchMock = vi.fn(async () => Response.json({ importedEvents: 1 }));
    vi.stubGlobal('fetch', fetchMock);
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const { uploadEvents } = await import('../../scripts/daejeon-event-sync/upload');

    await expect(uploadEvents(
      [eventFixture()],
      { from: '20260501', to: '20260531' },
    )).resolves.toEqual({ importedEvents: 1 });
    expect(fetchMock).toHaveBeenCalledWith('https://api.test/import', expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({ Authorization: 'Bearer token' }),
    }));

    logCollectedEvents({ pageCount: 1, items: [eventFixture({ venueName: null })] }, { from: '20260501', to: '20260531' });
    logUploadResult(1, 'https://api.test/import');
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Collected 1 unique events'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Uploaded 1 events'));
  });

  it('rejects uploads without required endpoint or token configuration', async () => {
    const { uploadEvents } = await import('../../scripts/daejeon-event-sync/upload');

    await expect(uploadEvents([], { from: '20260501', to: '20260531' })).rejects.toThrow('PUBLIC_EVENT_IMPORT_URL is required.');
    process.env.PUBLIC_EVENT_IMPORT_URL = 'https://api.test/import';
    await expect(uploadEvents([], { from: '20260501', to: '20260531' })).rejects.toThrow('EVENT_IMPORT_TOKEN is required.');
  });
});
