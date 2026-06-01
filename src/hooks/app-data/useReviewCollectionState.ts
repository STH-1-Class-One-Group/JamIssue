import { useRef, useState } from "react";
import { toReviewSummary } from "../../lib/reviews";
import type { BootstrapResponse } from "../../types/review";

type ReviewSummary = BootstrapResponse["reviews"][number];

export function useReviewCollectionState(selectedPlaceId: string | null) {
  const [reviews, setReviews] = useState<BootstrapResponse["reviews"]>([]);
  const [selectedPlaceReviews, setSelectedPlaceReviews] = useState<
    BootstrapResponse["reviews"]
  >([]);
  const placeReviewsCacheRef = useRef<
    Record<string, BootstrapResponse["reviews"]>
  >({});
  const feedLoadedRef = useRef(false);
  const coursesLoadedRef = useRef(false);

  function patchReviewCollections(
    reviewId: string,
    updater: (review: ReviewSummary) => ReviewSummary,
  ) {
    const hasReview = (r: ReviewSummary) => r.id === reviewId;
    let patchedReview: ReviewSummary | null = null;
    const getPatched = (original: ReviewSummary) => {
      if (!patchedReview) {
        patchedReview = toReviewSummary(updater(original));
      }
      return patchedReview;
    };

    setReviews((current) => {
      const idx = current.findIndex(hasReview);
      if (idx === -1) return current;
      const next = [...current];
      next[idx] = getPatched(current[idx]);
      return next;
    });

    setSelectedPlaceReviews((current) => {
      const idx = current.findIndex(hasReview);
      if (idx === -1) return current;
      const next = [...current];
      next[idx] = getPatched(current[idx]);
      return next;
    });

    const existingReview =
      reviews.find(hasReview) || selectedPlaceReviews.find(hasReview);
    if (existingReview) {
      const { placeId } = existingReview;
      const collection = placeReviewsCacheRef.current[placeId];
      if (collection) {
        const idx = collection.findIndex(hasReview);
        if (idx !== -1) {
          const next = [...collection];
          next[idx] = getPatched(collection[idx]);
          placeReviewsCacheRef.current[placeId] = next;
          return;
        }
      }
    }

    const cache = placeReviewsCacheRef.current;
    for (const placeId of Object.keys(cache)) {
      const collection = cache[placeId];
      const idx = collection.findIndex(hasReview);
      if (idx !== -1) {
        const next = [...collection];
        next[idx] = getPatched(collection[idx]);
        cache[placeId] = next;
        break;
      }
    }
  }

  function upsertReviewCollections(review: ReviewSummary) {
    const nextReview = toReviewSummary(review);
    // Optimization: Using for...of instead of spread+filter to avoid intermediate array allocation
    setReviews((current) => {
      const next = [nextReview];
      for (const currentReview of current) {
        if (currentReview.id !== review.id) {
          next.push(currentReview);
        }
      }
      return next;
    });
    if (selectedPlaceId === review.placeId) {
      // Optimization: Using for...of instead of spread+filter to avoid intermediate array allocation
      setSelectedPlaceReviews((current) => {
        const next = [nextReview];
        for (const currentReview of current) {
          if (currentReview.id !== review.id) {
            next.push(currentReview);
          }
        }
        return next;
      });
    }
    const cachedPlaceReviews =
      placeReviewsCacheRef.current[review.placeId] ?? [];
    const nextCached = [nextReview];
    for (const currentReview of cachedPlaceReviews) {
      if (currentReview.id !== review.id) {
        nextCached.push(currentReview);
      }
    }
    placeReviewsCacheRef.current[review.placeId] = nextCached;
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
