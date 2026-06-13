import { FestivalDetailSheet } from '../FestivalDetailSheet';
import { PlaceDetailSheet } from '../PlaceDetailSheet';
import { TourismInfoSheet } from '../TourismInfoSheet';
import type { MapTabStageProps } from './mapTabStageTypes';
import { resolveMapSheetState } from './mapSheetState';

interface MapStageSheetsProps {
  placeSheet: MapTabStageProps['placeSheet'];
  festivalSheet: MapTabStageProps['festivalSheet'];
  tourismSheet: MapTabStageProps['tourismSheet'];
}

export function MapStageSheets({ placeSheet, festivalSheet, tourismSheet }: MapStageSheetsProps) {
  const placeSheetState = resolveMapSheetState(Boolean(placeSheet.selectedPlace), placeSheet.drawerState);
  const festivalSheetState = resolveMapSheetState(Boolean(festivalSheet.selectedFestival), festivalSheet.drawerState);
  const isTourismSheetOpen = Boolean(tourismSheet.selectedTourismPlace);

  return (
    <>
      <PlaceDetailSheet
        place={placeSheet.selectedPlace}
        reviews={placeSheet.selectedPlaceReviews}
        isOpen={placeSheetState !== 'hidden'}
        drawerState={placeSheet.drawerState}
        sheetState={placeSheetState}
        loggedIn={Boolean(placeSheet.sessionUser)}
        visitCount={placeSheet.visitCount}
        latestStamp={placeSheet.latestStamp}
        todayStamp={placeSheet.todayStamp}
        hasCreatedReviewToday={placeSheet.hasCreatedReviewToday}
        stampActionStatus={placeSheet.stampActionStatus}
        stampActionMessage={placeSheet.stampActionMessage}
        reviewProofMessage={placeSheet.reviewProofMessage}
        reviewError={placeSheet.reviewError}
        reviewSubmitting={placeSheet.reviewSubmitting}
        canCreateReview={placeSheet.canCreateReview}
        onOpenFeedReview={placeSheet.onOpenFeedReview}
        onClose={placeSheet.onCloseDrawer}
        onExpand={placeSheet.onExpandPlaceDrawer}
        onCollapse={placeSheet.onCollapsePlaceDrawer}
        onRequestLogin={placeSheet.onRequestLogin}
        onClaimStamp={placeSheet.onClaimStamp}
        onCreateReview={placeSheet.onCreateReview}
      />

      <FestivalDetailSheet
        festival={festivalSheet.selectedFestival}
        isOpen={festivalSheetState !== 'hidden'}
        drawerState={festivalSheet.drawerState}
        sheetState={festivalSheetState}
        onClose={festivalSheet.onCloseDrawer}
        onExpand={festivalSheet.onExpandFestivalDrawer}
        onCollapse={festivalSheet.onCollapseFestivalDrawer}
      />

      <TourismInfoSheet
        place={tourismSheet.selectedTourismPlace}
        detail={tourismSheet.selectedTourismDetail}
        detailLoading={tourismSheet.detailLoading}
        detailError={tourismSheet.detailError}
        isOpen={isTourismSheetOpen}
        sheetState={tourismSheet.sheetState}
        onClose={tourismSheet.onClose}
        onExpand={tourismSheet.onExpand}
        onCollapse={tourismSheet.onCollapse}
      />
    </>
  );
}
