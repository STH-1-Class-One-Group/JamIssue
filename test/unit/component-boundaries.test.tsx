import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminPanel } from '../../src/components/AdminPanel';
import { AppMapStageView } from '../../src/components/AppMapStageView';
import { AppPageStage } from '../../src/components/AppPageStage';
import { FestivalDetailSheet } from '../../src/components/FestivalDetailSheet';
import { FloatingBackButton } from '../../src/components/FloatingBackButton';
import { GlobalStatusBanner } from '../../src/components/GlobalStatusBanner';
import { RoadmapBannerPreview } from '../../src/components/RoadmapBannerPreview';
import { AppPageStageContent } from '../../src/components/page-stage/AppPageStageContent';
import type { AppPageStageProps } from '../../src/components/page-stage/appPageStageTypes';
import type { FestivalItem, Place } from '../../src/types/core';

const componentMocks = vi.hoisted(() => ({
  CourseTab: vi.fn(() => <div data-testid="course-tab" />),
  EventTab: vi.fn(() => <div data-testid="event-tab" />),
  FeedTab: vi.fn(() => <div data-testid="feed-tab" />),
  MapTabStage: vi.fn(() => <div data-testid="map-tab-stage" />),
  MyPagePanel: vi.fn(() => <div data-testid="my-page-panel" />),
  getPublicEventBanner: vi.fn(),
  useFloatingBackButton: vi.fn(),
}));

vi.mock('../../src/components/CourseTab', () => ({
  CourseTab: componentMocks.CourseTab,
}));
vi.mock('../../src/components/EventTab', () => ({
  EventTab: componentMocks.EventTab,
}));
vi.mock('../../src/components/FeedTab', () => ({
  FeedTab: componentMocks.FeedTab,
}));
vi.mock('../../src/components/MapTabStage', () => ({
  MapTabStage: componentMocks.MapTabStage,
}));
vi.mock('../../src/components/MyPagePanel', () => ({
  MyPagePanel: componentMocks.MyPagePanel,
}));
vi.mock('../../src/components/floating-back-button/useFloatingBackButton', () => ({
  useFloatingBackButton: componentMocks.useFloatingBackButton,
}));
vi.mock('../../src/api/bootstrapClient', () => ({
  getPublicEventBanner: componentMocks.getPublicEventBanner,
}));

function festivalFixture(overrides: Partial<FestivalItem> = {}): FestivalItem {
  return {
    id: 'festival-1',
    title: '[Meta] Festival Title (Temp) ABC',
    venueName: 'Venue',
    startDate: '2026-05-14',
    endDate: '2026-05-15',
    homepageUrl: 'https://festival.test',
    roadAddress: 'Road',
    latitude: 36.35,
    longitude: 127.38,
    isOngoing: true,
    ...overrides,
  };
}

function placeFixture(overrides: Partial<Place> = {}): Place {
  return {
    id: 'place-1',
    name: 'Place 1',
    district: 'District',
    category: 'cafe',
    jamColor: '#fff',
    accentColor: '#000',
    latitude: 36.35,
    longitude: 127.38,
    summary: 'summary',
    description: 'description',
    vibeTags: [],
    visitTime: '1h',
    routeHint: 'hint',
    stampReward: 'reward',
    heroLabel: 'hero',
    ...overrides,
  };
}

function pageStageProps(activeTab: AppPageStageProps['activeTab']): AppPageStageProps {
  return {
    activeTab,
    sharedData: {
      festivals: [festivalFixture()],
      placeNameById: { 'place-1': 'Place 1' },
      sessionUser: null,
    },
    feedData: {
      activeCommentReviewComments: [],
      activeCommentReviewId: null,
      activeCommentReviewStatus: 'idle',
      commentMutatingId: null,
      commentSubmittingReviewId: null,
      deletingReviewId: null,
      feedHasMore: false,
      feedLoadingMore: false,
      feedPlaceFilterId: null,
      highlightedCommentId: null,
      highlightedReviewId: null,
      reviewLikeUpdatingId: null,
      reviews: [],
    },
    courseData: {
      communityRouteSort: 'latest',
      communityRoutes: [],
      courses: [],
      highlightedRouteId: null,
      routeLikeUpdatingId: null,
    },
    myPageData: {
      adminBusyPlaceId: null,
      adminLoading: false,
      adminSummary: null,
      commentsHasMore: false,
      commentsLoadingMore: false,
      isLoggingOut: false,
      myPage: null,
      myPageError: null,
      myPageTab: 'feeds',
      profileError: null,
      profileSaving: false,
      providers: [],
      routeError: null,
      routeSubmitting: false,
    },
    sharedActions: {
      onOpenPlace: vi.fn(),
      onRequestLogin: vi.fn(),
    },
    feedActions: {
      onClearPlaceFilter: vi.fn(),
      onCloseComments: vi.fn(),
      onCreateComment: vi.fn(),
      onDeleteComment: vi.fn(),
      onDeleteReview: vi.fn(),
      onLoadMoreFeed: vi.fn(),
      onOpenComments: vi.fn(),
      onToggleReviewLike: vi.fn(),
      onUpdateComment: vi.fn(),
    },
    courseActions: {
      onChangeRouteSort: vi.fn(),
      onOpenRoutePreview: vi.fn(),
      onToggleRouteLike: vi.fn(),
    },
    myPageActions: {
      onChangeMyPageTab: vi.fn(),
      onDeleteReview: vi.fn(),
      onLoadMoreComments: vi.fn(),
      onLogin: vi.fn(),
      onLogout: vi.fn(),
      onOpenCommentFromMyPage: vi.fn(),
      onOpenReview: vi.fn(),
      onOpenRouteFromMyPage: vi.fn(),
      onPublishRoute: vi.fn(),
      onRefreshAdmin: vi.fn(),
      onRetryMyPage: vi.fn(),
      onSaveNickname: vi.fn(),
      onToggleAdminManualOverride: vi.fn(),
      onToggleAdminPlace: vi.fn(),
      onUpdateReview: vi.fn(),
    },
  };
}

describe('component boundary rendering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    componentMocks.useFloatingBackButton.mockReturnValue({
      handleClick: vi.fn(),
      handlePointerCancel: vi.fn(),
      handlePointerDown: vi.fn(),
      handlePointerMove: vi.fn(),
      handlePointerUp: vi.fn(),
      isDragging: false,
      style: { left: 10, top: 20 },
    });
  });

  it('renders admin metrics and wires place visibility controls', async () => {
    const user = userEvent.setup();
    const onRefreshImport = vi.fn().mockResolvedValue(undefined);
    const onToggleManualOverride = vi.fn().mockResolvedValue(undefined);
    const onTogglePlace = vi.fn().mockResolvedValue(undefined);

    render(
      <AdminPanel
        summary={{
          userCount: 1,
          placeCount: 2,
          reviewCount: 3,
          commentCount: 4,
          stampCount: 5,
          sourceReady: true,
          places: [{
            id: 'place-1',
            name: 'Place 1',
            district: 'District',
            category: 'cafe',
            isActive: true,
            isManualOverride: false,
            reviewCount: 2,
            updatedAt: '2026-05-14',
          }],
        }}
        busyPlaceId={null}
        isImporting={false}
        onRefreshImport={onRefreshImport}
        onToggleManualOverride={onToggleManualOverride}
        onTogglePlace={onTogglePlace}
      />,
    );

    expect(screen.getByText('Place 1')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '행사 다시 불러오기' }));
    await user.click(screen.getByRole('button', { name: '자동 동기화' }));
    await user.click(screen.getByRole('button', { name: '노출 중' }));

    expect(onRefreshImport).toHaveBeenCalled();
    expect(onToggleManualOverride).toHaveBeenCalledWith('place-1', true);
    expect(onTogglePlace).toHaveBeenCalledWith('place-1', false);
  });

  it('renders festival details only while open and routes handle clicks by drawer state', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onExpand = vi.fn();
    const onCollapse = vi.fn();
    const { rerender } = render(
      <FestivalDetailSheet
        festival={null}
        isOpen={false}
        drawerState="partial"
        onClose={onClose}
        onExpand={onExpand}
        onCollapse={onCollapse}
      />,
    );
    expect(document.querySelector('.place-drawer')).toBeNull();

    rerender(
      <FestivalDetailSheet
        festival={festivalFixture()}
        isOpen
        drawerState="partial"
        onClose={onClose}
        onExpand={onExpand}
        onCollapse={onCollapse}
      />,
    );

    expect(screen.getByText('Festival Title')).toBeInTheDocument();
    await user.click(document.querySelector('.place-drawer__handle') as HTMLButtonElement);
    expect(onExpand).toHaveBeenCalled();

    rerender(
      <FestivalDetailSheet
        festival={festivalFixture({ homepageUrl: null, venueName: null, roadAddress: null, startDate: '', endDate: '' })}
        isOpen
        drawerState="full"
        onClose={onClose}
        onExpand={onExpand}
        onCollapse={onCollapse}
      />,
    );
    await user.click(document.querySelector('.place-drawer__handle') as HTMLButtonElement);
    expect(onCollapse).toHaveBeenCalled();
  });

  it('routes page stages to feed, event, course, and my page surfaces', () => {
    render(<AppPageStageContent {...pageStageProps('feed')} />);
    expect(screen.getByTestId('feed-tab')).toBeInTheDocument();

    render(<AppPageStageContent {...pageStageProps('event')} />);
    expect(screen.getByTestId('event-tab')).toBeInTheDocument();

    render(<AppPageStageContent {...pageStageProps('course')} />);
    expect(screen.getByTestId('course-tab')).toBeInTheDocument();

    render(<AppPageStage {...pageStageProps('my')} />);
    expect(screen.getByTestId('my-page-panel')).toBeInTheDocument();
    expect(document.querySelector('.page-stage')).toBeInTheDocument();
  });

  it('adapts app map stage data into the MapTabStage prop groups', () => {
    render(
      <AppMapStageView
        mapData={{
          activeCategory: 'all',
          canCreateReview: true,
          currentPosition: null,
          drawerState: 'partial',
          festivals: [festivalFixture()],
          filteredPlaces: [placeFixture()],
          hasCreatedReviewToday: false,
          initialMapViewport: { lat: 36.35, lng: 127.38, zoom: 13 },
          latestStamp: null,
          mapLocationFocusKey: 0,
          mapLocationStatus: 'idle',
          reviewError: null,
          reviewProofMessage: 'proof',
          reviewSubmitting: false,
          routePreview: null,
          routePreviewPlaces: [],
          selectedFestival: null,
          selectedPlace: placeFixture(),
          selectedPlaceReviews: [],
          sessionUser: null,
          stampActionMessage: '',
          stampActionStatus: 'idle',
          todayStamp: null,
          visitCount: 0,
        }}
        mapActions={{
          onClaimStamp: vi.fn(),
          onClearRoutePreview: vi.fn(),
          onCloseDrawer: vi.fn(),
          onCollapseFestivalDrawer: vi.fn(),
          onCollapsePlaceDrawer: vi.fn(),
          onCreateReview: vi.fn(),
          onExpandFestivalDrawer: vi.fn(),
          onExpandPlaceDrawer: vi.fn(),
          onLocateCurrentPosition: vi.fn(),
          onMapViewportChange: vi.fn(),
          onOpenFestival: vi.fn(),
          onOpenPlace: vi.fn(),
          onOpenPlaceFeed: vi.fn(),
          onOpenRoutePreviewPlace: vi.fn(),
          onRequestLogin: vi.fn(),
          setActiveCategory: vi.fn(),
        }}
      />,
    );

    expect(screen.getByTestId('map-tab-stage')).toBeInTheDocument();
    expect(componentMocks.MapTabStage).toHaveBeenCalledWith(
      expect.objectContaining({
        viewportData: expect.objectContaining({
          initialMapCenter: { lat: 36.35, lng: 127.38 },
          initialMapZoom: 13,
        }),
        placeSheet: expect.objectContaining({
          selectedPlace: expect.objectContaining({ id: 'place-1' }),
          canCreateReview: true,
        }),
      }),
      expect.anything(),
    );
  });

  it('renders shared utility components and roadmap preview states', async () => {
    const onNavigateBack = vi.fn();
    componentMocks.getPublicEventBanner.mockResolvedValue({
      sourceReady: true,
      sourceName: 'source',
      importedAt: '2026-05-14T00:00:00Z',
      items: [{
        id: 'event-1',
        title: 'Event 1',
        venueName: 'Venue',
        district: 'District',
        startDate: '2026-05-14',
        endDate: '2026-05-15',
        dateLabel: '05.14',
        summary: 'summary',
        sourcePageUrl: 'https://event.test',
        linkedPlaceName: 'Place 1',
        isOngoing: true,
      }],
    });

    render(<GlobalStatusBanner tone="error" message="message" layout="map" />);
    expect(screen.getByText('message')).toHaveClass('global-status-banner--error');

    render(<FloatingBackButton onNavigateBack={onNavigateBack} />);
    expect(screen.getByRole('button', { name: '이전 화면으로 돌아가기' })).toHaveStyle({ left: '10px' });
    expect(componentMocks.useFloatingBackButton).toHaveBeenCalledWith({ onNavigateBack });

    render(<RoadmapBannerPreview />);
    await waitFor(() => expect(screen.getByText('Event 1')).toBeInTheDocument());
    expect(screen.getByText('Place 1', { exact: false })).toBeInTheDocument();
  });
});
