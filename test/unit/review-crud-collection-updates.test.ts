import { describe, expect, it } from 'vitest';
import {
  applyReviewUpdateToMyPage,
  removeReviewFromMyPage,
  removeReviewFromPlaceReviewCache,
} from '../../src/lib/reviewCrudCollectionUpdates';
import type { MyComment, MyPageResponse } from '../../src/types/my-page';
import type { Review } from '../../src/types/review';

function reviewFixture(overrides: Partial<Review> = {}): Review {
  return {
    id: 'review-1',
    userId: 'user-1',
    placeId: 'place-1',
    placeName: 'Place 1',
    author: 'author',
    body: 'body',
    mood: 'calm',
    badge: 'badge',
    visitedAt: '2026-05-14',
    imageUrl: null,
    thumbnailUrl: null,
    commentCount: 0,
    likeCount: 0,
    likedByMe: false,
    stampId: 'stamp-1',
    visitNumber: 1,
    visitLabel: '1',
    travelSessionId: null,
    hasPublishedRoute: false,
    comments: [],
    ...overrides,
  };
}

function commentFixture(overrides: Partial<MyComment> = {}): MyComment {
  return {
    id: 'comment-1',
    reviewId: 'review-1',
    placeId: 'place-1',
    placeName: 'Place 1',
    body: 'comment',
    isDeleted: false,
    parentId: null,
    createdAt: '2026-05-14',
    reviewBody: 'body',
    ...overrides,
  };
}

function myPageFixture(overrides: Partial<MyPageResponse> = {}): MyPageResponse {
  return {
    user: {
      id: 'user-1',
      nickname: 'tester',
      email: null,
      provider: 'kakao',
      profileImage: null,
      isAdmin: false,
      profileCompletedAt: null,
    },
    stats: {
      reviewCount: 2,
      stampCount: 0,
      uniquePlaceCount: 0,
      totalPlaceCount: 0,
      routeCount: 0,
    },
    reviews: [reviewFixture(), reviewFixture({ id: 'review-2' })],
    comments: [commentFixture(), commentFixture({ id: 'comment-2', reviewId: 'review-2' })],
    notifications: [],
    unreadNotificationCount: 0,
    stampLogs: [],
    travelSessions: [],
    visitedPlaces: [],
    unvisitedPlaces: [],
    collectedPlaces: [],
    routes: [],
    ...overrides,
  };
}

describe('review CRUD collection updates', () => {
  it('updates matching my-page reviews and comment snippets while preserving null pages', () => {
    const updatedReview = reviewFixture({ body: 'updated' });

    expect(applyReviewUpdateToMyPage(null, 'review-1', updatedReview, 'updated')).toBeNull();

    const updated = applyReviewUpdateToMyPage(myPageFixture(), 'review-1', updatedReview, 'updated');

    expect(updated?.reviews).toEqual([
      expect.objectContaining({ id: 'review-1', body: 'updated' }),
      expect.objectContaining({ id: 'review-2', body: 'body' }),
    ]);
    expect(updated?.comments).toEqual([
      expect.objectContaining({ id: 'comment-1', reviewBody: 'updated' }),
      expect.objectContaining({ id: 'comment-2', reviewBody: 'body' }),
    ]);
  });

  it('removes deleted reviews from my-page lists and clamps review count at zero', () => {
    expect(removeReviewFromMyPage(null, 'review-1')).toBeNull();

    const removed = removeReviewFromMyPage(myPageFixture({ stats: { ...myPageFixture().stats, reviewCount: 1 } }), 'review-1');
    expect(removed?.reviews).toEqual([expect.objectContaining({ id: 'review-2' })]);
    expect(removed?.comments).toEqual([expect.objectContaining({ id: 'comment-2' })]);
    expect(removed?.stats.reviewCount).toBe(0);

    const alreadyZero = removeReviewFromMyPage(myPageFixture({ stats: { ...myPageFixture().stats, reviewCount: 0 } }), 'review-1');
    expect(alreadyZero?.stats.reviewCount).toBe(0);
  });

  it('removes a deleted review from every cached place review list', () => {
    const cache = {
      'place-1': [reviewFixture(), reviewFixture({ id: 'review-2' })],
      'place-2': [reviewFixture({ placeId: 'place-2' })],
      empty: [],
    };

    removeReviewFromPlaceReviewCache(cache, 'review-1');

    expect(cache).toEqual({
      'place-1': [expect.objectContaining({ id: 'review-2' })],
      'place-2': [],
      empty: [],
    });
  });
});
