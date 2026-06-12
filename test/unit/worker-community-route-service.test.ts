import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createCommunityRouteService } from '../../deploy/api-worker-shell/services/community-routes';
import type { WorkerEnv } from '../../deploy/api-worker-shell/types';

const authMocks = vi.hoisted(() => ({
  readSessionUser: vi.fn(),
}));

const communityMocks = vi.hoisted(() => ({
  countRouteLikes: vi.fn(),
  createRouteLike: vi.fn(),
  createUserRoute: vi.fn(),
  createUserRoutePlaces: vi.fn(),
  deleteRouteLike: vi.fn(),
  loadRouteDetailRows: vi.fn(),
  loadRouteRows: vi.fn(),
  loadSessionStampRows: vi.fn(),
  mapCommunityRoutes: vi.fn(),
  readExistingRouteForSession: vi.fn(),
  readRouteLikeRow: vi.fn(),
  readRouteRow: vi.fn(),
  readTravelSessionForOwner: vi.fn(),
  updateRouteLikeCount: vi.fn(),
}));

const notificationMocks = vi.hoisted(() => ({
  countUnreadNotifications: vi.fn(),
  createUserNotification: vi.fn(),
  loadNotificationById: vi.fn(),
  publishNotificationEvent: vi.fn(),
}));

vi.mock('../../deploy/api-worker-shell/services/auth', () => ({
  readSessionUser: authMocks.readSessionUser,
}));

vi.mock('../../deploy/api-worker-shell/services/community-domain', () => ({
  countRouteLikes: communityMocks.countRouteLikes,
  createRouteLike: communityMocks.createRouteLike,
  createUserRoute: communityMocks.createUserRoute,
  createUserRoutePlaces: communityMocks.createUserRoutePlaces,
  deleteRouteLike: communityMocks.deleteRouteLike,
  loadRouteDetailRows: communityMocks.loadRouteDetailRows,
  loadRouteRows: communityMocks.loadRouteRows,
  loadSessionStampRows: communityMocks.loadSessionStampRows,
  mapCommunityRoutes: communityMocks.mapCommunityRoutes,
  readExistingRouteForSession: communityMocks.readExistingRouteForSession,
  readRouteLikeRow: communityMocks.readRouteLikeRow,
  readRouteRow: communityMocks.readRouteRow,
  readTravelSessionForOwner: communityMocks.readTravelSessionForOwner,
  updateRouteLikeCount: communityMocks.updateRouteLikeCount,
}));

vi.mock('../../deploy/api-worker-shell/services/notifications', () => ({
  countUnreadNotifications: notificationMocks.countUnreadNotifications,
  createUserNotification: notificationMocks.createUserNotification,
  loadNotificationById: notificationMocks.loadNotificationById,
  publishNotificationEvent: notificationMocks.publishNotificationEvent,
}));

const env = {
  APP_CORS_ORIGINS: '',
  APP_FRONTEND_URL: 'https://daejeon.jamissue.com',
} as WorkerEnv;

function createService() {
  return createCommunityRouteService({
    loadStaticBaseRows: vi.fn(async () => ({
      placeRows: [
        { position_id: 101, slug: 'place-1', name: 'Place 1' },
        { position_id: 102, slug: 'place-2', name: 'Place 2' },
      ],
    })),
  });
}

async function readJson(response: Response) {
  return response.json() as Promise<unknown>;
}

function createJsonRequest(path: string, payload: unknown) {
  return new Request(`https://api.test${path}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

describe('worker community route service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMocks.readSessionUser.mockResolvedValue({ id: 'user-1' });
    communityMocks.loadRouteRows.mockResolvedValue([{ route_id: 7, user_id: 'user-1' }]);
    communityMocks.loadRouteDetailRows.mockResolvedValue({
      routePlaceRows: [
        { route_id: 7, position_id: 101, stop_order: 1 },
        { route_id: 7, position_id: 102, stop_order: 2 },
      ],
      userRouteLikeRows: [{ route_id: 7 }],
      userRows: [{ user_id: 'user-1', nickname: 'Author' }],
    });
    communityMocks.mapCommunityRoutes.mockReturnValue([{ id: '7', title: 'Route' }]);
    communityMocks.readTravelSessionForOwner.mockResolvedValue({ travel_session_id: 55 });
    communityMocks.readExistingRouteForSession.mockResolvedValue(null);
    communityMocks.loadSessionStampRows.mockResolvedValue([
      { position_id: 101 },
      { position_id: 101 },
      { position_id: 102 },
    ]);
    communityMocks.createUserRoute.mockResolvedValue(7);
    communityMocks.readRouteRow.mockResolvedValue({ route_id: 7 });
    communityMocks.readRouteLikeRow.mockResolvedValue(null);
    communityMocks.countRouteLikes.mockResolvedValue(3);
    notificationMocks.createUserNotification.mockResolvedValue({ notification_id: 'notification-1' });
    notificationMocks.loadNotificationById.mockResolvedValue({ id: 'notification-1' });
    notificationMocks.countUnreadNotifications.mockResolvedValue(1);
  });

  it('loads public and owner-scoped routes with session like state', async () => {
    const service = createService();

    await expect(service.loadCommunityRoutes(env, { sort: 'latest', sessionUserId: 'user-1' })).resolves.toEqual([{ id: '7', title: 'Route' }]);
    const publicResponse = await service.handleCommunityRoutes(
      new Request('https://api.test/api/community/routes?sort=latest'),
      env,
      new URL('https://api.test/api/community/routes?sort=latest'),
    );
    const myResponse = await service.handleMyRoutes(new Request('https://api.test/api/my/routes'), env);

    expect(communityMocks.loadRouteRows).toHaveBeenCalledWith(env, { sort: 'latest', ownerUserId: null });
    expect(communityMocks.loadRouteDetailRows).toHaveBeenCalledWith(env, [{ route_id: 7, user_id: 'user-1' }], 'user-1');
    expect(communityMocks.mapCommunityRoutes).toHaveBeenCalledWith(
      [{ route_id: 7, user_id: 'user-1' }],
      expect.any(Array),
      expect.any(Map),
      expect.any(Map),
      new Set(['7']),
    );
    expect(publicResponse.status).toBe(200);
    expect(myResponse.status).toBe(200);
  });

  it('returns an empty route list before loading places when route stops are absent', async () => {
    communityMocks.loadRouteDetailRows.mockResolvedValueOnce({
      routePlaceRows: [],
      userRouteLikeRows: [],
      userRows: [],
    });
    const service = createService();

    await expect(service.loadCommunityRoutes(env)).resolves.toEqual([]);

    expect(communityMocks.mapCommunityRoutes).not.toHaveBeenCalled();
  });

  it('guards my routes and route creation behind session auth', async () => {
    authMocks.readSessionUser.mockResolvedValue(null);
    const service = createService();

    const myResponse = await service.handleMyRoutes(new Request('https://api.test/api/my/routes'), env);
    const createResponse = await service.handleCreateUserRoute(createJsonRequest('/api/community/routes', {}), env);

    expect(myResponse.status).toBe(401);
    expect(createResponse.status).toBe(401);
  });

  it('validates create route payload, ownership, duplicate state, and minimum unique stops', async () => {
    const service = createService();

    const missingSession = await service.handleCreateUserRoute(createJsonRequest('/api/community/routes', { title: 'Title', description: 'Description' }), env);
    expect(missingSession.status).toBe(400);

    const missingTitle = await service.handleCreateUserRoute(createJsonRequest('/api/community/routes', { travelSessionId: 55, description: 'Description' }), env);
    expect(missingTitle.status).toBe(400);

    const missingDescription = await service.handleCreateUserRoute(createJsonRequest('/api/community/routes', { travelSessionId: 55, title: 'Title' }), env);
    expect(missingDescription.status).toBe(400);

    communityMocks.readTravelSessionForOwner.mockResolvedValueOnce(null);
    const missingOwnerSession = await service.handleCreateUserRoute(createJsonRequest('/api/community/routes', { travelSessionId: 55, title: 'Title', description: 'Description' }), env);
    expect(missingOwnerSession.status).toBe(404);

    communityMocks.readExistingRouteForSession.mockResolvedValueOnce({ route_id: 7 });
    const duplicate = await service.handleCreateUserRoute(createJsonRequest('/api/community/routes', { travelSessionId: 55, title: 'Title', description: 'Description' }), env);
    expect(duplicate.status).toBe(409);

    communityMocks.loadSessionStampRows.mockResolvedValueOnce([{ position_id: 101 }]);
    const tooShort = await service.handleCreateUserRoute(createJsonRequest('/api/community/routes', { travelSessionId: 55, title: 'Title', description: 'Description' }), env);
    expect(tooShort.status).toBe(400);
  });

  it('creates a user route, route stops, and publication notification', async () => {
    const service = createService();
    const request = createJsonRequest('/api/community/routes', {
      travelSessionId: 55,
      title: 'Title',
      description: 'Description',
      mood: 'Mood',
      isPublic: false,
    });

    const response = await service.handleCreateUserRoute(request, env);
    const payload = await readJson(response);

    expect(response.status).toBe(201);
    expect(payload).toEqual({ id: '7', title: 'Route' });
    expect(communityMocks.createUserRoute).toHaveBeenCalledWith(env, expect.objectContaining({
      user_id: 'user-1',
      travel_session_id: 55,
      title: 'Title',
      description: 'Description',
      mood: 'Mood',
      is_public: false,
      like_count: 0,
    }));
    expect(communityMocks.createUserRoutePlaces).toHaveBeenCalledWith(env, 7, ['101', '102']);
    expect(notificationMocks.publishNotificationEvent).toHaveBeenCalledWith(env, 'user-1', 'notification.created', {
      notification: { id: 'notification-1' },
      unreadCount: 1,
    });
  });

  it('toggles route likes by creating or deleting a user like row', async () => {
    const service = createService();

    const liked = await service.handleToggleCommunityRouteLike(new Request('https://api.test/api/community/routes/7/like'), env, '7');
    await expect(readJson(liked)).resolves.toEqual({ routeId: '7', likeCount: 3, likedByMe: true });
    expect(communityMocks.createRouteLike).toHaveBeenCalledWith(env, '7', 'user-1');
    expect(communityMocks.updateRouteLikeCount).toHaveBeenCalledWith(env, '7', 3);

    communityMocks.readRouteLikeRow.mockResolvedValueOnce({ route_like_id: 'like-1' });
    const unliked = await service.handleToggleCommunityRouteLike(new Request('https://api.test/api/community/routes/7/like'), env, '7');
    await expect(readJson(unliked)).resolves.toEqual({ routeId: '7', likeCount: 3, likedByMe: false });
    expect(communityMocks.deleteRouteLike).toHaveBeenCalledWith(env, 'like-1');
  });

  it('rejects route like requests for missing routes', async () => {
    communityMocks.readRouteRow.mockResolvedValueOnce(null);
    const service = createService();

    const response = await service.handleToggleCommunityRouteLike(new Request('https://api.test/api/community/routes/missing/like'), env, 'missing');

    expect(response.status).toBe(404);
  });
});
