import { ReviewComposer } from './ReviewComposer';
import { ReviewList } from './ReviewList';
import type { Place, Review, ReviewMood } from '../types';

interface PlaceDetailSheetProps {
  place: Place | null;
  reviews: Review[];
  isOpen: boolean;
  canWrite: boolean;
  isStampCollected: boolean;
  isStampBusy: boolean;
  reviewError: string | null;
  reviewSubmitting: boolean;
  commentSubmittingReviewId: string | null;
  onClose: () => void;
  onRequestLogin: () => void;
  onCollectStamp: (place: Place) => Promise<void>;
  onCreateReview: (payload: { placeId: string; body: string; mood: ReviewMood; file: File | null }) => Promise<void>;
  onCreateComment: (reviewId: string, body: string, parentId?: string) => Promise<void>;
}

export function PlaceDetailSheet({ place, reviews, isOpen, canWrite, isStampCollected, isStampBusy, reviewError, reviewSubmitting, commentSubmittingReviewId, onClose, onRequestLogin, onCollectStamp, onCreateReview, onCreateComment }: PlaceDetailSheetProps) {
  if (!place || !isOpen) {
    return null;
  }

  return (
    <div className="sheet-backdrop" role="presentation" onClick={onClose}>
      <section className="sheet-panel" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <div className="sheet-panel__grab" />
        <div className="sheet-panel__header">
          <div>
            <p className="eyebrow">PLACE COMMUNITY</p>
            <h2>{place.name}</h2>
            <p>{place.summary}</p>
          </div>
          <button type="button" className="text-button" onClick={onClose}>
            닫기
          </button>
        </div>
        <div className="detail-meta-card">
          <div>
            <strong>{place.district}</strong>
            <p>{place.visitTime}</p>
          </div>
          <button type="button" className={isStampCollected ? 'secondary-button is-complete' : 'primary-button'} onClick={() => void onCollectStamp(place)} disabled={isStampCollected || isStampBusy}>
            {isStampBusy ? '위치 확인 중...' : isStampCollected ? '스탬프 완료' : '현장 스탬프 받기'}
          </button>
        </div>
        <div className="route-hint-box">
          <strong>동선 힌트</strong>
          <p>{place.routeHint}</p>
        </div>
        <ReviewComposer key={place.id} placeName={place.name} loggedIn={canWrite} submitting={reviewSubmitting} errorMessage={reviewError} onSubmit={({ body, mood, file }) => onCreateReview({ placeId: place.id, body, mood, file })} onRequestLogin={onRequestLogin} />
        <div className="section-title-row section-title-row--tight">
          <div>
            <p className="eyebrow">LIVE FEED</p>
            <h3>이 장소 후기와 댓글</h3>
          </div>
          <span className="counter-pill">{reviews.length}개 후기</span>
        </div>
        <ReviewList reviews={reviews} canWriteComment={canWrite} submittingReviewId={commentSubmittingReviewId} onSubmitComment={onCreateComment} onRequestLogin={onRequestLogin} />
      </section>
    </div>
  );
}