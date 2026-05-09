import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  handleCreateComment,
  handleToggleReviewLike,
  handleUpdateReview,
} from '../../deploy/api-worker-shell/services/review-interactions';
import type { WorkerEnv, WorkerReviewInteractionDeps, WorkerSessionUser } from '../../deploy/api-worker-shell/types';

const supabaseMock = vi.hoisted(() => ({
  encodeFilterValue: (value: unknown) => encodeURIComponent(String(value)),
  getSupabaseKey: vi.fn(() => 'service-role-key'),
  supabaseRequest: vi.fn(),
}));

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

function createDeps(overrides: Partial<WorkerReviewInteractionDeps> = {}): WorkerReviewInteractionDeps {
  return {
    badgeByMood: { 설렘: '첫 방문' },
    countUnreadNotifications: vi.fn(async () => 1),
    createUserNotification: vi.fn(async () => ({ notification_id: 88 })),
    loadBaseData: vi.fn(async () => ({
      places: [],
      placesByPositionId: new Map(),
      reviews: [],
      courses: [],
      collectedPlaceIds: [],
      stampLogs: [],
      travelSessions: [],
    })),
    loadNotificationById: vi.fn(async () => ({ id: '88', title: 'notice' })),
    loadSingleReview: vi.fn(async () => ({ id: '1', comments: [{ id: '22' }] })),
    publishNotificationEvent: vi.fn(async () => undefined),
    readSessionUser: vi.fn(async () => sessionUser),
    ...overrides,
  };
}

async function readJson(response: Response) {
  return (await response.json()) as Record<string, any>;
}

describe('worker review domain service boundaries', () => {
  beforeEach(() => {
    supabaseMock.supabaseRequest.mockReset();
  });

  it('keeps review owner checks before update persistence', async () => {
    supabaseMock.supabaseRequest.mockResolvedValueOnce([{ feed_id: 1, position_id: 101, user_id: 'owner' }]);
    const deps = createDeps();

    const response = await handleUpdateReview(
      new Request('https://api.daejeon.jamissue.com/api/reviews/1', {
        method: 'PATCH',
        body: JSON.stringify({ body: 'updated', mood: '설렘' }),
      }),
      env,
      '1',
      deps,
    );

    expect(response.status).toBe(403);
    expect(await readJson(response)).toEqual({ detail: '내가 쓴 피드만 수정할 수 있어요.' });
    expect(deps.loadSingleReview).not.toHaveBeenCalled();
    expect(supabaseMock.supabaseRequest).toHaveBeenCalledTimes(1);
  });

  it('publishes review-owner notifications when a comment is created', async () => {
    supabaseMock.supabaseRequest.mockImplementation(async (_env, path: string) => {
      if (path.startsWith('feed?select=')) {
        return [{ feed_id: 1, position_id: 101, user_id: 'owner' }];
      }
      if (path === 'user_comment?select=comment_id') {
        return [{ comment_id: 22 }];
      }
      return [];
    });
    const deps = createDeps();

    const response = await handleCreateComment(
      new Request('https://api.daejeon.jamissue.com/api/reviews/1/comments', {
        method: 'POST',
        body: JSON.stringify({ body: '좋아요' }),
      }),
      env,
      '1',
      deps,
    );

    expect(response.status).toBe(200);
    expect(await readJson(response)).toEqual([{ id: '22' }]);
    expect(deps.createUserNotification).toHaveBeenCalledWith(
      env,
      expect.objectContaining({
        userId: 'owner',
        actorUserId: 'actor',
        type: 'review-comment',
        reviewId: '1',
        commentId: 22,
      }),
    );
    expect(deps.publishNotificationEvent).toHaveBeenCalledWith(
      env,
      'owner',
      'notification.created',
      expect.objectContaining({ unreadCount: 1 }),
    );
  });

  it('toggles review likes through the repository boundary', async () => {
    supabaseMock.supabaseRequest
      .mockResolvedValueOnce([{ feed_id: 1, position_id: 101, user_id: 'owner' }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ feed_like_id: 44 }])
      .mockResolvedValueOnce([{ feed_like_id: 44 }, { feed_like_id: 45 }]);

    const response = await handleToggleReviewLike(
      new Request('https://api.daejeon.jamissue.com/api/reviews/1/like', { method: 'POST' }),
      env,
      '1',
      createDeps(),
    );

    expect(response.status).toBe(200);
    expect(await readJson(response)).toEqual({ reviewId: '1', likeCount: 2, likedByMe: true });
  });
});
