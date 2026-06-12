import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMyService } from '../../deploy/api-worker-shell/services/my';
import type { WorkerEnv } from '../../deploy/api-worker-shell/types';

const authMocks = vi.hoisted(() => ({
  readSessionUser: vi.fn(),
}));

const myDomainMocks = vi.hoisted(() => ({
  loadFeedsForCommentRows: vi.fn(),
  loadMyCommentRows: vi.fn(),
  loadMySummaryCommentRows: vi.fn(),
  mapMyComments: vi.fn(),
}));

vi.mock('../../deploy/api-worker-shell/services/auth', () => ({
  readSessionUser: authMocks.readSessionUser,
}));

vi.mock('../../deploy/api-worker-shell/services/my-domain', () => ({
  loadFeedsForCommentRows: myDomainMocks.loadFeedsForCommentRows,
  loadMyCommentRows: myDomainMocks.loadMyCommentRows,
  loadMySummaryCommentRows: myDomainMocks.loadMySummaryCommentRows,
  mapMyComments: myDomainMocks.mapMyComments,
}));

const env = {
  APP_CORS_ORIGINS: '',
  APP_FRONTEND_URL: 'https://daejeon.jamissue.com',
} as WorkerEnv;

const sessionUser = { id: 'user-1', nickname: 'User' };

function createService() {
  const communityRouteService = {
    loadCommunityRoutes: vi.fn(async () => [{ id: 'route-1' }]),
  };
  const loadBaseData = vi.fn(async () => ({
    places: [
      { id: 'place-1', positionId: '101', name: 'Place 1' },
      { id: 'place-2', positionId: '102', name: 'Place 2' },
    ],
    reviews: [
      { id: 'review-1', userId: 'user-1', body: 'mine' },
      { id: 'review-2', userId: 'other-user', body: 'other' },
    ],
    collectedPlaceIds: ['place-1'],
    stampLogs: [{ id: 'stamp-1' }],
    travelSessions: [{ id: 'session-1' }],
  }));
  const loadStaticBaseRows = vi.fn(async () => ({
    placeRows: [
      { position_id: 101, slug: 'place-1', name: 'Place 1' },
      { position_id: 102, slug: 'place-2', name: 'Place 2' },
    ],
  }));
  const loadUserNotifications = vi.fn(async () => [
    { id: 'notification-1', isRead: false },
    { id: 'notification-2', isRead: true },
  ]);
  return {
    communityRouteService,
    loadBaseData,
    loadStaticBaseRows,
    loadUserNotifications,
    service: createMyService({
      communityRouteService,
      loadBaseData,
      loadStaticBaseRows,
      loadUserNotifications,
    }),
  };
}

async function readJson(response: Response) {
  return response.json() as Promise<unknown>;
}

describe('worker my service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMocks.readSessionUser.mockResolvedValue(sessionUser);
    myDomainMocks.loadMyCommentRows.mockResolvedValue([
      { comment_id: 'comment-1', feed_id: 'review-1', created_at: '2026-05-14T00:00:00Z' },
      { comment_id: 'comment-2', feed_id: 'review-2', created_at: '2026-05-14T01:00:00Z' },
    ]);
    myDomainMocks.loadFeedsForCommentRows.mockResolvedValue([{ feed_id: 'review-1', position_id: 101 }]);
    myDomainMocks.loadMySummaryCommentRows.mockResolvedValue([{ comment_id: 'comment-1', feed_id: 'review-1' }]);
    myDomainMocks.mapMyComments.mockReturnValue([{ id: 'comment-1', body: 'comment' }]);
  });

  it('guards my comments and summary endpoints behind session auth', async () => {
    authMocks.readSessionUser.mockResolvedValue(null);
    const { service } = createService();

    const comments = await service.handleMyComments(new Request('https://api.test/api/my/comments'), env, new URL('https://api.test/api/my/comments'));
    const summary = await service.handleMySummary(new Request('https://api.test/api/my/summary'), env);

    expect(comments.status).toBe(401);
    expect(summary.status).toBe(401);
  });

  it('loads paged my comments and short-circuits when matching feed rows are absent', async () => {
    const { service } = createService();

    const response = await service.handleMyComments(
      new Request('https://api.test/api/my/comments?cursor=cursor-1&limit=1'),
      env,
      new URL('https://api.test/api/my/comments?cursor=cursor-1&limit=1'),
    );
    await expect(readJson(response)).resolves.toEqual({
      items: [{ id: 'comment-1', body: 'comment' }],
      nextCursor: '2026-05-14T01:00:00Z',
    });
    expect(myDomainMocks.loadMyCommentRows).toHaveBeenCalledWith(env, 'user-1', 'cursor-1', 1);
    expect(myDomainMocks.mapMyComments).toHaveBeenCalledWith(
      [expect.objectContaining({ comment_id: 'comment-1' })],
      [{ feed_id: 'review-1', position_id: 101 }],
      expect.any(Map),
    );

    myDomainMocks.loadFeedsForCommentRows.mockResolvedValueOnce([]);
    const empty = await service.handleMyComments(new Request('https://api.test/api/my/comments'), env, new URL('https://api.test/api/my/comments'));
    await expect(readJson(empty)).resolves.toEqual({ items: [], nextCursor: null });
  });

  it('builds my summary from base data, owner routes, notifications, comments, and visit partitions', async () => {
    const { communityRouteService, loadBaseData, loadUserNotifications, service } = createService();

    const response = await service.handleMySummary(new Request('https://api.test/api/my/summary'), env);
    const payload = await readJson(response);

    expect(response.status).toBe(200);
    expect(loadBaseData).toHaveBeenCalledWith(env, 'user-1');
    expect(communityRouteService.loadCommunityRoutes).toHaveBeenCalledWith(env, { ownerUserId: 'user-1', sessionUserId: 'user-1' });
    expect(loadUserNotifications).toHaveBeenCalledWith(env, 'user-1');
    expect(myDomainMocks.loadMySummaryCommentRows).toHaveBeenCalledWith(env, 'user-1');
    expect(payload).toEqual(expect.objectContaining({
      user: sessionUser,
      stats: {
        reviewCount: 1,
        stampCount: 1,
        uniquePlaceCount: 1,
        totalPlaceCount: 2,
        routeCount: 1,
      },
      reviews: [expect.objectContaining({ id: 'review-1' })],
      comments: [{ id: 'comment-1', body: 'comment' }],
      unreadNotificationCount: 1,
      visitedPlaces: [expect.objectContaining({ id: 'place-1' })],
      unvisitedPlaces: [expect.objectContaining({ id: 'place-2' })],
      collectedPlaces: [expect.objectContaining({ id: 'place-1' })],
      routes: [{ id: 'route-1' }],
    }));
  });
});
