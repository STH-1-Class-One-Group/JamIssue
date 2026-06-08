import { useCallback, type Dispatch, type SetStateAction } from 'react';
import { getMyCommentsPage } from '../api/myClient';
import { getReviewFeedPage } from '../api/reviewsClient';
import { PaginationRuntimeConfig } from '../config/runtimeLimitConfig';
import { toReviewSummaryList } from '../lib/reviews';
import { useAppPageRuntimeStore } from '../store/app-page-runtime-store';
import type { SessionUser } from '../types/auth';
import type { Review } from '../types/review';
import type { MyPageResponse } from '../types/my-page';

type SetState<T> = Dispatch<SetStateAction<T>>;

interface UseAppPagePaginationActionsParams {
  sessionUser: SessionUser | null;
  myPage: MyPageResponse | null;
  setReviews: SetState<Review[]>;
  setMyPage: SetState<MyPageResponse | null>;
  reportBackgroundError: (error: unknown) => void;
}

export function useAppPagePaginationActions({
  sessionUser,
  myPage,
  setReviews,
  setMyPage,
  reportBackgroundError,
}: UseAppPagePaginationActionsParams) {
  const feedNextCursor = useAppPageRuntimeStore((state) => state.feedNextCursor);
  const feedHasMore = useAppPageRuntimeStore((state) => state.feedHasMore);
  const feedLoadingMore = useAppPageRuntimeStore((state) => state.feedLoadingMore);
  const myCommentsNextCursor = useAppPageRuntimeStore((state) => state.myCommentsNextCursor);
  const myCommentsHasMore = useAppPageRuntimeStore((state) => state.myCommentsHasMore);
  const myCommentsLoadingMore = useAppPageRuntimeStore((state) => state.myCommentsLoadingMore);
  const setFeedNextCursor = useAppPageRuntimeStore((state) => state.setFeedNextCursor);
  const setFeedHasMore = useAppPageRuntimeStore((state) => state.setFeedHasMore);
  const setFeedLoadingMore = useAppPageRuntimeStore((state) => state.setFeedLoadingMore);
  const setMyCommentsNextCursor = useAppPageRuntimeStore((state) => state.setMyCommentsNextCursor);
  const setMyCommentsHasMore = useAppPageRuntimeStore((state) => state.setMyCommentsHasMore);
  const setMyCommentsLoadingMore = useAppPageRuntimeStore((state) => state.setMyCommentsLoadingMore);
  const setMyCommentsLoadedOnce = useAppPageRuntimeStore((state) => state.setMyCommentsLoadedOnce);

  const loadMoreFeedReviews = useCallback(async () => {
    if (feedLoadingMore || !feedHasMore) {
      return;
    }

    setFeedLoadingMore(true);
    try {
      const page = await getReviewFeedPage({ cursor: feedNextCursor, limit: PaginationRuntimeConfig.pageSize });
      setReviews((current) => {
        const existingIds = new Set<string>();
        for (const review of current) {
          existingIds.add(review.id);
        }

        const nextReviews = [...current];
        for (const review of toReviewSummaryList(page.items)) {
          if (!existingIds.has(review.id)) {
            nextReviews.push(review);
          }
        }
        return nextReviews;
      });
      setFeedNextCursor(page.nextCursor);
      setFeedHasMore(Boolean(page.nextCursor));
    } catch (error) {
      reportBackgroundError(error);
    } finally {
      setFeedLoadingMore(false);
    }
  }, [
    feedHasMore,
    feedLoadingMore,
    feedNextCursor,
    reportBackgroundError,
    setFeedHasMore,
    setFeedLoadingMore,
    setFeedNextCursor,
    setReviews,
  ]);

  const loadMoreMyComments = useCallback(async (initial = false) => {
    if (!sessionUser || !myPage) {
      return;
    }
    if (myCommentsLoadingMore || (!initial && !myCommentsHasMore)) {
      return;
    }

    setMyCommentsLoadingMore(true);
    setMyCommentsLoadedOnce(true);
    try {
      const page = await getMyCommentsPage({
        cursor: initial ? null : myCommentsNextCursor,
        limit: PaginationRuntimeConfig.pageSize,
      });
      setMyPage((current) => {
        if (!current) {
          return current;
        }
        const base = initial ? [] : current.comments;
        const existingIds = new Set<string>();
        for (const comment of base) {
          existingIds.add(comment.id);
        }

        const nextComments = [...base];
        for (const comment of page.items) {
          if (!existingIds.has(comment.id)) {
            nextComments.push(comment);
          }
        }

        return {
          ...current,
          comments: nextComments,
        };
      });
      setMyCommentsNextCursor(page.nextCursor);
      setMyCommentsHasMore(Boolean(page.nextCursor));
    } catch (error) {
      reportBackgroundError(error);
    } finally {
      setMyCommentsLoadingMore(false);
    }
  }, [
    myCommentsHasMore,
    myCommentsLoadingMore,
    myCommentsNextCursor,
    myPage,
    reportBackgroundError,
    sessionUser,
    setMyCommentsHasMore,
    setMyCommentsLoadedOnce,
    setMyCommentsLoadingMore,
    setMyCommentsNextCursor,
    setMyPage,
  ]);

  return {
    loadMoreFeedReviews,
    loadMoreMyComments,
  };
}
