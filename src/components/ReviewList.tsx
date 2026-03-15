import { CommentThread } from './CommentThread';
import type { Review } from '../types';

interface ReviewListProps {
  reviews: Review[];
  canWriteComment: boolean;
  submittingReviewId: string | null;
  onSubmitComment: (reviewId: string, body: string, parentId?: string) => Promise<void>;
  onRequestLogin: () => void;
}

export function ReviewList({ reviews, canWriteComment, submittingReviewId, onSubmitComment, onRequestLogin }: ReviewListProps) {
  if (reviews.length === 0) {
    return (
      <article className="review-card review-card--empty">
        <strong>아직 현장 후기가 없어요.</strong>
        <p>첫 방문 기록을 남기면 이 장소의 분위기가 더 또렷해져요.</p>
      </article>
    );
  }

  return (
    <div className="review-stack">
      {reviews.map((review) => (
        <article key={review.id} className="review-card">
          <div className="review-card__top">
            <div>
              <strong>{review.author}</strong>
              <p>
                {review.badge} / {review.visitedAt}
              </p>
            </div>
            <span className="mood-pill">{review.mood}</span>
          </div>
          <p className="review-card__body">{review.body}</p>
          {review.imageUrl && <img className="review-card__image" src={review.imageUrl} alt={`${review.placeName} 후기 사진`} />}
          <CommentThread reviewId={review.id} comments={review.comments} canWrite={canWriteComment} submitting={submittingReviewId === review.id} onSubmit={onSubmitComment} onRequestLogin={onRequestLogin} />
        </article>
      ))}
    </div>
  );
}