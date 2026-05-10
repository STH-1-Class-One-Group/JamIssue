import { useMemo } from 'react';
import { FeedTab } from '../FeedTab';
import type { PageStageFeedViewProps } from './appPageStageTypes';

export function PageStageFeedView({
  sharedData,
  feedData,
  sharedActions,
  feedActions,
}: PageStageFeedViewProps) {
  const placeFilterName = feedData.feedPlaceFilterId ? sharedData.placeNameById[feedData.feedPlaceFilterId] ?? null : null;

  const feedTabData = useMemo(() => ({
    reviews: feedData.reviews,
    placeFilterId: feedData.feedPlaceFilterId,
    placeFilterName,
    highlightedReviewId: feedData.highlightedReviewId,
    reviewLikeUpdatingId: feedData.reviewLikeUpdatingId,
    hasMore: feedData.feedHasMore && !feedData.feedPlaceFilterId,
    loadingMore: feedData.feedLoadingMore,
  }), [
    feedData.feedHasMore,
    feedData.feedLoadingMore,
    feedData.feedPlaceFilterId,
    feedData.highlightedReviewId,
    feedData.reviewLikeUpdatingId,
    feedData.reviews,
    placeFilterName,
  ]);

  const commentSheetData = useMemo(() => ({
    activeCommentReviewId: feedData.activeCommentReviewId,
    activeCommentReviewComments: feedData.activeCommentReviewComments,
    activeCommentReviewStatus: feedData.activeCommentReviewStatus,
    highlightedCommentId: feedData.highlightedCommentId,
    commentSubmittingReviewId: feedData.commentSubmittingReviewId,
    commentMutatingId: feedData.commentMutatingId,
    deletingReviewId: feedData.deletingReviewId,
  }), [
    feedData.activeCommentReviewComments,
    feedData.activeCommentReviewId,
    feedData.activeCommentReviewStatus,
    feedData.commentMutatingId,
    feedData.commentSubmittingReviewId,
    feedData.deletingReviewId,
    feedData.highlightedCommentId,
  ]);

  const sharedFeedData = useMemo(() => ({
    sessionUser: sharedData.sessionUser,
  }), [sharedData.sessionUser]);

  const feedTabActions = useMemo(() => ({
    onLoadMore: feedActions.onLoadMoreFeed,
    onToggleReviewLike: feedActions.onToggleReviewLike,
    onCreateComment: feedActions.onCreateComment,
    onUpdateComment: feedActions.onUpdateComment,
    onDeleteComment: feedActions.onDeleteComment,
    onDeleteReview: feedActions.onDeleteReview,
    onClearPlaceFilter: feedActions.onClearPlaceFilter,
    onOpenComments: feedActions.onOpenComments,
    onCloseComments: feedActions.onCloseComments,
  }), [
    feedActions.onClearPlaceFilter,
    feedActions.onCloseComments,
    feedActions.onCreateComment,
    feedActions.onDeleteComment,
    feedActions.onDeleteReview,
    feedActions.onLoadMoreFeed,
    feedActions.onOpenComments,
    feedActions.onToggleReviewLike,
    feedActions.onUpdateComment,
  ]);

  const sharedFeedActions = useMemo(() => ({
    onRequestLogin: sharedActions.onRequestLogin,
    onOpenPlace: sharedActions.onOpenPlace,
  }), [sharedActions.onOpenPlace, sharedActions.onRequestLogin]);

  return (
    <FeedTab
      feedData={feedTabData}
      commentSheetData={commentSheetData}
      sharedData={sharedFeedData}
      feedActions={feedTabActions}
      sharedActions={sharedFeedActions}
    />
  );
}
