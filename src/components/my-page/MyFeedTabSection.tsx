import { ActivityCollectionShell } from '../my-page-activity-view/ActivityCollectionShell';
import { normalizeActivityDateKey } from '../my-page-activity-view/activityDate';
import type { ActivityEntry, ActivityViewMode } from '../my-page-activity-view/activityViewTypes';
import type { ReviewUpdatePayload } from './myFeedTabTypes';
import type { MyReview } from './myFeedTabTypes';
import { MyFeedReviewCard } from './MyFeedReviewCard';
import { useMyFeedReviewEditor } from './useMyFeedReviewEditor';

interface MyFeedTabSectionProps {
  reviews: MyReview[];
  viewMode: ActivityViewMode;
  onOpenPlace: (placeId: string) => void;
  onOpenReview: (reviewId: string) => void;
  onUpdateReview: (reviewId: string, payload: ReviewUpdatePayload) => Promise<void>;
  onDeleteReview: (reviewId: string) => Promise<void>;
  onViewModeChange: (mode: ActivityViewMode) => void;
}

export function MyFeedTabSection({
  reviews,
  viewMode,
  onOpenPlace,
  onOpenReview,
  onUpdateReview,
  onDeleteReview,
  onViewModeChange,
}: MyFeedTabSectionProps) {
  const reviewEditor = useMyFeedReviewEditor(onUpdateReview);
  const entries: ActivityEntry[] = reviews.map((review) => {
    const isEditingThisCard = reviewEditor.editingReviewId === review.id;
    return {
      id: review.id,
      kind: 'feed',
      dateKey: normalizeActivityDateKey(review.visitedAt),
      title: review.placeName,
      meta: review.visitedAt,
      renderListItem: () => (
        <MyFeedReviewCard
          review={review}
          onOpenPlace={onOpenPlace}
          onOpenReview={onOpenReview}
          onDeleteReview={onDeleteReview}
          {...reviewEditor}
          editingReviewBody={isEditingThisCard ? reviewEditor.editingReviewBody : ''}
          editingReviewMood={isEditingThisCard ? reviewEditor.editingReviewMood : review.mood}
          editingReviewFile={isEditingThisCard ? reviewEditor.editingReviewFile : null}
          editingReviewRemoveImage={isEditingThisCard ? reviewEditor.editingReviewRemoveImage : false}
        />
      ),
    };
  });

  return (
    <ActivityCollectionShell
      entries={entries}
      emptyState={<p className="empty-copy">아직 작성한 리뷰가 없어요.</p>}
      mode={viewMode}
      onModeChange={onViewModeChange}
    />
  );
}
