import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MapStageSheets } from '../../src/components/map-stage/MapStageSheets';

vi.mock('../../src/components/PlaceDetailSheet', () => ({
  PlaceDetailSheet: ({ isOpen, place }: { isOpen: boolean; place: { name: string } | null }) => (
    isOpen ? <div data-testid="place-sheet">{place?.name}</div> : null
  ),
}));

vi.mock('../../src/components/FestivalDetailSheet', () => ({
  FestivalDetailSheet: ({ isOpen, festival }: { isOpen: boolean; festival: { title: string } | null }) => (
    isOpen ? <div data-testid="festival-sheet">{festival?.title}</div> : null
  ),
}));

vi.mock('../../src/components/TourismInfoSheet', () => ({
  TourismInfoSheet: ({ isOpen, place }: { isOpen: boolean; place: { name: string } | null }) => (
    isOpen ? <div data-testid="tourism-sheet">{place?.name}</div> : null
  ),
}));

const noop = vi.fn();

function createPlaceSheet(overrides = {}) {
  return {
    selectedPlace: null,
    selectedPlaceReviews: [],
    drawerState: 'peek',
    sessionUser: null,
    visitCount: 0,
    latestStamp: null,
    todayStamp: null,
    hasCreatedReviewToday: false,
    stampActionStatus: 'idle',
    stampActionMessage: null,
    reviewProofMessage: null,
    reviewError: null,
    reviewSubmitting: false,
    canCreateReview: false,
    onOpenFeedReview: noop,
    onCloseDrawer: noop,
    onExpandPlaceDrawer: noop,
    onCollapsePlaceDrawer: noop,
    onRequestLogin: noop,
    onClaimStamp: noop,
    onCreateReview: noop,
    ...overrides,
  };
}

function createFestivalSheet(overrides = {}) {
  return {
    selectedFestival: null,
    drawerState: 'peek',
    onCloseDrawer: noop,
    onExpandFestivalDrawer: noop,
    onCollapseFestivalDrawer: noop,
    ...overrides,
  };
}

function createTourismSheet(overrides = {}) {
  return {
    selectedTourismPlace: null,
    selectedTourismDetail: null,
    detailLoading: false,
    detailError: null,
    sheetState: 'peek',
    onClose: noop,
    onExpand: noop,
    onCollapse: noop,
    ...overrides,
  };
}

describe('MapStageSheets', () => {
  it('renders only the KTO sheet when KTO and curated place selections are both present', () => {
    render(
      <MapStageSheets
        placeSheet={createPlaceSheet({ selectedPlace: { name: '큐레이션 장소' } }) as never}
        festivalSheet={createFestivalSheet() as never}
        tourismSheet={createTourismSheet({ selectedTourismPlace: { name: 'KTO 장소' } }) as never}
      />,
    );

    expect(screen.getByTestId('tourism-sheet')).toHaveTextContent('KTO 장소');
    expect(screen.queryByTestId('place-sheet')).not.toBeInTheDocument();
    expect(screen.queryByTestId('festival-sheet')).not.toBeInTheDocument();
  });

  it('renders festival before place when both non-KTO selections are present', () => {
    render(
      <MapStageSheets
        placeSheet={createPlaceSheet({ selectedPlace: { name: '큐레이션 장소' } }) as never}
        festivalSheet={createFestivalSheet({ selectedFestival: { title: '행사' } }) as never}
        tourismSheet={createTourismSheet() as never}
      />,
    );

    expect(screen.getByTestId('festival-sheet')).toHaveTextContent('행사');
    expect(screen.queryByTestId('place-sheet')).not.toBeInTheDocument();
    expect(screen.queryByTestId('tourism-sheet')).not.toBeInTheDocument();
  });
});
