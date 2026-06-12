/*
 * File: reviewCrudCollectionUpdates.ts
 * Purpose: Keep review CRUD collection mutations testable outside action hooks.
 * Primary Responsibility: Apply review update/delete effects to my-page and place-review caches.
 * Design Intent: Let hooks orchestrate API calls while pure helpers preserve collection behavior.
 * Non-Goals: This file does not call APIs, show notices, or own React state.
 */

import type { MyPageResponse } from '../types/my-page';
import type { Review } from '../types/review';

export function applyReviewUpdateToMyPage(
  current: MyPageResponse | null,
  reviewId: string,
  summarizedReview: Review,
  updatedReviewBody: string,
) {
  if (!current) {
    return current;
  }

  return {
    ...current,
    reviews: current.reviews.map((review) => (review.id === reviewId ? summarizedReview : review)),
    comments: current.comments.map((comment) => (
      comment.reviewId === reviewId
        ? { ...comment, reviewBody: updatedReviewBody }
        : comment
    )),
  };
}

export function removeReviewFromMyPage(current: MyPageResponse | null, reviewId: string) {
  if (!current) {
    return current;
  }

  return {
    ...current,
    reviews: current.reviews.filter((review) => review.id !== reviewId),
    comments: current.comments.filter((comment) => comment.reviewId !== reviewId),
    stats: {
      ...current.stats,
      reviewCount: Math.max(0, current.stats.reviewCount - 1),
    },
  };
}

export function removeReviewFromPlaceReviewCache(placeReviewsCache: Record<string, Review[]>, reviewId: string) {
  for (const placeId of Object.keys(placeReviewsCache)) {
    placeReviewsCache[placeId] = placeReviewsCache[placeId].filter((review) => review.id !== reviewId);
  }
}
