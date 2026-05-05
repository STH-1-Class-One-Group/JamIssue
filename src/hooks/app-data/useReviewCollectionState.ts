import { useRef, useState } from 'react';
import { toReviewSummary } from '../../lib/reviews';
import type { BootstrapResponse } from '../../types';

type ReviewSummary = BootstrapResponse['reviews'][number];

export function useReviewCollectionState(selectedPlaceId: string | null) {
  const [reviews, setReviews] = useState<BootstrapResponse['reviews']>([]);
  const [selectedPlaceReviews, setSelectedPlaceReviews] = useState<BootstrapResponse['reviews']>([]);
  const placeReviewsCacheRef = useRef<Record<string, BootstrapResponse['reviews']>>({});
  const feedLoadedRef = useRef(false);
  const coursesLoadedRef = useRef(false);

  function patchReviewCollections(reviewId: string, updater: (review: ReviewSummary) => ReviewSummary) {
    const patchFn = (r: ReviewSummary) => (r.id === reviewId ? toReviewSummary(updater(r)) : r);

    setReviews((current) => current.map(patchFn));
    setSelectedPlaceReviews((current) => current.map(patchFn));

    const existingReview =
      reviews.find((r) => r.id === reviewId) || selectedPlaceReviews.find((r) => r.id === reviewId);

    if (existingReview) {
      const { placeId } = existingReview;
      const collection = placeReviewsCacheRef.current[placeId];
      if (collection) {
        placeReviewsCacheRef.current[placeId] = collection.map(patchFn);
        return;
      }
    }

    const cache = placeReviewsCacheRef.current;
    for (const placeId of Object.keys(cache)) {
      const collection = cache[placeId];
      if (collection.some((r) => r.id === reviewId)) {
        cache[placeId] = collection.map(patchFn);
        break;
      }
    }
  }

  function upsertReviewCollections(review: ReviewSummary) {
    const nextReview = toReviewSummary(review);
    setReviews((current) => [nextReview, ...current.filter((currentReview) => currentReview.id !== review.id)]);
    if (selectedPlaceId === review.placeId) {
      setSelectedPlaceReviews((current) => [
        nextReview,
        ...current.filter((currentReview) => currentReview.id !== review.id),
      ]);
    }
    const cachedPlaceReviews = placeReviewsCacheRef.current[review.placeId] ?? [];
    placeReviewsCacheRef.current[review.placeId] = [
      nextReview,
      ...cachedPlaceReviews.filter((currentReview) => currentReview.id !== review.id),
    ];
  }

  function resetReviewCaches() {
    placeReviewsCacheRef.current = {};
    feedLoadedRef.current = false;
    coursesLoadedRef.current = false;
    setSelectedPlaceReviews([]);
  }

  return {
    reviews,
    setReviews,
    selectedPlaceReviews,
    setSelectedPlaceReviews,
    placeReviewsCacheRef,
    feedLoadedRef,
    coursesLoadedRef,
    patchReviewCollections,
    upsertReviewCollections,
    resetReviewCaches,
  };
}
