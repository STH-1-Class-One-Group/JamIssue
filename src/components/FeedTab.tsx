import { useScrollRestoration } from '../hooks/useScrollRestoration';
import { FeedCommentSheet } from './FeedCommentSheet';
import { ReviewList } from './ReviewList';
import type { Review, SessionUser } from '../types';

interface FeedTabProps {
  reviews: Review[];
  sessionUser: SessionUser | null;
  reviewLikeUpdatingId: string | null;
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
  onOpenPlace: (placeId: string) => void;
  onOpenComments: (reviewId: string, commentId?: string | null) => void;
  onCloseComments: () => void;
}

export function FeedTab({
  reviews,
  sessionUser,
  reviewLikeUpdatingId,
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
  onOpenPlace,
  onOpenComments,
  onCloseComments,
}: FeedTabProps) {
  const scrollRef = useScrollRestoration<HTMLElement>('feed');
  const activeReview = reviews.find((review) => review.id === activeCommentReviewId) ?? null;

  return (
    <>
      <section ref={scrollRef} className="page-panel page-panel--scrollable">
        <header className="panel-header">
          <p className="eyebrow">FEED</p>
          <h2>방문 피드</h2>
          <p>스탬프를 찍은 뒤에만 남길 수 있는 실제 방문 후기만 모아 보여줍니다.</p>
        </header>
        <ReviewList
          reviews={reviews}
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
          emptyTitle="아직 공개된 피드가 없어요"
          emptyBody="먼저 스탬프를 찍고 오늘의 분위기를 짧게 남겨 보세요."
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
