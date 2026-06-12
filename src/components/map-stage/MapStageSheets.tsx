import { FestivalDetailSheet } from '../FestivalDetailSheet';
import { PlaceDetailSheet } from '../PlaceDetailSheet';
import type { MapTabStageProps } from './mapTabStageTypes';
import { resolveMapSheetState } from './mapSheetState';

interface MapStageSheetsProps {
  placeSheet: MapTabStageProps['placeSheet'];
  festivalSheet: MapTabStageProps['festivalSheet'];
}

export function MapStageSheets({ placeSheet, festivalSheet }: MapStageSheetsProps) {
  const placeSheetState = resolveMapSheetState(Boolean(placeSheet.selectedPlace), placeSheet.drawerState);
  const festivalSheetState = resolveMapSheetState(Boolean(festivalSheet.selectedFestival), festivalSheet.drawerState);

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
    </>
  );
}
