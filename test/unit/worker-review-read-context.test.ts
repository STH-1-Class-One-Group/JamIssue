import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { WorkerEnv } from '../../deploy/api-worker-shell/types';
import {
  buildReviewPlaceContext,
  loadReviewMappingContext,
} from '../../deploy/api-worker-shell/services/review-domain/read-context';

const readRepositoryMocks = vi.hoisted(() => ({
  readReviewCommentRows: vi.fn(),
  readReviewLikeRows: vi.fn(),
  readReviewRouteRows: vi.fn(),
  readReviewStampRows: vi.fn(),
  readReviewUserRows: vi.fn(),
  readUserFeedLikeRows: vi.fn(),
}));

vi.mock('../../deploy/api-worker-shell/services/review-domain/read-repository', () => ({
  readReviewCommentRows: readRepositoryMocks.readReviewCommentRows,
  readReviewLikeRows: readRepositoryMocks.readReviewLikeRows,
  readReviewRouteRows: readRepositoryMocks.readReviewRouteRows,
  readReviewStampRows: readRepositoryMocks.readReviewStampRows,
  readReviewUserRows: readRepositoryMocks.readReviewUserRows,
  readUserFeedLikeRows: readRepositoryMocks.readUserFeedLikeRows,
}));

const env = {} as WorkerEnv;

describe('worker review read context', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('builds place lookup maps from static rows without exposing mapper internals', () => {
    const context = buildReviewPlaceContext([
      { position_id: 101, slug: 'place-1', name: 'Place 1' },
      { position_id: 102, slug: 'place-2', name: 'Place 2' },
    ], (row) => ({
      id: String(row.slug),
      positionId: String(row.position_id),
      name: String(row.name),
    }));

    expect(context.placeIdToPositionId).toEqual(new Map([
      ['place-1', '101'],
      ['place-2', '102'],
    ]));
    expect(context.placesByPositionId.get('101')).toEqual({ id: 'place-1', positionId: '101', name: 'Place 1' });
  });

  it('loads mapper context rows, indexes users and stamps, and tracks session-liked feed ids', async () => {
    readRepositoryMocks.readReviewCommentRows.mockResolvedValueOnce([
      { comment_id: 'comment-1', feed_id: 'feed-1', user_id: 'commenter-1', body: 'comment', created_at: '2026-05-14T00:00:00Z' },
    ]);
    readRepositoryMocks.readReviewLikeRows.mockResolvedValueOnce([{ feed_id: 'feed-1' }]);
    readRepositoryMocks.readReviewStampRows.mockResolvedValueOnce([
      { stamp_id: 'stamp-1', travel_session_id: 'session-1', visit_ordinal: 2 },
      { stamp_id: 'stamp-2', travel_session_id: null, visit_ordinal: 1 },
    ]);
    readRepositoryMocks.readUserFeedLikeRows.mockResolvedValueOnce([{ feed_id: 'feed-1' }]);
    readRepositoryMocks.readReviewRouteRows.mockResolvedValueOnce([{ route_id: 'route-1', travel_session_id: 'session-1' }]);
    readRepositoryMocks.readReviewUserRows.mockResolvedValueOnce([
      { user_id: 'author-1', nickname: 'Author' },
      { user_id: 'commenter-1', nickname: 'Commenter' },
    ]);

    const context = await loadReviewMappingContext(env, [
      { feed_id: 'feed-1', user_id: 'author-1', position_id: 101, stamp_id: 'stamp-1', body: 'body', created_at: '2026-05-14T00:00:00Z' },
      { feed_id: 'feed-2', user_id: 'author-1', position_id: 101, stamp_id: 'stamp-2', body: 'body', created_at: '2026-05-14T00:01:00Z' },
    ], 'session-user');

    expect(readRepositoryMocks.readReviewCommentRows).toHaveBeenCalledWith(env, ['feed-1', 'feed-2']);
    expect(readRepositoryMocks.readReviewStampRows).toHaveBeenCalledWith(env, ['stamp-1', 'stamp-2']);
    expect(readRepositoryMocks.readUserFeedLikeRows).toHaveBeenCalledWith(env, ['feed-1', 'feed-2'], 'session-user');
    expect(readRepositoryMocks.readReviewRouteRows).toHaveBeenCalledWith(env, ['session-1']);
    expect(readRepositoryMocks.readReviewUserRows).toHaveBeenCalledWith(env, ['author-1', 'author-1', 'commenter-1']);
    expect(context.likedFeedIds).toEqual(new Set(['feed-1']));
    expect(context.stampRowsById.get('stamp-1')).toEqual({ stamp_id: 'stamp-1', travel_session_id: 'session-1', visit_ordinal: 2 });
    expect(context.usersById.get('commenter-1')).toEqual({ user_id: 'commenter-1', nickname: 'Commenter' });
  });

  it('normalizes empty optional repository results while keeping empty route and liked sets stable', async () => {
    readRepositoryMocks.readReviewCommentRows.mockResolvedValueOnce([]);
    readRepositoryMocks.readReviewLikeRows.mockResolvedValueOnce([]);
    readRepositoryMocks.readReviewStampRows.mockResolvedValueOnce(undefined);
    readRepositoryMocks.readUserFeedLikeRows.mockResolvedValueOnce(undefined);
    readRepositoryMocks.readReviewRouteRows.mockResolvedValueOnce([]);
    readRepositoryMocks.readReviewUserRows.mockResolvedValueOnce([]);

    const context = await loadReviewMappingContext(env, [], null);

    expect(readRepositoryMocks.readReviewRouteRows).toHaveBeenCalledWith(env, []);
    expect(context.commentRows).toEqual([]);
    expect(context.likeRows).toEqual([]);
    expect(context.likedFeedIds).toEqual(new Set());
    expect(context.reviewRouteRows).toEqual([]);
    expect(context.stampRowsById).toEqual(new Map());
    expect(context.usersById).toEqual(new Map());
  });
});
