import { categoryInfo } from '../lib/categories';
import { MapBottomSheet } from './map-stage/MapBottomSheet';
import { PlaceBadgeRow } from './place/PlaceBadgeRow';
import { PlaceDetailHeader } from './place/PlaceDetailHeader';
import { PlaceDetailReviewSection } from './place/PlaceDetailReviewSection';
import { PlaceProofCard } from './place/PlaceProofCard';
import type { PlaceDetailSheetProps } from './place/placeDetailSheetTypes';
import { usePlaceDrawerHandle } from './place/usePlaceDrawerHandle';
import { ContentCard } from './ui-kit';

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

  const visitLabel = latestStamp ? latestStamp.visitLabel : '첫 방문 대기';
  const canClaimStamp = loggedIn && !todayStamp;
  const categoryMeta = categoryInfo[place.category];

  return (
    <MapBottomSheet
      ariaLabel="장소 상세 시트"
      drawerState={drawerState}
      sheetState={sheetState}
      handlePointerHandlers={{
        onPointerDown: handlePointerDown,
        onPointerUp: handlePointerUp,
      }}
      onHandleClick={handleClick}
      onClose={onClose}
      onCollapse={onCollapse}
      onExpand={onExpand}
      media={place.imageUrl ? (
        <img src={place.imageUrl} alt={place.name} className="map-bottom-sheet__media-image" loading="lazy" decoding="async" />
      ) : null}
    >
      <PlaceDetailHeader name={place.name} summary={place.summary} />

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

      <ContentCard as="section" className="sheet-card route-hint-box">
        <strong>이동 힌트</strong>
        <p>{place.routeHint}</p>
      </ContentCard>

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
    </MapBottomSheet>
  );
}
