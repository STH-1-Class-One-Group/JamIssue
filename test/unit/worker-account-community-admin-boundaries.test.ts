import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createAdminService } from '../../deploy/api-worker-shell/services/admin';
import { createCommunityRouteService } from '../../deploy/api-worker-shell/services/community-routes';
import { createMyService } from '../../deploy/api-worker-shell/services/my';
import type { WorkerEnv, WorkerSessionUser } from '../../deploy/api-worker-shell/types';

const authMock = vi.hoisted(() => ({
  readSessionUser: vi.fn(),
}));

const supabaseMock = vi.hoisted(() => ({
  buildInFilter: (values: unknown[]) => {
    const unique = [...new Set(values.filter((value) => value !== null && value !== undefined && value !== ''))];
    return unique.length > 0 ? `in.(${unique.map((value) => encodeURIComponent(String(value))).join(',')})` : null;
  },
  encodeFilterValue: (value: unknown) => encodeURIComponent(String(value)),
  getSupabaseKey: vi.fn(() => 'service-role-key'),
  parseListLimit: vi.fn(() => 10),
  supabaseRequest: vi.fn(),
}));

vi.mock('../../deploy/api-worker-shell/services/auth', () => authMock);
vi.mock('../../deploy/api-worker-shell/lib/supabase', () => supabaseMock);

const env: WorkerEnv = {
  APP_FRONTEND_URL: 'https://daejeon.jamissue.com',
  APP_SUPABASE_URL: 'https://supabase.example',
};

const sessionUser: WorkerSessionUser = {
  id: 'actor',
  nickname: 'Actor',
  email: null,
  provider: 'kakao',
  profileImage: null,
  isAdmin: false,
  profileCompletedAt: null,
};

async function readJson(response: Response) {
  return (await response.json()) as Record<string, any>;
}

describe('worker account/community/admin boundaries', () => {
  beforeEach(() => {
    authMock.readSessionUser.mockReset();
    supabaseMock.supabaseRequest.mockReset();
  });

  it('keeps admin guard in front of admin repository calls', async () => {
    authMock.readSessionUser.mockResolvedValue(sessionUser);
    const adminService = createAdminService({ normalizePlaceCategory: (category) => String(category || 'attraction') });

    const response = await adminService.handleAdminSummary(new Request('https://api.daejeon.jamissue.com/api/admin/summary'), env);

    expect(response.status).toBe(403);
    expect(await readJson(response)).toEqual({ detail: '관리자만 접근할 수 있어요.' });
    expect(supabaseMock.supabaseRequest).not.toHaveBeenCalled();
  });

  it('scopes community route publishing to the owner travel session', async () => {
    authMock.readSessionUser.mockResolvedValue(sessionUser);
    supabaseMock.supabaseRequest.mockResolvedValueOnce([]);
    const service = createCommunityRouteService({ loadStaticBaseRows: vi.fn() });

    const response = await service.handleCreateUserRoute(
      new Request('https://api.daejeon.jamissue.com/api/community-routes', {
        method: 'POST',
        body: JSON.stringify({ travelSessionId: '77', title: 'Route', description: 'Desc', mood: 'walk' }),
      }),
      env,
    );

    expect(response.status).toBe(404);
    expect(await readJson(response)).toEqual({ detail: '여행 세션을 찾지 못했어요.' });
    expect(supabaseMock.supabaseRequest).toHaveBeenCalledWith(
      env,
      expect.stringContaining('travel_session_id=eq.77&user_id=eq.actor'),
    );
  });

  it('scopes my summary routes and reviews to the current session user', async () => {
    authMock.readSessionUser.mockResolvedValue(sessionUser);
    supabaseMock.supabaseRequest.mockResolvedValue([]);
    const loadCommunityRoutes = vi.fn(async () => [{ id: 'route-1' }]);
    const service = createMyService({
      communityRouteService: { loadCommunityRoutes },
      loadBaseData: vi.fn(async () => ({
        places: [],
        placesByPositionId: new Map(),
        reviews: [
          { id: 'review-1', userId: 'actor' },
          { id: 'review-2', userId: 'other' },
        ],
        courses: [],
        collectedPlaceIds: [],
        stampLogs: [],
        travelSessions: [],
      })),
      loadStaticBaseRows: vi.fn(),
      loadUserNotifications: vi.fn(async () => []),
    });

    const response = await service.handleMySummary(new Request('https://api.daejeon.jamissue.com/api/my/summary'), env);
    const payload = await readJson(response);

    expect(response.status).toBe(200);
    expect(loadCommunityRoutes).toHaveBeenCalledWith(env, { ownerUserId: 'actor', sessionUserId: 'actor' });
    expect(payload.stats.reviewCount).toBe(1);
  });
});
