import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getTourismPlaces } from '../../src/api/tourismClient';

const fetchMock = vi.fn();

beforeEach(() => {
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
});
