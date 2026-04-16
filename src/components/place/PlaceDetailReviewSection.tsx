import { PlaceReviewPreviewList } from '../review/PlaceReviewPreviewList';
import { ReviewComposer } from '../ReviewComposer';
import type { PlaceDetailSheetProps } from './placeDetailSheetTypes';

interface PlaceDetailReviewSectionProps {
  place: NonNullable<PlaceDetailSheetProps['place']>;
  reviews: PlaceDetailSheetProps['reviews'];
  loggedIn: boolean;
  todayStamp: PlaceDetailSheetProps['todayStamp'];
  hasCreatedReviewToday: boolean;
  reviewSubmitting: boolean;
  reviewError: string | null;
  reviewProofMessage: string;
  canCreateReview: boolean;
  onOpenFeedReview: () => void;
  onRequestLogin: () => void;
  onClaimStamp: (place: NonNullable<PlaceDetailSheetProps['place']>) => Promise<void>;
  onCreateReview: PlaceDetailSheetProps['onCreateReview'];
}

export function PlaceDetailReviewSection({
  place,
  reviews,
  loggedIn,
  todayStamp,
  hasCreatedReviewToday,
  reviewSubmitting,
  reviewError,
  reviewProofMessage,
  canCreateReview,
  onOpenFeedReview,
  onRequestLogin,
  onClaimStamp,
  onCreateReview,
}: PlaceDetailReviewSectionProps) {
  const reviewPreview = reviews.slice(0, 2);
  const reviewComposerStatus = !loggedIn ? 'login' : hasCreatedReviewToday ? 'daily-limit' : todayStamp ? 'ready' : 'claim';

  return (
    <>
      <ReviewComposer
        placeName={place.name}
        loggedIn={loggedIn}
        canSubmit={canCreateReview}
        status={reviewComposerStatus}
        submitting={reviewSubmitting}
        errorMessage={reviewError}
        proofMessage={reviewProofMessage}
        onSubmit={({ body, mood, file }) => {
          if (!todayStamp) {
            return Promise.resolve();
          }
          return onCreateReview({ stampId: todayStamp.id, body, mood, file });
        }}
        onRequestLogin={onRequestLogin}
        onRequestProof={() => {
          if (!loggedIn) {
            onRequestLogin();
            return;
          }
          if (!todayStamp) {
            void onClaimStamp(place);
          }
        }}
      />

      <div className="section-title-row section-title-row--tight">
        <div>
          <p className="eyebrow">PLACE FEED</p>
          <h3>이 장소 피드</h3>
        </div>
        <button type="button" className="secondary-button place-drawer__feed-button" onClick={onOpenFeedReview}>
          피드에서 보기
        </button>
      </div>

      <PlaceReviewPreviewList reviews={reviewPreview} />
    </>
  );
}
