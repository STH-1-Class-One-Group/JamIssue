import { categoryInfo } from '../lib/categories';
import { PlaceBadgeRow } from './place/PlaceBadgeRow';
import { PlaceDetailHeader } from './place/PlaceDetailHeader';
import { PlaceDetailReviewSection } from './place/PlaceDetailReviewSection';
import { PlaceProofCard } from './place/PlaceProofCard';
import type { PlaceDetailSheetProps } from './place/placeDetailSheetTypes';
import { usePlaceDrawerHandle } from './place/usePlaceDrawerHandle';
import { buildMapSheetClassName } from './map-stage/mapSheetState';

export function PlaceDetailSheet({
  place,
  reviews,
  isOpen,
  drawerState,
  sheetState,
  loggedIn,
  visitCount,
  latestStamp,
  todayStamp,
  hasCreatedReviewToday,
  stampActionStatus,
  stampActionMessage,
  reviewProofMessage,
  reviewError,
  reviewSubmitting,
  canCreateReview,
  onOpenFeedReview,
  onClose,
  onExpand,
  onCollapse,
  onRequestLogin,
  onClaimStamp,
  onCreateReview,
}: PlaceDetailSheetProps) {
  const { handlePointerDown, handlePointerUp, handleClick } = usePlaceDrawerHandle({
    drawerState,
    onClose,
    onExpand,
    onCollapse,
  });

  if (!place || !isOpen) {
    return null;
  }

  const sheetClassName = buildMapSheetClassName('place-drawer', sheetState, drawerState);
  const visitLabel = latestStamp ? latestStamp.visitLabel : '첫 방문 대기';
  const canClaimStamp = loggedIn && !todayStamp;
  const categoryMeta = categoryInfo[place.category];

  return (
    <section className={sheetClassName} data-map-sheet-state={sheetState} aria-label="장소 상세 시트">
      <button
        type="button"
        className="place-drawer__handle"
        aria-label="시트 높이 조절"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onClick={handleClick}
      >
        <span />
      </button>
      {drawerState === 'full' ? (
        <button type="button" className="place-drawer__minimize" aria-label="시트 최소화" onClick={onCollapse}>
          최소화
        </button>
      ) : null}

      <div className="place-drawer__content">
        <PlaceDetailHeader name={place.name} summary={place.summary} onClose={onClose} />

        {place.imageUrl && (
          <div className="place-drawer__hero">
            <img src={place.imageUrl} alt={place.name} className="place-drawer__hero-image" loading="lazy" decoding="async" />
          </div>
        )}

        <PlaceBadgeRow
          categoryLabel={categoryMeta.name}
          categoryIcon={categoryMeta.icon}
          categoryColor={categoryMeta.color}
          district={place.district}
          visitLabel={visitLabel}
          visitCount={visitCount}
        />

        <PlaceProofCard
          loggedIn={loggedIn}
          todayStampExists={Boolean(todayStamp)}
          canClaimStamp={canClaimStamp}
          stampActionStatus={stampActionStatus}
          stampActionMessage={stampActionMessage}
          onRequestLogin={onRequestLogin}
          onClaimStamp={() => {
            void onClaimStamp(place);
          }}
        />

        <div className="sheet-card route-hint-box">
          <strong>이동 힌트</strong>
          <p>{place.routeHint}</p>
        </div>

        <PlaceDetailReviewSection
          place={place}
          reviews={reviews}
          loggedIn={loggedIn}
          todayStamp={todayStamp}
          hasCreatedReviewToday={hasCreatedReviewToday}
          reviewSubmitting={reviewSubmitting}
          reviewError={reviewError}
          reviewProofMessage={reviewProofMessage}
          canCreateReview={canCreateReview}
          onOpenFeedReview={onOpenFeedReview}
          onRequestLogin={onRequestLogin}
          onClaimStamp={onClaimStamp}
          onCreateReview={onCreateReview}
        />
      </div>
    </section>
  );
}
