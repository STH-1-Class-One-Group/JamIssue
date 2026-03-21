import { useMemo } from 'react';
import { useScrollRestoration } from '../hooks/useScrollRestoration';
import { FeedCommentSheet } from './FeedCommentSheet';
import { ReviewList } from './ReviewList';
import type { Review, SessionUser } from '../types';

interface FeedTabProps {
  reviews: Review[];
  sessionUser: SessionUser | null;
  reviewLikeUpdatingId: string | null;
  placeFilterId: string | null;
  placeFilterName: string | null;
  commentSubmittingReviewId: string | null;
  commentMutatingId: string | null;
  deletingReviewId: string | null;
  activeCommentReviewId: string | null;
  highlightedCommentId: string | null;
  highlightedReviewId: string | null;
  onToggleReviewLike: (reviewId: string) => Promise<void>;
  onCreateComment: (reviewId: string, body: string, parentId?: string) => Promise<void>;
  onUpdateComment: (reviewId: string, commentId: string, body: string) => Promise<void>;
  onDeleteComment: (reviewId: string, commentId: string) => Promise<void>;
  onDeleteReview: (reviewId: string) => Promise<void>;
  onRequestLogin: () => void;
  onClearPlaceFilter: () => void;
  onOpenPlace: (placeId: string) => void;
  onOpenComments: (reviewId: string, commentId?: string | null) => void;
  onCloseComments: () => void;
}

export function FeedTab({
  reviews,
  sessionUser,
  reviewLikeUpdatingId,
  placeFilterId,
  placeFilterName,
  commentSubmittingReviewId,
  commentMutatingId,
  deletingReviewId,
  activeCommentReviewId,
  highlightedCommentId,
  highlightedReviewId,
  onToggleReviewLike,
  onCreateComment,
  onUpdateComment,
  onDeleteComment,
  onDeleteReview,
  onRequestLogin,
  onClearPlaceFilter,
  onOpenPlace,
  onOpenComments,
  onCloseComments,
}: FeedTabProps) {
  const scrollRef = useScrollRestoration<HTMLElement>(`feed:${placeFilterId ?? 'all'}`);
  const visibleReviews = useMemo(
    () => (placeFilterId ? reviews.filter((review) => review.placeId === placeFilterId) : reviews),
    [placeFilterId, reviews],
  );
  const activeReview = reviews.find((review) => review.id === activeCommentReviewId) ?? null;

  return (
    <>
      <section ref={scrollRef} className="page-panel page-panel--scrollable">
        <header className="panel-header">
          <p className="eyebrow">FEED</p>
          <h2>{placeFilterName ? `${placeFilterName} \uD53C\uB4DC` : '\uBC29\uBB38 \uD53C\uB4DC'}</h2>
          <p>{placeFilterName ? '\uC9C0\uB3C4\uC5D0\uC11C \uACE0\uB978 \uC7A5\uC18C\uC758 \uBC29\uBB38 \uD53C\uB4DC\uB9CC \uBA3C\uC800 \uBCF4\uC5EC\uC90D\uB2C8\uB2E4.' : '\uC2A4\uD0EC\uD504\uB97C \uCC0D\uC740 \uB4A4\uC5D0\uB9CC \uB0A8\uAE38 \uC218 \uC788\uB294 \uC2E4\uC81C \uBC29\uBB38 \uD6C4\uAE30\uB9CC \uBAA8\uC544 \uBCF4\uC5EC\uC90D\uB2C8\uB2E4.'}</p>
          {placeFilterName && (
            <div className="chip-row compact-gap">
              <span className="soft-tag">{`\uD604\uC7AC \uC7A5\uC18C: ${placeFilterName}`}</span>
              <button type="button" className="chip" onClick={onClearPlaceFilter}>
                {'\uC804\uCCB4 \uD53C\uB4DC \uBCF4\uAE30'}
              </button>
            </div>
          )}
        </header>
        <ReviewList
          reviews={visibleReviews}
          canWriteComment={Boolean(sessionUser)}
          canToggleLike={Boolean(sessionUser)}
          currentUserId={sessionUser?.id ?? null}
          highlightedReviewId={highlightedReviewId}
          likingReviewId={reviewLikeUpdatingId}
          submittingReviewId={commentSubmittingReviewId}
          onToggleLike={onToggleReviewLike}
          onSubmitComment={onCreateComment}
          onUpdateComment={onUpdateComment}
          onDeleteComment={onDeleteComment}
          onDeleteReview={onDeleteReview}
          onRequestLogin={onRequestLogin}
          onOpenPlace={onOpenPlace}
          onOpenComments={(reviewId) => onOpenComments(reviewId)}
          emptyTitle={placeFilterName ? `${placeFilterName} \uD53C\uB4DC\uAC00 \uC544\uC9C1 \uC5C6\uC5B4\uC694` : '\uC544\uC9C1 \uACF5\uAC1C\uB41C \uD53C\uB4DC\uAC00 \uC5C6\uC5B4\uC694'}
          emptyBody={placeFilterName ? '\uC774 \uC7A5\uC18C\uB97C \uCC0D\uC740 \uB4A4 \uCCAB \uD53C\uB4DC\uB97C \uB0A8\uACA8 \uBCF4\uC138\uC694.' : '\uBA3C\uC800 \uC2A4\uD0EC\uD504\uB97C \uCC0D\uACE0 \uC624\uB298\uC758 \uBD84\uC704\uAE30\uB97C \uC9E7\uAC8C \uB0A8\uACA8 \uBCF4\uC138\uC694.'}
        />
      </section>
      <FeedCommentSheet
        review={activeReview}
        isOpen={activeCommentReviewId !== null}
        canWriteComment={Boolean(sessionUser)}
        currentUserId={sessionUser?.id ?? null}
        submittingReviewId={commentSubmittingReviewId}
        mutatingCommentId={commentMutatingId}
        deletingReviewId={deletingReviewId}
        highlightedCommentId={highlightedCommentId}
        onClose={onCloseComments}
        onSubmitComment={onCreateComment}
        onUpdateComment={onUpdateComment}
        onDeleteComment={onDeleteComment}
        onDeleteReview={onDeleteReview}
        onRequestLogin={onRequestLogin}
      />
    </>
  );
}
