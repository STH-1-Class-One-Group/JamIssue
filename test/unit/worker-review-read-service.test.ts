import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createReviewReadService } from '../../deploy/api-worker-shell/services/reviews';
import type { WorkerEnv } from '../../deploy/api-worker-shell/types';

const reviewDomainMocks = vi.hoisted(() => ({
  createReviewMapper: vi.fn(),
  mapReviewRows: vi.fn(),
  readReviewCommentRows: vi.fn(),
  readReviewFeedRows: vi.fn(),
  readReviewLikeRows: vi.fn(),
  readReviewPageRows: vi.fn(),
  readReviewPlaceRows: vi.fn(),
  readReviewRouteRows: vi.fn(),
  readReviewStampRows: vi.fn(),
  readReviewUserRows: vi.fn(),
  readSingleReviewFeedRow: vi.fn(),
  readUserFeedLikeRows: vi.fn(),
}));

const authMocks = vi.hoisted(() => ({
  readSessionUser: vi.fn(),
}));

vi.mock('../../deploy/api-worker-shell/services/review-domain', () => ({
  createReviewMapper: reviewDomainMocks.createReviewMapper,
  readReviewCommentRows: reviewDomainMocks.readReviewCommentRows,
  readReviewFeedRows: reviewDomainMocks.readReviewFeedRows,
  readReviewLikeRows: reviewDomainMocks.readReviewLikeRows,
  readReviewPageRows: reviewDomainMocks.readReviewPageRows,
  readReviewPlaceRows: reviewDomainMocks.readReviewPlaceRows,
  readReviewRouteRows: reviewDomainMocks.readReviewRouteRows,
  readReviewStampRows: reviewDomainMocks.readReviewStampRows,
  readReviewUserRows: reviewDomainMocks.readReviewUserRows,
  readSingleReviewFeedRow: reviewDomainMocks.readSingleReviewFeedRow,
  readUserFeedLikeRows: reviewDomainMocks.readUserFeedLikeRows,
}));

vi.mock('../../deploy/api-worker-shell/services/auth', () => ({
  readSessionUser: authMocks.readSessionUser,
}));

const env = {
  APP_CORS_ORIGINS: '',
  APP_FRONTEND_URL: 'https://daejeon.jamissue.com',
} as WorkerEnv;

const placeRow = { position_id: 101, slug: 'place-1', name: 'Place 1' };
const workerPlace = { id: 'place-1', positionId: '101', name: 'Place 1' };

function createService() {
  return createReviewReadService({
    formatVisitLabel: (visitNumber) => `visit-${String(visitNumber)}`,
    loadStaticBaseRows: vi.fn(async () => ({ placeRows: [placeRow] })),
    mapPlace: vi.fn(() => workerPlace),
  });
}

function feedRow(overrides: Record<string, unknown> = {}) {
  return {
    feed_id: 'feed-1',
    user_id: 'user-1',
    position_id: 101,
    stamp_id: 'stamp-1',
    body: 'review body',
    created_at: '2026-05-14T00:00:00Z',
    ...overrides,
  };
}

function installDefaultRows() {
  reviewDomainMocks.readReviewFeedRows.mockResolvedValue([feedRow()]);
  reviewDomainMocks.readReviewPageRows.mockResolvedValue([
    feedRow({ feed_id: 'feed-1', created_at: '2026-05-14T00:00:00Z' }),
    feedRow({ feed_id: 'feed-2', created_at: '2026-05-14T01:00:00Z' }),
  ]);
  reviewDomainMocks.readSingleReviewFeedRow.mockResolvedValue(feedRow());
  reviewDomainMocks.readReviewCommentRows.mockResolvedValue([
    { comment_id: 'comment-1', feed_id: 'feed-1', user_id: 'commenter-1', body: 'comment', created_at: '2026-05-14T00:01:00Z' },
  ]);
  reviewDomainMocks.readReviewLikeRows.mockResolvedValue([{ feed_id: 'feed-1' }]);
  reviewDomainMocks.readReviewStampRows.mockResolvedValue([
    { stamp_id: 'stamp-1', travel_session_id: 'session-1', visit_ordinal: 2 },
  ]);
  reviewDomainMocks.readReviewRouteRows.mockResolvedValue([{ route_id: 'route-1', travel_session_id: 'session-1' }]);
  reviewDomainMocks.readReviewUserRows.mockResolvedValue([
    { user_id: 'user-1', nickname: 'Author' },
    { user_id: 'commenter-1', nickname: 'Commenter' },
  ]);
  reviewDomainMocks.readReviewPlaceRows.mockResolvedValue([placeRow]);
  reviewDomainMocks.readUserFeedLikeRows.mockResolvedValue([{ feed_id: 'feed-1' }]);
}

async function readJson(response: Response) {
  return response.json() as Promise<unknown>;
}

describe('worker review read service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    reviewDomainMocks.createReviewMapper.mockReturnValue({
      buildCommentTree: vi.fn(),
      countComments: vi.fn(),
      mapReviewRows: reviewDomainMocks.mapReviewRows,
    });
    reviewDomainMocks.mapReviewRows.mockImplementation((feedRows: Array<{ feed_id: string }>) =>
      feedRows.map((row) => ({ id: String(row.feed_id), mapped: true })),
    );
    authMocks.readSessionUser.mockResolvedValue({ id: 'session-user' });
    installDefaultRows();
  });

  it('returns an empty list without repository reads when a place filter cannot resolve to a position', async () => {
    const service = createService();

    await expect(service.loadReviewData(env, 'session-user', { placeId: 'missing-place' })).resolves.toEqual([]);

    expect(reviewDomainMocks.readReviewFeedRows).not.toHaveBeenCalled();
    expect(reviewDomainMocks.mapReviewRows).not.toHaveBeenCalled();
  });

  it('loads review feed dependencies with session-scoped liked state', async () => {
    const service = createService();

    const reviews = await service.loadReviewData(env, 'session-user', { placeId: 'place-1', userId: 'user-1' });

    expect(reviews).toEqual([{ id: 'feed-1', mapped: true }]);
    expect(reviewDomainMocks.readReviewFeedRows).toHaveBeenCalledWith(env, { positionId: '101', userId: 'user-1' });
    expect(reviewDomainMocks.readReviewCommentRows).toHaveBeenCalledWith(env, ['feed-1']);
    expect(reviewDomainMocks.readReviewStampRows).toHaveBeenCalledWith(env, ['stamp-1']);
    expect(reviewDomainMocks.readReviewRouteRows).toHaveBeenCalledWith(env, ['session-1']);
    expect(reviewDomainMocks.readReviewUserRows).toHaveBeenCalledWith(env, ['user-1', 'commenter-1']);
    expect(reviewDomainMocks.readUserFeedLikeRows).toHaveBeenCalledWith(env, ['feed-1'], 'session-user');
    expect(reviewDomainMocks.mapReviewRows).toHaveBeenCalledWith(
      [expect.objectContaining({ feed_id: 'feed-1' })],
      [expect.objectContaining({ comment_id: 'comment-1' })],
      [{ feed_id: 'feed-1' }],
      expect.any(Map),
      expect.any(Map),
      expect.any(Map),
      [{ route_id: 'route-1', travel_session_id: 'session-1' }],
      new Set(['feed-1']),
    );
  });

  it('keeps paged review reads bounded and exposes the next cursor from the extra row', async () => {
    const service = createService();

    const page = await service.loadReviewPageData(env, 'session-user', { limit: 1 });

    expect(page).toEqual({ items: [{ id: 'feed-1', mapped: true }], nextCursor: '2026-05-14T01:00:00Z' });
    expect(reviewDomainMocks.readReviewPageRows).toHaveBeenCalledWith(env, { cursor: null, limit: 1 });
    expect(reviewDomainMocks.mapReviewRows).toHaveBeenCalledWith(
      [expect.objectContaining({ feed_id: 'feed-1' })],
      expect.any(Array),
      expect.any(Array),
      expect.any(Map),
      expect.any(Map),
      expect.any(Map),
      expect.any(Array),
      expect.any(Set),
    );
  });

  it('loads single review details from the point lookup path and returns null when missing', async () => {
    const service = createService();

    await expect(service.loadSingleReview(env, 'feed-1', 'session-user')).resolves.toEqual({ id: 'feed-1', mapped: true });
    expect(reviewDomainMocks.readSingleReviewFeedRow).toHaveBeenCalledWith(env, 'feed-1');
    expect(reviewDomainMocks.readReviewPlaceRows).toHaveBeenCalledWith(env, 101);

    reviewDomainMocks.readSingleReviewFeedRow.mockResolvedValueOnce(null);
    await expect(service.loadSingleReview(env, 'missing-feed', 'session-user')).resolves.toBeNull();
  });

  it('serves review route handlers through session-aware JSON responses', async () => {
    const service = createService();
    const listRequest = new Request('https://api.test/api/reviews?placeId=place-1&userId=user-1');
    const feedRequest = new Request('https://api.test/api/reviews/feed?limit=1');
    const detailRequest = new Request('https://api.test/api/reviews/feed-1');

    const listResponse = await service.handleReviews(listRequest, env, new URL(listRequest.url));
    const feedResponse = await service.handleReviewFeed(feedRequest, env, new URL(feedRequest.url));
    const detailResponse = await service.handleReviewDetail(detailRequest, env, 'feed-1');

    expect(listResponse.status).toBe(200);
    expect(feedResponse.status).toBe(200);
    expect(detailResponse.status).toBe(200);
    await expect(readJson(listResponse)).resolves.toEqual([{ id: 'feed-1', mapped: true }]);
    await expect(readJson(feedResponse)).resolves.toEqual({
      items: [{ id: 'feed-1', mapped: true }],
      nextCursor: '2026-05-14T01:00:00Z',
    });
    await expect(readJson(detailResponse)).resolves.toEqual({ id: 'feed-1', mapped: true });
    expect(authMocks.readSessionUser).toHaveBeenCalledTimes(3);
  });

  it('returns a not-found response when a review detail row is absent', async () => {
    reviewDomainMocks.readSingleReviewFeedRow.mockResolvedValueOnce(null);
    const service = createService();
    const request = new Request('https://api.test/api/reviews/missing-feed');

    const response = await service.handleReviewDetail(request, env, 'missing-feed');
    const payload = await readJson(response);

    expect(response.status).toBe(404);
    expect(payload).toEqual(expect.objectContaining({ detail: expect.any(String) }));
  });
});
