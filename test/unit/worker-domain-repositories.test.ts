import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { WorkerEnv } from '../../deploy/api-worker-shell/types';
import {
  createCommentRow,
  createReviewLikeRow,
  createReviewRow,
  countReviewLikes,
  deleteReviewLikeRow,
  deleteReviewRow,
  readCommentRow,
  readFeedRow,
  readReviewLikeRow,
  readStampRow,
  softDeleteCommentRow,
  updateCommentRow,
  updateReviewRow,
} from '../../deploy/api-worker-shell/services/review-domain/repository';
import {
  readReviewCommentRows,
  readReviewFeedRows,
  readReviewLikeRows,
  readReviewPageRows,
  readReviewPlaceRows,
  readReviewRouteRows,
  readReviewStampRows,
  readReviewUserRows,
  readSingleReviewFeedRow,
  readUserFeedLikeRows,
} from '../../deploy/api-worker-shell/services/review-domain/read-repository';
import {
  countRouteLikes,
  createRouteLike,
  createUserRoute,
  createUserRoutePlaces,
  deleteRouteLike,
  loadRouteDetailRows,
  loadRouteRows,
  loadSessionStampRows,
  readExistingRouteForSession,
  readRouteLikeRow,
  readRouteRow,
  readTravelSessionForOwner,
  updateRouteLikeCount,
} from '../../deploy/api-worker-shell/services/community-domain/repository';
import {
  loadFeedsForCommentRows,
  loadMyCommentRows,
  loadMySummaryCommentRows,
} from '../../deploy/api-worker-shell/services/my-domain/repository';
import {
  createNotification,
  deleteNotificationRow,
  markAllNotificationsRead,
  markNotificationRead,
  readNotificationActorRow,
  readNotificationActorRows,
  readNotificationRow,
  readUnreadNotificationRows,
  readUserNotificationRows,
} from '../../deploy/api-worker-shell/services/notification-domain/repository';

const supabaseMock = vi.hoisted(() => ({
  supabaseRequest: vi.fn(),
}));

vi.mock('../../deploy/api-worker-shell/lib/supabase', () => ({
  buildInFilter: (values: unknown[]) => {
    const filtered = values.filter((value) => value !== null && value !== undefined && value !== '');
    return filtered.length > 0 ? `in.(${filtered.map((value) => String(value)).join(',')})` : null;
  },
  encodeFilterValue: (value: unknown) => encodeURIComponent(String(value)),
  supabaseRequest: supabaseMock.supabaseRequest,
}));

const env = {} as WorkerEnv;

describe('worker review repository boundaries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('keeps review read queries and empty filters inside read-repository helpers', async () => {
    supabaseMock.supabaseRequest
      .mockResolvedValueOnce([{ feed_id: 7 }])
      .mockResolvedValueOnce([{ feed_id: 8 }])
      .mockResolvedValueOnce([{ feed_id: 9 }])
      .mockResolvedValueOnce([{ comment_id: 1 }])
      .mockResolvedValueOnce([{ feed_like_id: 2 }])
      .mockResolvedValueOnce([{ stamp_id: 3 }])
      .mockResolvedValueOnce([{ feed_id: 7 }])
      .mockResolvedValueOnce([{ route_id: 4 }])
      .mockResolvedValueOnce([{ user_id: 'user-1' }])
      .mockResolvedValueOnce([{ position_id: 101 }]);

    await expect(readReviewFeedRows(env, { positionId: '101', userId: 'user-1' })).resolves.toEqual([{ feed_id: 7 }]);
    await expect(readReviewPageRows(env, { cursor: '2026-05-14', limit: 10 })).resolves.toEqual([{ feed_id: 8 }]);
    await expect(readSingleReviewFeedRow(env, 9)).resolves.toEqual({ feed_id: 9 });
    await expect(readReviewCommentRows(env, [7])).resolves.toEqual([{ comment_id: 1 }]);
    await expect(readReviewLikeRows(env, [7])).resolves.toEqual([{ feed_like_id: 2 }]);
    await expect(readReviewStampRows(env, [3, null])).resolves.toEqual([{ stamp_id: 3 }]);
    await expect(readUserFeedLikeRows(env, [7], 'user-1')).resolves.toEqual([{ feed_id: 7 }]);
    await expect(readReviewRouteRows(env, ['55'])).resolves.toEqual([{ route_id: 4 }]);
    await expect(readReviewUserRows(env, ['user-1'])).resolves.toEqual([{ user_id: 'user-1' }]);
    await expect(readReviewPlaceRows(env, 101)).resolves.toEqual([{ position_id: 101 }]);
    await expect(readReviewCommentRows(env, [])).resolves.toEqual([]);
    await expect(readReviewLikeRows(env, [])).resolves.toEqual([]);
    await expect(readReviewStampRows(env, [])).resolves.toEqual([]);
    await expect(readUserFeedLikeRows(env, [7], null)).resolves.toEqual([]);
    await expect(readReviewRouteRows(env, [])).resolves.toEqual([]);
    await expect(readReviewUserRows(env, [])).resolves.toEqual([]);

    expect(supabaseMock.supabaseRequest.mock.calls.map(([, query]) => String(query))).toEqual(
      expect.arrayContaining([
        expect.stringContaining('feed?select=feed_id'),
        expect.stringContaining('position_id=eq.101'),
        expect.stringContaining('created_at=lt.2026-05-14'),
        expect.stringContaining('user_comment?select=comment_id'),
        expect.stringContaining('feed_like?select=feed_id'),
        expect.stringContaining('user_stamp?select=stamp_id'),
        expect.stringContaining('user_route?select=route_id'),
        expect.stringContaining('user?select=user_id,nickname'),
        expect.stringContaining('map?select=position_id'),
      ]),
    );
  });

  it('keeps review mutation persistence behind repository helpers', async () => {
    supabaseMock.supabaseRequest
      .mockResolvedValueOnce([{ feed_id: 7 }])
      .mockResolvedValueOnce([{ comment_id: 1 }])
      .mockResolvedValueOnce([{ stamp_id: 2 }])
      .mockResolvedValueOnce([{ feed_id: 8 }])
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce([{ comment_id: 3 }])
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce([{ feed_like_id: 4 }])
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce([{ feed_like_id: 1 }, { feed_like_id: 2 }]);

    await expect(readFeedRow(env, 7)).resolves.toEqual({ feed_id: 7 });
    await expect(readCommentRow(env, 1)).resolves.toEqual({ comment_id: 1 });
    await expect(readStampRow(env, 2)).resolves.toEqual({ stamp_id: 2 });
    await expect(createReviewRow(env, { body: 'body' })).resolves.toEqual({ feed_id: 8 });
    await updateReviewRow(env, 7, { body: 'updated' });
    await deleteReviewRow(env, 7);
    await expect(createCommentRow(env, { body: 'comment' })).resolves.toEqual({ comment_id: 3 });
    await updateCommentRow(env, 3, { body: 'updated' });
    await softDeleteCommentRow(env, 3);
    await expect(readReviewLikeRow(env, 7, 'user-1')).resolves.toEqual({ feed_like_id: 4 });
    await createReviewLikeRow(env, 7, 'user-1');
    await deleteReviewLikeRow(env, 4);
    await expect(countReviewLikes(env, 7)).resolves.toBe(2);

    expect(supabaseMock.supabaseRequest.mock.calls.map(([, query, options]) => ({ query, method: options?.method }))).toEqual(
      expect.arrayContaining([
        { query: 'feed?select=feed_id', method: 'POST' },
        { query: 'user_comment?select=comment_id', method: 'POST' },
        { query: 'feed_like?select=feed_like_id', method: 'POST' },
        { query: expect.stringContaining('feed?feed_id=eq.7'), method: 'PATCH' },
        { query: expect.stringContaining('feed?feed_id=eq.7'), method: 'DELETE' },
        { query: expect.stringContaining('feed_like?feed_like_id=eq.4'), method: 'DELETE' },
      ]),
    );
  });

  it('normalizes empty review repository responses to null results', async () => {
    supabaseMock.supabaseRequest
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    await expect(readFeedRow(env, 'missing')).resolves.toBeNull();
    await expect(readCommentRow(env, 'missing')).resolves.toBeNull();
    await expect(readStampRow(env, 'missing')).resolves.toBeNull();
    await expect(createReviewRow(env, {})).resolves.toBeNull();
    await expect(createCommentRow(env, {})).resolves.toBeNull();
    await expect(readReviewLikeRow(env, 'review-1', 'user-1')).resolves.toBeNull();
    await expect(countReviewLikes(env, 'review-1')).resolves.toBe(0);
  });
});

describe('worker community, my-page, and notification repositories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('builds community route repository queries for list, detail, create, and like flows', async () => {
    const routeRows = [{ route_id: 7, user_id: 'user-1' }];
    supabaseMock.supabaseRequest
      .mockResolvedValueOnce([{ route_id: 7 }])
      .mockResolvedValueOnce(routeRows)
      .mockResolvedValueOnce(routeRows)
      .mockResolvedValueOnce([{ route_id: 7, position_id: 101, stop_order: 1 }])
      .mockResolvedValueOnce([{ route_id: 7 }])
      .mockResolvedValueOnce([{ user_id: 'user-1', nickname: 'Author' }])
      .mockResolvedValueOnce([{ travel_session_id: 55 }])
      .mockResolvedValueOnce([{ route_id: 7 }])
      .mockResolvedValueOnce([{ position_id: 101 }])
      .mockResolvedValueOnce([{ route_id: 8 }])
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce([{ route_like_id: 9 }])
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce([{ route_like_id: 1 }, { route_like_id: 2 }])
      .mockResolvedValueOnce(undefined);

    await expect(readRouteRow(env, '7')).resolves.toEqual({ route_id: 7 });
    await expect(loadRouteRows(env, { sort: 'popular' })).resolves.toEqual(routeRows);
    await expect(loadRouteRows(env, { ownerUserId: 'user-1' })).resolves.toEqual(routeRows);
    await expect(loadRouteDetailRows(env, routeRows, 'user-1')).resolves.toMatchObject({
      routePlaceRows: [{ route_id: 7, position_id: 101, stop_order: 1 }],
      userRouteLikeRows: [{ route_id: 7 }],
      userRows: [{ user_id: 'user-1', nickname: 'Author' }],
    });
    await expect(loadRouteDetailRows(env, [], null)).resolves.toEqual({ routePlaceRows: [], userRouteLikeRows: [], userRows: [] });
    await expect(readTravelSessionForOwner(env, '55', 'user-1')).resolves.toEqual({ travel_session_id: 55 });
    await expect(readExistingRouteForSession(env, '55', 'user-1')).resolves.toEqual({ route_id: 7 });
    await expect(loadSessionStampRows(env, '55', 'user-1')).resolves.toEqual([{ position_id: 101 }]);
    await expect(createUserRoute(env, { title: 'Route' })).resolves.toBe(8);
    await createUserRoutePlaces(env, 8, ['101', '102']);
    await expect(readRouteLikeRow(env, '8', 'user-1')).resolves.toEqual({ route_like_id: 9 });
    await createRouteLike(env, '8', 'user-1');
    await deleteRouteLike(env, 9);
    await expect(countRouteLikes(env, '8')).resolves.toBe(2);
    await updateRouteLikeCount(env, '8', 2);

    expect(supabaseMock.supabaseRequest.mock.calls.map(([, query]) => String(query))).toEqual(
      expect.arrayContaining([
        expect.stringContaining('user_route?select=route_id,user_id,like_count'),
        expect.stringContaining('is_public=eq.true'),
        expect.stringContaining('user_id=eq.user-1&order=created_at.desc'),
        expect.stringContaining('user_route_place?select=route_id,position_id,stop_order'),
        'user_route?select=route_id',
        'user_route_place?select=user_route_place_id',
      ]),
    );
  });

  it('normalizes empty community route repository responses to null and empty detail rows', async () => {
    supabaseMock.supabaseRequest
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    await expect(readRouteRow(env, 'missing')).resolves.toBeNull();
    await expect(loadRouteRows(env, { sort: 'latest' })).resolves.toEqual([]);
    await expect(loadRouteDetailRows(env, [{ route_id: '', user_id: '', title: 'Empty', created_at: '2026-05-14T00:00:00Z' }], null)).resolves.toEqual({
      routePlaceRows: [],
      userRouteLikeRows: [],
      userRows: [],
    });
    await expect(readTravelSessionForOwner(env, 'missing', 'user-1')).resolves.toBeNull();
    await expect(readExistingRouteForSession(env, 'missing', 'user-1')).resolves.toBeNull();
    await expect(loadSessionStampRows(env, 'missing', 'user-1')).resolves.toEqual([]);
    await expect(createUserRoute(env, {})).resolves.toBeNull();
    await expect(readRouteLikeRow(env, 'route-1', 'user-1')).resolves.toBeNull();
  });

  it('loads my-page comment rows and notification rows through domain repositories', async () => {
    supabaseMock.supabaseRequest
      .mockResolvedValueOnce([{ comment_id: 1, feed_id: 7 }])
      .mockResolvedValueOnce([{ feed_id: 7 }])
      .mockResolvedValueOnce([{ comment_id: 2 }])
      .mockResolvedValueOnce([{ notification_id: 3 }])
      .mockResolvedValueOnce([{ notification_id: 4 }])
      .mockResolvedValueOnce([{ notification_id: 5 }])
      .mockResolvedValueOnce([{ user_id: 'actor-1', nickname: 'Actor' }])
      .mockResolvedValueOnce([{ user_id: 'actor-2', nickname: 'Actor 2' }])
      .mockResolvedValueOnce([{ notification_id: 6 }])
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined);

    const commentRows = await loadMyCommentRows(env, 'user-1', '2026-05-14', 10);
    await expect(loadFeedsForCommentRows(env, commentRows)).resolves.toEqual([{ feed_id: 7 }]);
    await expect(loadFeedsForCommentRows(env, [])).resolves.toEqual([]);
    await expect(loadMySummaryCommentRows(env, 'user-1')).resolves.toEqual([{ comment_id: 2 }]);
    await expect(readNotificationRow(env, 3)).resolves.toEqual({ notification_id: 3 });
    await expect(createNotification(env, {
      actorUserId: 'actor-1',
      body: 'body',
      commentId: '4',
      metadata: { source: 'test' },
      reviewId: '7',
      routeId: '8',
      title: 'title',
      type: 'comment-created',
      userId: 'user-1',
    })).resolves.toEqual({ notification_id: 4 });
    await expect(readUserNotificationRows(env, 'user-1', 20)).resolves.toEqual([{ notification_id: 5 }]);
    await expect(readNotificationActorRows(env, ['actor-1', null])).resolves.toEqual([{ user_id: 'actor-1', nickname: 'Actor' }]);
    await expect(readNotificationActorRows(env, [])).resolves.toEqual([]);
    await expect(readNotificationActorRow(env, 'actor-2')).resolves.toEqual({ user_id: 'actor-2', nickname: 'Actor 2' });
    await expect(readUnreadNotificationRows(env, 'user-1')).resolves.toEqual([{ notification_id: 6 }]);
    await markNotificationRead(env, 3, '2026-05-14T00:00:00Z');
    await markAllNotificationsRead(env, 'user-1', '2026-05-14T00:00:00Z');
    await deleteNotificationRow(env, 3);

    expect(supabaseMock.supabaseRequest.mock.calls.map(([, query, options]) => ({ query, method: options?.method }))).toEqual(
      expect.arrayContaining([
        { query: expect.stringContaining('user_comment?select=comment_id'), method: undefined },
        { query: expect.stringContaining('feed?select=feed_id,position_id,body'), method: undefined },
        { query: 'user_notification?select=notification_id', method: 'POST' },
        { query: expect.stringContaining('user_notification?notification_id=eq.3'), method: 'PATCH' },
        { query: expect.stringContaining('user_notification?notification_id=eq.3'), method: 'DELETE' },
      ]),
    );
  });

  it('normalizes empty notification repository responses without leaking nulls', async () => {
    supabaseMock.supabaseRequest
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined);

    await expect(readNotificationRow(env, 'missing')).resolves.toBeNull();
    await expect(readUserNotificationRows(env, 'user-1', 5)).resolves.toEqual([]);
    await expect(readNotificationActorRow(env, 'actor-missing')).resolves.toBeNull();
    await expect(readUnreadNotificationRows(env, 'user-1')).resolves.toEqual([]);
    await expect(createNotification(env, {
      title: 'title',
      type: 'comment-created',
      userId: 'user-1',
    })).resolves.toBeNull();

    const createCall = supabaseMock.supabaseRequest.mock.calls.at(-1);
    expect(JSON.parse(String(createCall?.[2]?.body))).toMatchObject({
      actor_user_id: null,
      body: '',
      comment_id: null,
      is_read: false,
      metadata: {},
      review_id: null,
      route_id: null,
    });
  });
});
