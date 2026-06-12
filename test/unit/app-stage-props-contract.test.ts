import { describe, expect, it, vi } from 'vitest';
import { useAppStageProps } from '../../src/hooks/app-stage-props/useAppStageProps';
import { useAppShellStageProps } from '../../src/hooks/app-stage-props/useAppShellStageProps';
import { useMapStageProps } from '../../src/hooks/app-stage-props/useMapStageProps';
import { usePageStageProps } from '../../src/hooks/app-stage-props/usePageStageProps';

function coordinatorState() {
  const notifications = [{ id: 'notification-1', title: 'title', body: 'body', type: 'review-created', createdAt: '2026-05-14', isRead: false }];
  const viewModels = {
    canCreateReview: true,
    filteredPlaces: [{ id: 'place-1' }],
    globalStatus: { tone: 'info', message: 'ready' },
    hasCreatedReviewToday: false,
    hydratedMyPage: { notifications, unreadNotificationCount: 1 },
    latestStamp: { id: 'stamp-latest' },
    placeNameById: { 'place-1': 'Place 1' },
    reviewProofMessage: 'proof',
    routePreviewPlaces: [{ id: 'place-1' }],
    selectedFestival: { id: 'festival-1' },
    selectedPlace: { id: 'place-1' },
    todayStamp: { id: 'stamp-today' },
    visitCount: 2,
  };
  const shellNavigation = {
    canNavigateBack: true,
    handleBottomNavChange: vi.fn(),
    handleNavigateBack: vi.fn(),
  };
  const mapStageActions = {
    handleClearRoutePreview: vi.fn(),
    handleCollapseFestivalDrawer: vi.fn(),
    handleCollapsePlaceDrawer: vi.fn(),
    handleExpandFestivalDrawer: vi.fn(),
    handleExpandPlaceDrawer: vi.fn(),
    handleLocateCurrentPosition: vi.fn(),
    handleMapOpenFestival: vi.fn(),
    handleMapOpenPlace: vi.fn(),
    handleMapOpenPlaceFeed: vi.fn(),
    handleMapOpenRoutePreviewPlace: vi.fn(),
    handleRequestLogin: vi.fn(),
  };
  const reviewActions = {
    handleCreateComment: vi.fn(),
    handleCreateReview: vi.fn(),
    handleDeleteComment: vi.fn(),
    handleDeleteReview: vi.fn(),
    handleToggleReviewLike: vi.fn(),
    handleUpdateComment: vi.fn(),
    handleUpdateReview: vi.fn(),
  };
  const pageStageActions = {
    handleChangeRouteSort: vi.fn(),
    handleClearPlaceFilter: vi.fn(),
    handleOpenCommentFromMyPage: vi.fn(),
    handleOpenRouteFromMyPage: vi.fn(),
    handleRetryMyPage: vi.fn(),
  };
  const routeActions = {
    handlePublishRoute: vi.fn(),
    handleToggleRouteLike: vi.fn(),
  };
  const adminActions = {
    handleRefreshAdminImport: vi.fn(),
    handleToggleAdminManualOverride: vi.fn(),
    handleToggleAdminPlace: vi.fn(),
  };

  return {
    activeCommentReviewId: 'review-1',
    activeCategory: 'all',
    activeReviewCommentsState: {
      activeReviewComments: [{ id: 'comment-1' }],
      activeReviewCommentsStatus: 'ready',
    },
    activeTab: 'feed',
    adminActions,
    adminBusyPlaceId: null,
    adminLoading: false,
    adminSummary: null,
    closeDrawer: vi.fn(),
    commentMutatingId: null,
    commentSubmittingReviewId: null,
    communityRouteSort: 'latest',
    communityRoutes: [],
    courses: [],
    currentPosition: { latitude: 36.35, longitude: 127.38 },
    deletingReviewId: null,
    drawerState: 'full',
    feedHasMore: true,
    feedLoadingMore: false,
    feedPlaceFilterId: 'place-1',
    festivals: [{ id: 'festival-1' }],
    handleClaimStamp: vi.fn(),
    handleCloseReviewComments: vi.fn(),
    handleDeleteNotification: vi.fn(),
    handleLogout: vi.fn(),
    handleMarkAllNotificationsRead: vi.fn(),
    handleOpenGlobalNotification: vi.fn(),
    handleOpenPlaceWithReturn: vi.fn(),
    handleOpenReviewComments: vi.fn(),
    handleOpenReviewWithReturn: vi.fn(),
    handleOpenRoutePreview: vi.fn(),
    handleUpdateProfile: vi.fn(),
    highlightedCommentId: 'comment-1',
    highlightedReviewId: 'review-1',
    highlightedRouteId: 'route-1',
    initialMapViewport: { lat: 36.35, lng: 127.38, zoom: 13 },
    isLoggingOut: false,
    loadMoreFeedReviews: vi.fn(),
    loadMoreMyComments: vi.fn(),
    mapLocationFocusKey: 1,
    mapLocationStatus: 'ready',
    mapStageActions,
    myCommentsHasMore: false,
    myCommentsLoadingMore: false,
    myPageError: null,
    myPageTab: 'feeds',
    pageStageActions,
    profileError: null,
    profileSaving: false,
    providers: [],
    reviewActions,
    reviewError: null,
    reviewLikeUpdatingId: null,
    reviewSubmitting: false,
    reviews: [{ id: 'review-1' }],
    routeActions,
    routeError: null,
    routeLikeUpdatingId: null,
    routeSubmitting: false,
    selectedPlaceReviews: [{ id: 'review-1' }],
    selectedRoutePreview: { id: 'route-1' },
    sessionUser: { id: 'user-1', nickname: 'tester' },
    setActiveCategory: vi.fn(),
    setMyPageTab: vi.fn(),
    shellNavigation,
    stampActionMessage: 'stamp-message',
    stampActionStatus: 'ready',
    startProviderLogin: vi.fn(),
    viewModels,
  };
}

describe('app stage prop contracts', () => {
  it('maps coordinator state into shell, map, and page stage props without changing action identities', () => {
    const state = coordinatorState();

    const typedState = state as unknown as Parameters<typeof useAppStageProps>[0];
    const shellProps = useAppShellStageProps(typedState);
    const mapProps = useMapStageProps(typedState);
    const pageProps = usePageStageProps(typedState);
    const allProps = useAppStageProps(typedState);

    expect(shellProps).toMatchObject({
      activeTab: 'feed',
      canNavigateBack: true,
      globalStatus: { tone: 'info', message: 'ready' },
      globalUtility: {
        sessionUserName: 'tester',
        unreadCount: 1,
      },
    });
    expect(shellProps.globalUtility.notifications).toHaveLength(1);
    expect(mapProps.mapData).toMatchObject({
      activeCategory: 'all',
      drawerState: 'full',
      filteredPlaces: [{ id: 'place-1' }],
      selectedPlace: { id: 'place-1' },
      visitCount: 2,
      canCreateReview: true,
    });
    expect(mapProps.mapActions.onOpenPlace).toBe(state.mapStageActions.handleMapOpenPlace);
    expect(mapProps.mapActions.onCreateReview).toBe(state.reviewActions.handleCreateReview);
    expect(pageProps.feedData).toMatchObject({
      activeCommentReviewId: 'review-1',
      feedHasMore: true,
      highlightedCommentId: 'comment-1',
    });
    expect(pageProps.sharedActions.onOpenPlace).toBe(state.handleOpenPlaceWithReturn);
    expect(pageProps.myPageActions.onToggleAdminPlace).toBe(state.adminActions.handleToggleAdminPlace);
    expect(allProps.mapStageProps.mapActions.onClaimStamp).toBe(state.handleClaimStamp);
    expect(allProps.pageStageProps.courseActions.onToggleRouteLike).toBe(state.routeActions.handleToggleRouteLike);
  });
});
