import { beforeEach, describe, expect, it, vi } from 'vitest';
import { invalidateApiCache } from '../../src/api/core';
import { getTourismPlaceDetail, getTourismPlaces } from '../../src/api/tourismClient';

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
      facets: { categories: [], districts: [], contentTypes: [], ktoFacets: [] },
      items: [],
    }),
  });
});

describe('tourismClient', () => {
  it('requests tourism places through the Worker consumer contract', async () => {
    await getTourismPlaces({ category: 'cafe', district: '중구', limit: 12 });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const requestedUrl = String(fetchMock.mock.calls[0][0]);

    expect(requestedUrl).toContain('/api/tourism/places?');
    expect(requestedUrl).toContain('category=cafe');
    expect(requestedUrl).toContain('district=%EC%A4%91%EA%B5%AC');
    expect(requestedUrl).toContain('limit=12');
  });

  it('omits empty optional filters from the tourism places query', async () => {
    await getTourismPlaces({ category: '', district: undefined, limit: undefined });

    expect(String(fetchMock.mock.calls[0][0])).toMatch(/\/api\/tourism\/places$/);
  });

  it('passes request init to the Worker tourism consumer request', async () => {
    const controller = new AbortController();

    await getTourismPlaces({}, { signal: controller.signal });

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
