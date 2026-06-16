import { beforeEach, describe, expect, it, vi } from 'vitest';
import { invalidateApiCache } from '../../src/api/core';
import { buildTourismPlacesPath, getTourismPlaceDetail, getTourismPlaces } from '../../src/api/tourismClient';

const fetchMock = vi.fn();

beforeEach(() => {
  invalidateApiCache();
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({
      sourceReady: true,
      sourceName: 'kto',
      importedAt: '2026-06-13T00:00:00.000Z',
      total: 0,
      facets: { categories: [], districts: [], contentTypes: [], ktoFacets: [], displayGroups: [] },
      items: [],
    }),
  });
});

describe('tourismClient', () => {
  it('builds the KV snapshot all-scope path without a legacy page limit', () => {
    expect(buildTourismPlacesPath({ scope: 'all' })).toBe('/api/tourism/places?scope=all');
    expect(buildTourismPlacesPath({ scope: 'all' })).not.toContain('limit=');
  });

  it('requests all tourism places through the canonical Worker consumer contract', async () => {
    await getTourismPlaces({ scope: 'all', displayGroup: 'cafe', district: '중구' });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const requestedUrl = String(fetchMock.mock.calls[0][0]);

    expect(requestedUrl).toContain('/api/tourism/places?');
    expect(requestedUrl).toContain('scope=all');
    expect(requestedUrl).toContain('displayGroup=cafe');
    expect(requestedUrl).toContain('district=%EC%A4%91%EA%B5%AC');
    expect(requestedUrl).not.toContain('limit=');
  });

  it('keeps provider filters available without using them as UI display groups', async () => {
    await getTourismPlaces({ scope: 'all', primaryType: 'restaurant', subType: 'cafe', ktoFacet: 'restaurant' });

    const requestedUrl = String(fetchMock.mock.calls[0][0]);

    expect(requestedUrl).toContain('primaryType=restaurant');
    expect(requestedUrl).toContain('subType=cafe');
    expect(requestedUrl).toContain('ktoFacet=restaurant');
  });

  it('omits empty optional filters from the tourism places query', async () => {
    await getTourismPlaces({ displayGroup: '', district: undefined, limit: undefined });

    expect(String(fetchMock.mock.calls[0][0])).toMatch(/\/api\/tourism\/places$/);
  });

  it('passes request init to the Worker tourism consumer request', async () => {
    const controller = new AbortController();

    await getTourismPlaces({ scope: 'all' }, { signal: controller.signal });

    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      signal: controller.signal,
    });
  });

  it('requests tourism detail through the Worker consumer contract', async () => {
    await getTourismPlaceDetail('kto-content-133881');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toMatch(/\/api\/tourism\/places\/kto-content-133881$/);
  });

  it('encodes tourism detail ids in the path segment', async () => {
    await getTourismPlaceDetail('kto content/133881');

    expect(String(fetchMock.mock.calls[0][0])).toMatch(/\/api\/tourism\/places\/kto%20content%2F133881$/);
  });
});
