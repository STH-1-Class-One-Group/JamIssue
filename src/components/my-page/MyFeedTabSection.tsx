import type { ReviewUpdatePayload } from './myFeedTabTypes';
import type { MyReview } from './myFeedTabTypes';
import { MyFeedReviewCard } from './MyFeedReviewCard';
import { useMyFeedReviewEditor } from './useMyFeedReviewEditor';

interface MyFeedTabSectionProps {
  reviews: MyReview[];
  onOpenPlace: (placeId: string) => void;
  onOpenReview: (reviewId: string) => void;
  onUpdateReview: (reviewId: string, payload: ReviewUpdatePayload) => Promise<void>;
  onDeleteReview: (reviewId: string) => Promise<void>;
}

export function MyFeedTabSection({
  reviews,
  onOpenPlace,
  onOpenReview,
  onUpdateReview,
  onDeleteReview,
}: MyFeedTabSectionProps) {
  const reviewEditor = useMyFeedReviewEditor(onUpdateReview);

  return (
    <div className="review-stack">
      {reviews.map((review) => (
        <MyFeedReviewCard
          key={review.id}
          review={review}
          onOpenPlace={onOpenPlace}
          onOpenReview={onOpenReview}
          onUpdateReview={onUpdateReview}
          onDeleteReview={onDeleteReview}
          {...reviewEditor}
        />
      ))}
      {reviews.length === 0 && <p className="empty-copy">아직 작성한 리뷰가 없어요.</p>}
    </div>
  );
}
