import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createAdminService } from '../../deploy/api-worker-shell/services/admin';
import type { WorkerEnv } from '../../deploy/api-worker-shell/types';

const authMocks = vi.hoisted(() => ({
  readSessionUser: vi.fn(),
}));

const adminDomainMocks = vi.hoisted(() => ({
  loadAdminSummaryRows: vi.fn(),
  loadPlaceReviewRows: vi.fn(),
  loadPublicDataSource: vi.fn(),
  updateAdminPlaceVisibility: vi.fn(),
}));

vi.mock('../../deploy/api-worker-shell/services/auth', () => ({
  readSessionUser: authMocks.readSessionUser,
}));

vi.mock('../../deploy/api-worker-shell/services/admin-domain', () => ({
  loadAdminSummaryRows: adminDomainMocks.loadAdminSummaryRows,
  loadPlaceReviewRows: adminDomainMocks.loadPlaceReviewRows,
  loadPublicDataSource: adminDomainMocks.loadPublicDataSource,
  updateAdminPlaceVisibility: adminDomainMocks.updateAdminPlaceVisibility,
}));

const env = {
  APP_CORS_ORIGINS: '',
  APP_FRONTEND_URL: 'https://daejeon.jamissue.com',
} as WorkerEnv;

function createService() {
  return createAdminService({
    normalizePlaceCategory: (category, slug) => `${category}:${slug ?? 'none'}`,
  });
}

async function readJson(response: Response) {
  return response.json() as Promise<unknown>;
}

describe('worker admin service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMocks.readSessionUser.mockResolvedValue({ id: 'admin-user', isAdmin: true });
    adminDomainMocks.loadAdminSummaryRows.mockResolvedValue({
      userCount: 1,
      placeCount: 2,
      reviewCount: 3,
      commentCount: 4,
      stampCount: 5,
      placeRows: [
        {
          position_id: 101,
          slug: 'place-1',
          name: 'Place 1',
          district: 'District',
          category: 'cafe',
          is_active: true,
          is_manual_override: false,
          updated_at: '2026-05-14T00:00:00Z',
        },
      ],
      feedRows: [{ position_id: 101 }, { position_id: 101 }, { position_id: 102 }],
    });
    adminDomainMocks.updateAdminPlaceVisibility.mockResolvedValue({
      position_id: 101,
      slug: 'place-1',
      name: 'Place 1',
      district: 'District',
      category: 'cafe',
      is_active: false,
      is_manual_override: true,
      updated_at: '2026-05-14T00:00:00Z',
    });
    adminDomainMocks.loadPlaceReviewRows.mockResolvedValue([{ feed_id: 1 }, { feed_id: 2 }]);
    adminDomainMocks.loadPublicDataSource.mockResolvedValue({ last_imported_at: '2026-05-14T00:00:00Z' });
  });

  it('guards admin summary behind an admin session and maps review counts by place', async () => {
    const service = createService();

    authMocks.readSessionUser.mockResolvedValueOnce({ id: 'user-1', isAdmin: false });
    const forbidden = await service.handleAdminSummary(new Request('https://api.test/api/admin/summary'), env);
    expect(forbidden.status).toBe(403);

    const response = await service.handleAdminSummary(new Request('https://api.test/api/admin/summary'), env);
    const payload = await readJson(response);

    expect(response.status).toBe(200);
    expect(payload).toEqual(expect.objectContaining({
      userCount: 1,
      placeCount: 2,
      reviewCount: 3,
      commentCount: 4,
      stampCount: 5,
      sourceReady: true,
      places: [
        expect.objectContaining({
          id: 'place-1',
          category: 'cafe:place-1',
          isActive: true,
          isManualOverride: false,
          reviewCount: 2,
        }),
      ],
    }));
  });

  it('maps empty admin summary rows and category slug fallbacks without leaking null data', async () => {
    adminDomainMocks.loadAdminSummaryRows.mockResolvedValueOnce({
      userCount: 0,
      placeCount: 1,
      reviewCount: 0,
      commentCount: 0,
      stampCount: 0,
      placeRows: [
        {
          position_id: 102,
          slug: null,
          name: 'Place 2',
          district: 'District',
          category: 'event',
          is_active: 0,
          is_manual_override: 1,
          updated_at: null,
        },
      ],
      feedRows: null,
    });
    const service = createService();

    const response = await service.handleAdminSummary(new Request('https://api.test/api/admin/summary'), env);
    const payload = await readJson(response);

    expect(response.status).toBe(200);
    expect(payload).toEqual(expect.objectContaining({
      places: [
        expect.objectContaining({
          id: null,
          category: 'event:none',
          isActive: false,
          isManualOverride: true,
          reviewCount: 0,
        }),
      ],
    }));
  });

  it('updates place visibility with only supported body fields and returns the mapped row', async () => {
    vi.spyOn(Date.prototype, 'toISOString').mockReturnValue('2026-05-14T01:00:00Z');
    const service = createService();
    const request = new Request('https://api.test/api/admin/places/place-1', {
      method: 'PATCH',
      body: JSON.stringify({ isActive: false, isManualOverride: true, ignored: true }),
    });

    const response = await service.handleAdminPlaceVisibility(request, env, 'place-1');
    const payload = await readJson(response);

    expect(response.status).toBe(200);
    expect(adminDomainMocks.updateAdminPlaceVisibility).toHaveBeenCalledWith(env, 'place-1', {
      is_active: false,
      is_manual_override: true,
      updated_at: '2026-05-14T01:00:00Z',
    });
    expect(adminDomainMocks.loadPlaceReviewRows).toHaveBeenCalledWith(env, 101);
    expect(payload).toEqual(expect.objectContaining({
      id: 'place-1',
      category: 'cafe:place-1',
      isActive: false,
      isManualOverride: true,
      reviewCount: 2,
    }));
  });

  it('updates place visibility with an invalid or empty JSON body by only touching updated_at', async () => {
    vi.spyOn(Date.prototype, 'toISOString').mockReturnValue('2026-05-14T02:00:00Z');
    const service = createService();
    const request = new Request('https://api.test/api/admin/places/place-1', {
      method: 'PATCH',
      body: '{not-json',
    });

    const response = await service.handleAdminPlaceVisibility(request, env, 'place-1');

    expect(response.status).toBe(200);
    expect(adminDomainMocks.updateAdminPlaceVisibility).toHaveBeenCalledWith(env, 'place-1', {
      updated_at: '2026-05-14T02:00:00Z',
    });
  });

  it('returns not found when a place visibility target is missing', async () => {
    adminDomainMocks.updateAdminPlaceVisibility.mockResolvedValueOnce(null);
    const service = createService();

    const response = await service.handleAdminPlaceVisibility(new Request('https://api.test/api/admin/places/missing'), env, 'missing');

    expect(response.status).toBe(404);
  });

  it('reports public data import state without executing imports from the admin route', async () => {
    const service = createService();

    const response = await service.handleAdminImportPublicData(new Request('https://api.test/api/admin/import-public-data'), env);
    const payload = await readJson(response);

    expect(response.status).toBe(200);
    expect(adminDomainMocks.loadPublicDataSource).toHaveBeenCalledWith(env, 'jamissue-public-event-feed');
    expect(payload).toEqual(expect.objectContaining({
      importedPlaces: 0,
      importedCourses: 0,
      importedEvents: 0,
      mode: 'scheduled',
      importedAt: '2026-05-14T00:00:00Z',
    }));
  });

  it('reports null import timestamps and rejects import state reads for anonymous users', async () => {
    const service = createService();

    authMocks.readSessionUser.mockResolvedValueOnce(null);
    expect((await service.handleAdminImportPublicData(new Request('https://api.test/api/admin/import-public-data'), env)).status).toBe(403);

    adminDomainMocks.loadPublicDataSource.mockResolvedValueOnce(null);
    const response = await service.handleAdminImportPublicData(new Request('https://api.test/api/admin/import-public-data'), env);

    expect(response.status).toBe(200);
    await expect(readJson(response)).resolves.toEqual(expect.objectContaining({ importedAt: null }));
  });
});
