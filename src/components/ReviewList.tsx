import { memo, useRef } from 'react';
import type { Review } from '../types';
import { ReviewListEmptyState } from './review/ReviewListEmptyState';
import { ReviewListItem } from './review/ReviewListItem';
import { useScrollToHighlightedReview } from './review/useScrollToHighlightedReview';

interface ReviewListProps {
  reviews: Review[];
  canWriteComment: boolean;
  canToggleLike: boolean;
  currentUserId?: string | null;
  highlightedReviewId?: string | null;
  likingReviewId: string | null;
  submittingReviewId: string | null;
  onToggleLike: (reviewId: string) => Promise<void>;
  onSubmitComment: (reviewId: string, body: string, parentId?: string) => Promise<void>;
  onUpdateComment: (reviewId: string, commentId: string, body: string) => Promise<void>;
  onDeleteComment: (reviewId: string, commentId: string) => Promise<void>;
  onRequestLogin: () => void;
  onOpenPlace?: (placeId: string) => void;
  onOpenComments?: (reviewId: string) => void;
  emptyTitle: string;
  emptyBody: string;
}

export const ReviewList = memo(function ReviewList({
  reviews,
  canWriteComment,
  canToggleLike,
  currentUserId = null,
  highlightedReviewId = null,
  likingReviewId,
  submittingReviewId,
  onToggleLike,
  onSubmitComment,
  onUpdateComment,
  onDeleteComment,
  onRequestLogin,
  onOpenPlace,
  onOpenComments,
  emptyTitle,
  emptyBody,
}: ReviewListProps) {
  const listRef = useRef<HTMLDivElement | null>(null);
  useScrollToHighlightedReview(listRef, highlightedReviewId, reviews.length);

  if (reviews.length === 0) {
    return <ReviewListEmptyState emptyTitle={emptyTitle} emptyBody={emptyBody} />;
  }

  return (
    <div ref={listRef} className="review-stack">
      {reviews.map((review) => (
        <ReviewListItem
          key={review.id}
          review={review}
          currentUserId={currentUserId}
          // Performance Optimization: Prevent O(N) re-renders
          // Conditionally pass active IDs (highlightedReviewId, likingReviewId, submittingReviewId)
          // only to the specific list item that needs them, passing null to the rest.
          // This keeps the props referentially stable for inactive items, allowing React.memo
          // to skip re-rendering them when one active ID changes.
          highlightedReviewId={highlightedReviewId === review.id ? highlightedReviewId : null}
          canWriteComment={canWriteComment}
          canToggleLike={canToggleLike}
          likingReviewId={likingReviewId === review.id ? likingReviewId : null}
          submittingReviewId={submittingReviewId === review.id ? submittingReviewId : null}
          onToggleLike={onToggleLike}
          onSubmitComment={onSubmitComment}
          onUpdateComment={onUpdateComment}
          onDeleteComment={onDeleteComment}
          onRequestLogin={onRequestLogin}
          onOpenPlace={onOpenPlace}
          onOpenComments={onOpenComments}
        />
      ))}
    </div>
  );
});
