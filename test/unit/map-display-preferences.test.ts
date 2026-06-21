import { describe, expect, it, vi } from 'vitest';
import { useMapStageProps } from '../../src/hooks/app-stage-props/useMapStageProps';
import type { Place } from '../../src/types/core';

const curatedPlace: Place = {
  id: 'place-1',
  positionId: 'position-1',
  name: 'Curated place',
  district: '중구',
  category: 'cafe',
  jamColor: '#ff7fab',
  accentColor: '#7cb9d1',
  imageUrl: null,
  latitude: 36.35,
  longitude: 127.38,
  summary: 'summary',
  description: null,
  vibeTags: [],
  visitTime: null,
  routeHint: null,
  stampReward: null,
  heroLabel: 'PLACE',
  totalVisitCount: 0,
};

function createState({
  showTourismInfo,
  showCuratedWithTourism,
}: {
  showTourismInfo: boolean;
  showCuratedWithTourism: boolean;
}) {
  return {
    activeCategory: 'all',
    activeTourismDisplayGroup: 'all',
    currentPosition: null,
    drawerState: 'closed',
    festivals: [],
    initialMapViewport: { lat: 36.35, lng: 127.38, zoom: 13 },
    mapLocationFocusKey: 0,
    mapLocationMessage: null,
    mapLocationStatus: 'idle',
    mapStageActions: {
      handleClearRoutePreview: vi.fn(),
      handleExpandFestivalDrawer: vi.fn(),
      handleExpandPlaceDrawer: vi.fn(),
      handleLocateCurrentPosition: vi.fn(),
      handleMapOpenFestival: vi.fn(),
      handleMapOpenPlace: vi.fn(),
      handleMapOpenPlaceFeed: vi.fn(),
      handleMapOpenRoutePreviewPlace: vi.fn(),
      handleRequestLogin: vi.fn(),
      handleCollapseFestivalDrawer: vi.fn(),
      handleCollapsePlaceDrawer: vi.fn(),
    },
    reviewActions: {
      handleCreateReview: vi.fn(),
    },
    reviewError: null,
    reviewSubmitting: false,
    selectedPlaceReviews: [],
    selectedRoutePreview: null,
    sessionUser: null,
    setActiveCategory: vi.fn(),
    setActiveTourismDisplayGroup: vi.fn(),
    setSelectedTourismPlaceId: vi.fn(),
    setShowTourismInfo: vi.fn(),
    setTourismSheetState: vi.fn(),
    showCuratedWithTourism,
    selectedTourismPlaceId: null,
    showTourismInfo,
    stampActionMessage: '',
    stampActionStatus: 'idle',
    tourismDetailError: null,
    tourismDetailLoading: false,
    tourismDetailsById: {},
    tourismError: null,
    tourismFacets: null,
    tourismLoading: false,
    tourismPlaces: [],
    tourismSheetState: 'peek',
    tourismSourceReady: true,
    viewModels: {
      canCreateReview: false,
      filteredPlaces: [curatedPlace],
      hasCreatedReviewToday: false,
      latestStamp: null,
      reviewProofMessage: '',
      routePreviewPlaces: [curatedPlace],
      selectedFestival: null,
      selectedPlace: null,
      todayStamp: null,
      visitCount: 0,
    },
    closeDrawer: vi.fn(),
    handleClaimStamp: vi.fn(),
  } as unknown as Parameters<typeof useMapStageProps>[0];
}

describe('TSK-021 map display preferences', () => {
  it('keeps curated map items visible when tourism is off even if the preference is disabled', () => {
    const props = useMapStageProps(createState({
      showTourismInfo: false,
      showCuratedWithTourism: false,
    }));

    expect(props.mapData.filteredPlaces).toEqual([curatedPlace]);
    expect(props.mapData.routePreviewPlaces).toEqual([curatedPlace]);
  });

  it('keeps curated map items visible with tourism enabled by default', () => {
    const props = useMapStageProps(createState({
      showTourismInfo: true,
      showCuratedWithTourism: true,
    }));

    expect(props.mapData.filteredPlaces).toEqual([curatedPlace]);
    expect(props.mapData.routePreviewPlaces).toEqual([curatedPlace]);
  });

  it('hides curated map items only when tourism is enabled and the preference is disabled', () => {
    const props = useMapStageProps(createState({
      showTourismInfo: true,
      showCuratedWithTourism: false,
    }));

    expect(props.mapData.filteredPlaces).toEqual([]);
    expect(props.mapData.routePreviewPlaces).toEqual([]);
  });
});
