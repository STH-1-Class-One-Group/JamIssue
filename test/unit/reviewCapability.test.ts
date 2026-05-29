import { describe, expect, test } from 'vitest';
import { getKnownMyReviews } from '../../src/hooks/app-view-models/reviewCapability';
import type { SessionUser } from '../../src/types/auth';
import type { Review } from '../../src/types/review';

const sessionUser = {
  id: 'user-1',
  nickname: 'tester',
  email: null,
  provider: 'kakao',
  linkedProviders: ['kakao'],
  profileImage: null,
  isAdmin: false,
  profileCompletedAt: null,
} satisfies SessionUser;

function createReview(overrides: Pick<Review, 'id' | 'userId'> & Partial<Review>): Review {
  return {
    id: overrides.id,
    userId: overrides.userId,
    placeId: 'place-1',
    placeName: 'place',
    author: 'author',
    body: 'body',
    mood: '혼자서',
    badge: 'badge',
    visitedAt: '2026-05-12T00:00:00Z',
    imageUrl: null,
    thumbnailUrl: null,
    commentCount: 0,
    likeCount: 0,
    likedByMe: false,
    stampId: null,
    visitNumber: 1,
    visitLabel: '1회차',
    travelSessionId: null,
    hasPublishedRoute: false,
    comments: [],
    ...overrides,
  };
}

describe('getKnownMyReviews', () => {
  test('filters to the session user and keeps later source precedence for duplicate review ids', () => {
    const knownMyReviews = getKnownMyReviews({
      reviews: [
        createReview({ id: 'shared-review', userId: sessionUser.id, body: 'from feed' }),
        createReview({ id: 'feed-only', userId: sessionUser.id, body: 'from feed only' }),
        createReview({ id: 'other-user-review', userId: 'user-2', body: 'other user' }),
      ],
      selectedPlaceReviews: [
        createReview({ id: 'selected-only', userId: sessionUser.id, body: 'from selected place' }),
      ],
      myPageReviews: [
        createReview({ id: 'shared-review', userId: sessionUser.id, body: 'from my page' }),
      ],
      sessionUser,
    });

    expect(knownMyReviews.map((review) => review.id)).toEqual([
      'shared-review',
      'feed-only',
      'selected-only',
    ]);
    expect(knownMyReviews.find((review) => review.id === 'shared-review')?.body).toBe('from my page');
  });

  test('returns no known reviews without an authenticated session', () => {
    expect(getKnownMyReviews({
      reviews: [createReview({ id: 'review-1', userId: sessionUser.id })],
      selectedPlaceReviews: [],
      myPageReviews: undefined,
      sessionUser: null,
    })).toEqual([]);
  });
});
