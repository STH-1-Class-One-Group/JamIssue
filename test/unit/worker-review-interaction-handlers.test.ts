import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  handleCreateComment,
  handleDeleteComment,
  handleUpdateComment,
} from '../../deploy/api-worker-shell/services/review-comment-handlers';
import { handleToggleReviewLike } from '../../deploy/api-worker-shell/services/review-like-handler';
import {
  handleCreateReview,
  handleDeleteReview,
  handleUpdateReview,
} from '../../deploy/api-worker-shell/services/review-write-handlers';
import type { WorkerReviewInteractionDeps } from '../../deploy/api-worker-shell/services/review-domain';
import type { WorkerEnv } from '../../deploy/api-worker-shell/types';

const reviewDomainMocks = vi.hoisted(() => ({
  countReviewLikes: vi.fn(),
  createCommentRow: vi.fn(),
  createReviewLikeRow: vi.fn(),
  createReviewRow: vi.fn(),
  deleteReviewLikeRow: vi.fn(),
  deleteReviewRow: vi.fn(),
  publishReviewNotification: vi.fn(),
  readCommentRow: vi.fn(),
  readFeedRow: vi.fn(),
  readReviewLikeRow: vi.fn(),
  readStampRow: vi.fn(),
  softDeleteCommentRow: vi.fn(),
  updateCommentRow: vi.fn(),
  updateReviewRow: vi.fn(),
}));

vi.mock('../../deploy/api-worker-shell/services/review-domain', () => ({
  countReviewLikes: reviewDomainMocks.countReviewLikes,
  createCommentRow: reviewDomainMocks.createCommentRow,
  createReviewLikeRow: reviewDomainMocks.createReviewLikeRow,
  createReviewRow: reviewDomainMocks.createReviewRow,
  deleteReviewLikeRow: reviewDomainMocks.deleteReviewLikeRow,
  deleteReviewRow: reviewDomainMocks.deleteReviewRow,
  publishReviewNotification: reviewDomainMocks.publishReviewNotification,
  readCommentRow: reviewDomainMocks.readCommentRow,
  readFeedRow: reviewDomainMocks.readFeedRow,
  readReviewLikeRow: reviewDomainMocks.readReviewLikeRow,
  readStampRow: reviewDomainMocks.readStampRow,
  softDeleteCommentRow: reviewDomainMocks.softDeleteCommentRow,
  updateCommentRow: reviewDomainMocks.updateCommentRow,
  updateReviewRow: reviewDomainMocks.updateReviewRow,
}));

const env = {
  APP_CORS_ORIGINS: '',
  APP_FRONTEND_URL: 'https://daejeon.jamissue.com',
} as WorkerEnv;

const sessionUser = { id: 'user-1' };

function createDeps(overrides: Partial<WorkerReviewInteractionDeps> = {}): WorkerReviewInteractionDeps {
  return {
    badgeByMood: { mood: 'Mood Badge' },
    countUnreadNotifications: vi.fn(async () => 0),
    createUserNotification: vi.fn(async () => ({ notification_id: 'notification-1' })),
    loadBaseData: vi.fn(async () => ({
      places: [{ id: 'place-1', positionId: '101', name: 'Place 1' }],
    })),
    loadNotificationById: vi.fn(async () => ({ id: 'notification-1' })),
    loadSingleReview: vi.fn(async () => ({
      id: 'review-1',
      comments: [{ id: 'comment-1', body: 'comment' }],
    })),
    publishNotificationEvent: vi.fn(async () => undefined),
    readSessionUser: vi.fn(async () => sessionUser),
    ...overrides,
  } as WorkerReviewInteractionDeps;
}

function jsonRequest(payload: unknown) {
  return new Request('https://api.test/api/reviews', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

async function readJson(response: Response) {
  return response.json() as Promise<unknown>;
}

describe('worker review write handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    reviewDomainMocks.readStampRow.mockResolvedValue({ stamp_id: 7, user_id: 'user-1', position_id: 101 });
    reviewDomainMocks.createReviewRow.mockResolvedValue({ feed_id: 'review-1' });
    reviewDomainMocks.readFeedRow.mockResolvedValue({ feed_id: 'review-1', user_id: 'user-1' });
  });

  it('guards review creation behind session and validates place, stamp, body, place lookup, and stamp ownership', async () => {
    const unauthorized = await handleCreateReview(jsonRequest({}), env, createDeps({ readSessionUser: vi.fn(async () => null) }));
    expect(unauthorized.status).toBe(401);

    const deps = createDeps();
    expect((await handleCreateReview(jsonRequest({ stampId: 7, body: 'body' }), env, deps)).status).toBe(400);
    expect((await handleCreateReview(jsonRequest({ placeId: 'place-1', body: 'body' }), env, deps)).status).toBe(400);
    expect((await handleCreateReview(jsonRequest({ placeId: 'place-1', stampId: 7, body: '' }), env, deps)).status).toBe(400);

    const missingPlaceDeps = createDeps({ loadBaseData: vi.fn(async () => ({ places: [] })) });
    expect((await handleCreateReview(jsonRequest({ placeId: 'place-1', stampId: 7, body: 'body' }), env, missingPlaceDeps)).status).toBe(404);

    reviewDomainMocks.readStampRow.mockResolvedValueOnce(null);
    expect((await handleCreateReview(jsonRequest({ placeId: 'place-1', stampId: 7, body: 'body' }), env, deps)).status).toBe(404);

    reviewDomainMocks.readStampRow.mockResolvedValueOnce({ stamp_id: 7, user_id: 'other-user', position_id: 101 });
    expect((await handleCreateReview(jsonRequest({ placeId: 'place-1', stampId: 7, body: 'body' }), env, deps)).status).toBe(403);
  });

  it('creates reviews with the verified stamp and publishes the review notification', async () => {
    const deps = createDeps();

    const response = await handleCreateReview(jsonRequest({
      placeId: 'place-1',
      stampId: 7,
      body: ' body ',
      mood: 'mood',
      imageUrl: 'https://image.test/review.png',
    }), env, deps);
    const payload = await readJson(response);

    expect(response.status).toBe(201);
    expect(payload).toEqual({ id: 'review-1', comments: [{ id: 'comment-1', body: 'comment' }] });
    expect(reviewDomainMocks.createReviewRow).toHaveBeenCalledWith(env, {
      position_id: 101,
      user_id: 'user-1',
      stamp_id: 7,
      body: 'body',
      mood: 'mood',
      badge: 'Mood Badge',
      image_url: 'https://image.test/review.png',
    });
    expect(reviewDomainMocks.publishReviewNotification).toHaveBeenCalledWith(env, deps, expect.objectContaining({
      userId: 'user-1',
      actorUserId: 'user-1',
      type: 'review-created',
      reviewId: 'review-1',
      metadata: { placeId: 'place-1' },
    }));
  });

  it('keeps review creation defaults and null reload behavior stable', async () => {
    reviewDomainMocks.createReviewRow.mockResolvedValueOnce({});
    const deps = createDeps({ loadSingleReview: vi.fn(async () => null) });

    const response = await handleCreateReview(jsonRequest({
      placeId: 'place-1',
      stampId: 7,
      body: 'body',
      imageUrl: '',
    }), env, deps);

    expect(response.status).toBe(201);
    await expect(readJson(response)).resolves.toBeNull();
    expect(reviewDomainMocks.createReviewRow).toHaveBeenCalledWith(env, expect.objectContaining({
      mood: '설렘',
      badge: '현장 방문',
      image_url: null,
    }));
    expect(deps.loadSingleReview).not.toHaveBeenCalled();
  });

  it('rejects review creation when the verified stamp belongs to another place', async () => {
    reviewDomainMocks.readStampRow.mockResolvedValueOnce({ stamp_id: 7, user_id: 'user-1', position_id: 999 });

    const response = await handleCreateReview(jsonRequest({
      placeId: 'place-1',
      stampId: 7,
      body: 'body',
    }), env, createDeps());

    expect(response.status).toBe(403);
  });

  it('updates and deletes owned reviews while rejecting missing, unowned, and invalid payloads', async () => {
    const deps = createDeps();
    expect((await handleUpdateReview(jsonRequest({ body: 'body', mood: 'mood' }), env, 'review-1', deps)).status).toBe(200);
    expect(reviewDomainMocks.updateReviewRow).toHaveBeenCalledWith(env, 'review-1', expect.objectContaining({
      body: 'body',
      mood: 'mood',
      badge: 'Mood Badge',
      updated_at: expect.any(String),
    }));

    expect((await handleDeleteReview(new Request('https://api.test/api/reviews/review-1'), env, 'review-1', deps)).status).toBe(200);
    expect(reviewDomainMocks.deleteReviewRow).toHaveBeenCalledWith(env, 'review-1');

    reviewDomainMocks.readFeedRow.mockResolvedValueOnce(null);
    expect((await handleUpdateReview(jsonRequest({ body: 'body', mood: 'mood' }), env, 'missing', deps)).status).toBe(404);
    reviewDomainMocks.readFeedRow.mockResolvedValueOnce({ feed_id: 'review-1', user_id: 'other-user' });
    expect((await handleUpdateReview(jsonRequest({ body: 'body', mood: 'mood' }), env, 'review-1', deps)).status).toBe(403);
    expect((await handleUpdateReview(jsonRequest({ body: '', mood: 'mood' }), env, 'review-1', deps)).status).toBe(400);
    expect((await handleUpdateReview(jsonRequest({ body: 'body', mood: '' }), env, 'review-1', deps)).status).toBe(400);

    reviewDomainMocks.readFeedRow.mockResolvedValueOnce(null);
    expect((await handleDeleteReview(new Request('https://api.test/api/reviews/missing'), env, 'missing', deps)).status).toBe(404);
    reviewDomainMocks.readFeedRow.mockResolvedValueOnce({ feed_id: 'review-1', user_id: 'other-user' });
    expect((await handleDeleteReview(new Request('https://api.test/api/reviews/review-1'), env, 'review-1', deps)).status).toBe(403);
  });

  it('updates reviews with explicit image removal and fallback badges', async () => {
    const deps = createDeps();

    const response = await handleUpdateReview(jsonRequest({ body: 'body', mood: 'new-mood', imageUrl: '' }), env, 'review-1', deps);

    expect(response.status).toBe(200);
    expect(reviewDomainMocks.updateReviewRow).toHaveBeenCalledWith(env, 'review-1', expect.objectContaining({
      image_url: null,
      badge: '현장 방문',
    }));
  });
});

describe('worker review comment handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    reviewDomainMocks.readFeedRow.mockResolvedValue({ feed_id: 1, user_id: 'review-owner' });
    reviewDomainMocks.readCommentRow.mockResolvedValue({ comment_id: 1, feed_id: 1, user_id: 'parent-owner', parent_id: null, is_deleted: false });
    reviewDomainMocks.createCommentRow.mockResolvedValue({ comment_id: 'comment-1' });
  });

  it('creates comments, normalizes nested replies to the root parent, and publishes owner notifications', async () => {
    reviewDomainMocks.readCommentRow.mockResolvedValueOnce({ comment_id: 2, feed_id: 1, user_id: 'parent-owner', parent_id: 1, is_deleted: false });
    const deps = createDeps();

    const response = await handleCreateComment(jsonRequest({ body: ' comment ', parentId: '2' }), env, '1', deps);

    expect(response.status).toBe(200);
    expect(reviewDomainMocks.createCommentRow).toHaveBeenCalledWith(env, {
      feed_id: 1,
      user_id: 'user-1',
      parent_id: 1,
      body: 'comment',
      is_deleted: false,
    });
    expect(reviewDomainMocks.publishReviewNotification).toHaveBeenCalledWith(env, deps, expect.objectContaining({
      userId: 'parent-owner',
      type: 'comment-reply',
    }));
    expect(reviewDomainMocks.publishReviewNotification).toHaveBeenCalledWith(env, deps, expect.objectContaining({
      userId: 'review-owner',
      type: 'review-comment',
    }));
  });

  it('validates comment creation target, body, and parent ownership', async () => {
    const deps = createDeps();
    const unauthorized = await handleCreateComment(jsonRequest({ body: 'comment' }), env, '1', createDeps({ readSessionUser: vi.fn(async () => null) }));
    expect(unauthorized.status).toBe(401);

    reviewDomainMocks.readFeedRow.mockResolvedValueOnce(null);
    expect((await handleCreateComment(jsonRequest({ body: 'comment' }), env, 'missing', deps)).status).toBe(404);
    expect((await handleCreateComment(jsonRequest({ body: '' }), env, '1', deps)).status).toBe(400);
    reviewDomainMocks.readCommentRow.mockResolvedValueOnce({ comment_id: 2, feed_id: 2, user_id: 'parent-owner' });
    expect((await handleCreateComment(jsonRequest({ body: 'comment', parentId: '2' }), env, '1', deps)).status).toBe(400);
  });

  it('updates and deletes owned comments while rejecting missing, unowned, deleted, and empty edits', async () => {
    reviewDomainMocks.readCommentRow.mockResolvedValue({ comment_id: 1, feed_id: 1, user_id: 'user-1', is_deleted: false });
    const deps = createDeps();

    expect((await handleUpdateComment(jsonRequest({ body: 'updated' }), env, '1', 'comment-1', deps)).status).toBe(200);
    expect(reviewDomainMocks.updateCommentRow).toHaveBeenCalledWith(env, 'comment-1', expect.objectContaining({ body: 'updated' }));
    expect((await handleDeleteComment(new Request('https://api.test/api/reviews/1/comments/comment-1'), env, '1', 'comment-1', deps)).status).toBe(200);
    expect(reviewDomainMocks.softDeleteCommentRow).toHaveBeenCalledWith(env, 'comment-1');

    reviewDomainMocks.readCommentRow.mockResolvedValueOnce(null);
    expect((await handleUpdateComment(jsonRequest({ body: 'updated' }), env, '1', 'missing', deps)).status).toBe(404);
    reviewDomainMocks.readCommentRow.mockResolvedValueOnce({ comment_id: 1, feed_id: 1, user_id: 'other-user', is_deleted: false });
    expect((await handleUpdateComment(jsonRequest({ body: 'updated' }), env, '1', 'comment-1', deps)).status).toBe(403);
    reviewDomainMocks.readCommentRow.mockResolvedValueOnce({ comment_id: 1, feed_id: 1, user_id: 'user-1', is_deleted: true });
    expect((await handleUpdateComment(jsonRequest({ body: 'updated' }), env, '1', 'comment-1', deps)).status).toBe(400);
    expect((await handleUpdateComment(jsonRequest({ body: '' }), env, '1', 'comment-1', deps)).status).toBe(400);

    reviewDomainMocks.readFeedRow.mockResolvedValueOnce(null);
    expect((await handleDeleteComment(new Request('https://api.test/api/reviews/1/comments/comment-1'), env, '1', 'comment-1', deps)).status).toBe(404);
    reviewDomainMocks.readCommentRow.mockResolvedValueOnce({ comment_id: 1, feed_id: 2, user_id: 'user-1', is_deleted: false });
    expect((await handleDeleteComment(new Request('https://api.test/api/reviews/1/comments/comment-1'), env, '1', 'comment-1', deps)).status).toBe(404);
    reviewDomainMocks.readCommentRow.mockResolvedValueOnce({ comment_id: 1, feed_id: 1, user_id: 'other-user', is_deleted: false });
    expect((await handleDeleteComment(new Request('https://api.test/api/reviews/1/comments/comment-1'), env, '1', 'comment-1', deps)).status).toBe(403);
  });
});

describe('worker review like handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    reviewDomainMocks.readFeedRow.mockResolvedValue({ feed_id: 'review-1', user_id: 'review-owner' });
    reviewDomainMocks.readReviewLikeRow.mockResolvedValue(null);
    reviewDomainMocks.countReviewLikes.mockResolvedValue(3);
  });

  it('creates or deletes like rows and reports the latest count', async () => {
    const deps = createDeps();
    const liked = await handleToggleReviewLike(new Request('https://api.test/api/reviews/review-1/like'), env, 'review-1', deps);
    await expect(readJson(liked)).resolves.toEqual({ reviewId: 'review-1', likeCount: 3, likedByMe: true });
    expect(reviewDomainMocks.createReviewLikeRow).toHaveBeenCalledWith(env, 'review-1', 'user-1');

    reviewDomainMocks.readReviewLikeRow.mockResolvedValueOnce({ feed_like_id: 'like-1' });
    const unliked = await handleToggleReviewLike(new Request('https://api.test/api/reviews/review-1/like'), env, 'review-1', deps);
    await expect(readJson(unliked)).resolves.toEqual({ reviewId: 'review-1', likeCount: 3, likedByMe: false });
    expect(reviewDomainMocks.deleteReviewLikeRow).toHaveBeenCalledWith(env, 'like-1');
  });

  it('rejects like toggles for missing reviews', async () => {
    reviewDomainMocks.readFeedRow.mockResolvedValueOnce(null);
    const response = await handleToggleReviewLike(new Request('https://api.test/api/reviews/missing/like'), env, 'missing', createDeps());

    expect(response.status).toBe(404);
  });
});
