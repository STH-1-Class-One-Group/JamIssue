import { ReviewFormFields } from '../ReviewFormFields';
import { ReviewFeedCardHeader } from '../review/ReviewFeedCardHeader';
import { ReviewTagRow } from '../review/ReviewTagRow';
import type { MyReview, ReviewUpdatePayload } from './myFeedTabTypes';
import { reviewMoodOptions } from './myFeedTabTypes';

interface MyFeedReviewCardProps {
  review: MyReview;
  editingReviewId: string | null;
  editingReviewBody: string;
  editingReviewMood: MyReview['mood'];
  editingReviewFile: File | null;
  editingReviewRemoveImage: boolean;
  reviewUpdatingId: string | null;
  reviewEditError: string | null;
  setEditingReviewBody: (body: string) => void;
  setEditingReviewMood: (mood: MyReview['mood']) => void;
  setEditingReviewFile: (file: File | null) => void;
  setEditingReviewRemoveImage: (next: boolean | ((current: boolean) => boolean)) => void;
  startEditingReview: (review: MyReview) => void;
  cancelEditingReview: () => void;
  handleSaveReview: (reviewId: string) => Promise<void>;
  onOpenPlace: (placeId: string) => void;
  onOpenReview: (reviewId: string) => void;
  onDeleteReview: (reviewId: string) => Promise<void>;
  onUpdateReview: (reviewId: string, payload: ReviewUpdatePayload) => Promise<void>;
}

export function MyFeedReviewCard({
  review,
  editingReviewId,
  editingReviewBody,
  editingReviewMood,
  editingReviewFile,
  editingReviewRemoveImage,
  reviewUpdatingId,
  reviewEditError,
  setEditingReviewBody,
  setEditingReviewMood,
  setEditingReviewFile,
  setEditingReviewRemoveImage,
  startEditingReview,
  cancelEditingReview,
  handleSaveReview,
  onOpenPlace,
  onOpenReview,
  onDeleteReview,
  onUpdateReview,
}: MyFeedReviewCardProps) {
  void onUpdateReview;

  return (
    <article className="review-card review-card--my-feed">
      <ReviewFeedCardHeader
        title={(
          <button type="button" className="review-card__place-anchor" onClick={() => onOpenPlace(review.placeId)}>
            <strong className="review-card__title">{review.placeName}</strong>
          </button>
        )}
        mood={review.mood}
        meta={review.visitedAt}
      />
      <ReviewTagRow visitLabel={review.visitLabel} badge={review.badge} hasPublishedRoute={review.hasPublishedRoute} />
      {editingReviewId === review.id ? (
        <div className="route-builder-form review-edit-form">
          <ReviewFormFields
            moodOptions={reviewMoodOptions}
            mood={editingReviewMood}
            onMoodChange={setEditingReviewMood}
            body={editingReviewBody}
            onBodyChange={setEditingReviewBody}
            file={editingReviewFile}
            onFileChange={(nextFile) => {
              setEditingReviewFile(nextFile);
              if (nextFile) {
                setEditingReviewRemoveImage(false);
              }
            }}
            disabled={reviewUpdatingId === review.id}
            bodyLabel="리뷰 내용"
            fileLabel="리뷰 이미지"
            existingImageUrl={review.imageUrl}
            existingImageAlt={`${review.placeName} 기존 리뷰 이미지`}
            removeImage={editingReviewRemoveImage}
            onToggleRemoveImage={review.imageUrl ? (() => {
              setEditingReviewRemoveImage((current) => !current);
              setEditingReviewFile(null);
            }) : undefined}
          />
          {reviewEditError ? <p className="form-error-copy">{reviewEditError}</p> : null}
          <div className="review-card__actions review-card__actions--my-feed review-card__actions--my-feed-links">
            <button
              type="button"
              className="secondary-button"
              onClick={cancelEditingReview}
              disabled={reviewUpdatingId === review.id}
            >
              취소
            </button>
            <button
              type="button"
              className="primary-button"
              disabled={reviewUpdatingId === review.id || editingReviewBody.trim().length < 4}
              onClick={() => void handleSaveReview(review.id)}
            >
              {reviewUpdatingId === review.id ? '저장 중' : '수정 저장'}
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="review-card__body">{review.body}</p>
          <div className="review-card__actions review-card__actions--my-feed">
            <button type="button" className="review-card__place-link" onClick={() => onOpenReview(review.id)}>내 리뷰 보기</button>
            <button type="button" className="review-card__place-link" onClick={() => startEditingReview(review)}>수정</button>
            <button type="button" className="review-card__place-link review-card__place-link--danger" onClick={() => void onDeleteReview(review.id)}>삭제</button>
          </div>
        </>
      )}
    </article>
  );
}
