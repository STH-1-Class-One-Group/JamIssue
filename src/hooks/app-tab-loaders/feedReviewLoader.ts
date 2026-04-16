import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import { getReviewFeedPage } from '../../api/reviewsClient';
import { toReviewSummaryList } from '../../lib/reviews';
import type { Review } from '../../types';

interface CreateFeedReviewLoaderParams {
  feedLoadedRef: MutableRefObject<boolean>;
  setReviews: Dispatch<SetStateAction<Review[]>>;
  setFeedNextCursor: (cursor: string | null) => void;
  setFeedHasMore: (value: boolean) => void;
}

export function createFeedReviewLoader({
  feedLoadedRef,
  setReviews,
  setFeedNextCursor,
  setFeedHasMore,
}: CreateFeedReviewLoaderParams) {
  return async function ensureFeedReviews(force = false) {
    if (!force && feedLoadedRef.current) {
      return;
    }

    const page = await getReviewFeedPage({ limit: 10 });
    setReviews(toReviewSummaryList(page.items));
    setFeedNextCursor(page.nextCursor);
    setFeedHasMore(Boolean(page.nextCursor));
    feedLoadedRef.current = true;
  };
}
