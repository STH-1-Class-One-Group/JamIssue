import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAppShellCoordinator } from '../../src/hooks/app-coordinator/useAppShellCoordinator';
import type { CoordinatorArgs } from '../../src/hooks/app-coordinator/useAppShellCoordinator.types';

const coordinatorMocks = vi.hoisted(() => {
  const dataLoaders = {
    ensureFeedReviews: vi.fn(),
    fetchCommunityRoutes: vi.fn(),
    refreshAdminSummary: vi.fn(),
    refreshMyPageForUser: vi.fn(),
  };
  const navigationHelpers = {
    handleCloseReviewComments: vi.fn(),
    handleOpenCommentWithReturn: vi.fn(),
    handleOpenCommunityRouteWithReturn: vi.fn(),
    handleOpenPlaceFeedWithReturn: vi.fn(),
    handleOpenPlaceWithReturn: vi.fn(),
    handleOpenReviewComments: vi.fn(),
    handleOpenReviewWithReturn: vi.fn(),
    handleOpenRoutePreview: vi.fn(),
  };
  const viewModels = {
    canCreateReview: true,
    filteredPlaces: [],
    globalStatus: { tone: 'info', message: 'ready' },
    hasCreatedReviewToday: false,
    hydratedMyPage: { notifications: [], unreadNotificationCount: 0 },
    latestStamp: null,
    placeNameById: {},
    reviewProofMessage: 'proof',
    routePreviewPlaces: [],
    selectedFestival: null,
    selectedPlace: null,
    selectedPlaceDistanceMeters: null,
    todayStamp: null,
    visitCount: 0,
  };
  const activeReviewCommentsState = {
    activeReviewComments: [],
    activeReviewCommentsStatus: 'idle',
    clearReviewComments: vi.fn(),
    syncReviewComments: vi.fn(),
  };
  const paginationActions = {
    loadMoreFeedReviews: vi.fn(),
    loadMoreMyComments: vi.fn(),
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
  const routeActions = {
    handlePublishRoute: vi.fn(),
    handleToggleRouteLike: vi.fn(),
  };
  const adminActions = {
    handleRefreshAdminImport: vi.fn(),
    handleToggleAdminManualOverride: vi.fn(),
    handleToggleAdminPlace: vi.fn(),
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
  const pageStageActions = {
    handleChangeRouteSort: vi.fn(),
    handleClearPlaceFilter: vi.fn(),
    handleOpenCommentFromMyPage: vi.fn(),
    handleOpenRouteFromMyPage: vi.fn(),
    handleRetryMyPage: vi.fn(),
  };
  const shellNavigation = {
    canNavigateBack: true,
    handleBottomNavChange: vi.fn(),
    handleNavigateBack: vi.fn(),
  };

  return {
    activeReviewCommentsState,
    adminActions,
    dataLoaders,
    getInitialNotice: vi.fn(() => null as string | null),
    mapStageActions,
    navigationHelpers,
    pageStageActions,
    paginationActions,
    reviewActions,
    routeActions,
    shellNavigation,
    useActiveReviewComments: vi.fn(() => activeReviewCommentsState),
    useAppAdminActions: vi.fn(() => adminActions),
    useAppAuthActions: vi.fn(() => ({
      handleLogout: vi.fn(),
      handleUpdateProfile: vi.fn(),
      startProviderLogin: vi.fn(),
    })),
    useAppBootstrapLifecycle: vi.fn(),
    useAppFeedbackEffects: vi.fn(),
    useAppMapActions: vi.fn(() => ({
      handleClaimStamp: vi.fn(),
      refreshCurrentPosition: vi.fn(),
    })),
    useAppNavigationHelpers: vi.fn(() => navigationHelpers),
    useAppPagePaginationActions: vi.fn(() => paginationActions),
    useAppPageStageActions: vi.fn(() => pageStageActions),
    useAppReviewActions: vi.fn(() => reviewActions),
    useAppRouteActions: vi.fn(() => routeActions),
    useAppShellNavigation: vi.fn(() => shellNavigation),
    useAppStageActions: vi.fn(() => mapStageActions),
    useAppTabDataLoaders: vi.fn(() => dataLoaders),
    useAppViewModels: vi.fn(() => viewModels),
    useGlobalNotifications: vi.fn(() => ({
      handleDeleteNotification: vi.fn(),
      handleMarkAllNotificationsRead: vi.fn(),
      handleOpenGlobalNotification: vi.fn(),
      notifications: [],
      unreadNotificationCount: 0,
    })),
    viewModels,
  };
});

vi.mock('../../src/hooks/useAppAuthActions', () => ({
  useAppAuthActions: coordinatorMocks.useAppAuthActions,
}));
vi.mock('../../src/hooks/app-tab-loaders/useAppTabDataLoaders', () => ({
  useAppTabDataLoaders: coordinatorMocks.useAppTabDataLoaders,
}));
vi.mock('../../src/hooks/useAppNavigationHelpers', () => ({
  useAppNavigationHelpers: coordinatorMocks.useAppNavigationHelpers,
}));
vi.mock('../../src/hooks/useGlobalNotifications', () => ({
  useGlobalNotifications: coordinatorMocks.useGlobalNotifications,
}));
vi.mock('../../src/hooks/useActiveReviewComments', () => ({
  useActiveReviewComments: coordinatorMocks.useActiveReviewComments,
}));
vi.mock('../../src/hooks/useAppPagePaginationActions', () => ({
  useAppPagePaginationActions: coordinatorMocks.useAppPagePaginationActions,
}));
vi.mock('../../src/hooks/useAppViewModels', () => ({
  useAppViewModels: coordinatorMocks.useAppViewModels,
}));
vi.mock('../../src/hooks/useAppAdminActions', () => ({
  useAppAdminActions: coordinatorMocks.useAppAdminActions,
}));
vi.mock('../../src/hooks/useAppMapActions', () => ({
  useAppMapActions: coordinatorMocks.useAppMapActions,
}));
vi.mock('../../src/hooks/useAppReviewActions', () => ({
  useAppReviewActions: coordinatorMocks.useAppReviewActions,
}));
vi.mock('../../src/hooks/app-route/useAppRouteActions', () => ({
  useAppRouteActions: coordinatorMocks.useAppRouteActions,
}));
vi.mock('../../src/hooks/useAppPageStageActions', () => ({
  useAppPageStageActions: coordinatorMocks.useAppPageStageActions,
}));
vi.mock('../../src/hooks/useAppShellNavigation', () => ({
  useAppShellNavigation: coordinatorMocks.useAppShellNavigation,
}));
vi.mock('../../src/hooks/useAppStageActions', () => ({
  useAppStageActions: coordinatorMocks.useAppStageActions,
}));
vi.mock('../../src/hooks/useAppFeedbackEffects', () => ({
  useAppFeedbackEffects: coordinatorMocks.useAppFeedbackEffects,
}));
vi.mock('../../src/hooks/app-bootstrap/useAppBootstrapLifecycle', () => ({
  useAppBootstrapLifecycle: coordinatorMocks.useAppBootstrapLifecycle,
}));
vi.mock('../../src/hooks/app-route/useAppRouteState', () => ({
  getInitialNotice: coordinatorMocks.getInitialNotice,
}));

function coordinatorArgs(): CoordinatorArgs {
  const sessionUser = { id: 'user-1', nickname: 'tester', email: null, provider: 'kakao', profileImage: null, isAdmin: false, profileCompletedAt: null };
  return {
    routeState: {
      activeTab: 'map',
      closeDrawer: vi.fn(),
      commitRouteState: vi.fn(),
      drawerState: 'partial',
      goToTab: vi.fn(),
      selectedFestivalId: null,
      selectedPlaceId: 'place-1',
    },
    domainState: {
      auth: {
        providers: [],
        sessionUser,
        setProviders: vi.fn(),
        setSessionUser: vi.fn(),
      },
      map: {
        activeCategory: 'all',
        selectedRoutePreview: null,
        setActiveCategory: vi.fn(),
        setSelectedRoutePreview: vi.fn(),
      },
      myPage: {
        myPageTab: 'stamps',
        setMyPageTab: vi.fn(),
      },
      returnView: {
        returnView: null,
        setReturnView: vi.fn(),
      },
      review: {
        activeCommentReviewId: null,
        feedPlaceFilterId: null,
        highlightedCommentId: null,
        highlightedReviewId: null,
        highlightedRouteId: null,
        setActiveCommentReviewId: vi.fn(),
        setFeedPlaceFilterId: vi.fn(),
        setHighlightedCommentId: vi.fn(),
        setHighlightedReviewId: vi.fn(),
        setHighlightedRouteId: vi.fn(),
      },
    },
    shellRuntimeState: {
      bootstrapError: null,
      bootstrapStatus: 'ready',
      currentPosition: null,
      mapLocationFocusKey: 0,
      mapLocationMessage: null,
      mapLocationStatus: 'idle',
      notice: null,
      setBootstrapError: vi.fn(),
      setBootstrapStatus: vi.fn(),
      setCurrentPosition: vi.fn(),
      setMapLocationFocusKey: vi.fn(),
      setMapLocationMessage: vi.fn(),
      setMapLocationStatus: vi.fn(),
      setNotice: vi.fn(),
      setStampActionMessage: vi.fn(),
      setStampActionStatus: vi.fn(),
      stampActionMessage: '',
      stampActionStatus: 'idle',
    },
    pageRuntimeState: {
      commentMutatingId: null,
      commentSubmittingReviewId: null,
      deletingReviewId: null,
      feedHasMore: false,
      feedLoadingMore: false,
      feedNextCursor: null,
      isLoggingOut: false,
      myCommentsHasMore: false,
      myCommentsLoadedOnce: false,
      myCommentsLoadingMore: false,
      myCommentsNextCursor: null,
      myPageError: null,
      profileError: null,
      profileSaving: false,
      reviewError: null,
      reviewLikeUpdatingId: null,
      reviewSubmitting: false,
      routeError: null,
      routeLikeUpdatingId: null,
      routeSubmitting: false,
      setCommentMutatingId: vi.fn(),
      setCommentSubmittingReviewId: vi.fn(),
      setDeletingReviewId: vi.fn(),
      setFeedHasMore: vi.fn(),
      setFeedLoadingMore: vi.fn(),
      setFeedNextCursor: vi.fn(),
      setIsLoggingOut: vi.fn(),
      setMyCommentsHasMore: vi.fn(),
      setMyCommentsLoadedOnce: vi.fn(),
      setMyCommentsLoadingMore: vi.fn(),
      setMyCommentsNextCursor: vi.fn(),
      setMyPageError: vi.fn(),
      setProfileError: vi.fn(),
      setProfileSaving: vi.fn(),
      setReviewError: vi.fn(),
      setReviewLikeUpdatingId: vi.fn(),
      setReviewSubmitting: vi.fn(),
      setRouteError: vi.fn(),
      setRouteLikeUpdatingId: vi.fn(),
      setRouteSubmitting: vi.fn(),
    },
    dataState: {
      adminBusyPlaceId: null,
      adminLoading: false,
      adminSummary: null,
      communityRouteSort: 'latest',
      communityRoutes: [],
      communityRoutesCacheRef: { current: {} },
      courses: [],
      coursesLoadedRef: { current: false },
      feedLoadedRef: { current: false },
      festivals: [],
      hasRealData: true,
      myPage: null,
      patchCommunityRoutes: vi.fn(),
      patchReviewCollections: vi.fn(),
      placeReviewsCacheRef: { current: {} },
      places: [],
      replaceCommunityRoutes: vi.fn(),
      resetReviewCaches: vi.fn(),
      reviews: [],
      selectedPlaceReviews: [],
      setAdminBusyPlaceId: vi.fn(),
      setAdminLoading: vi.fn(),
      setAdminSummary: vi.fn(),
      setCommunityRouteSort: vi.fn(),
      setCommunityRoutes: vi.fn(),
      setCourses: vi.fn(),
      setFestivals: vi.fn(),
      setHasRealData: vi.fn(),
      setMyPage: vi.fn(),
      setPlaces: vi.fn(),
      setReviews: vi.fn(),
      setSelectedPlaceReviews: vi.fn(),
      setStampState: vi.fn(),
      stampState: { collectedPlaceIds: [], logs: [], travelSessions: [] },
      upsertReviewCollections: vi.fn(),
    },
    initialMapViewport: { lat: 36.35, lng: 127.38, zoom: 13 },
  } as CoordinatorArgs;
}

describe('app coordinator composition', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coordinatorMocks.getInitialNotice.mockReturnValue(null);
  });

  it('wires services, effects, actions, and state into one coordinator result', () => {
    const args = coordinatorArgs();

    const { result } = renderHook(() => useAppShellCoordinator(args));

    expect(coordinatorMocks.useAppTabDataLoaders).toHaveBeenCalledWith(expect.objectContaining({
      activeTab: 'map',
      sessionUser: args.domainState.auth.sessionUser,
    }));
    expect(coordinatorMocks.useAppNavigationHelpers).toHaveBeenCalledWith(expect.objectContaining({
      activeTab: 'map',
      selectedPlaceId: 'place-1',
    }));
    expect(coordinatorMocks.useAppViewModels).toHaveBeenCalledWith(expect.objectContaining({
      places: [],
      selectedPlaceId: 'place-1',
      sessionUser: args.domainState.auth.sessionUser,
    }));
    expect(coordinatorMocks.useAppMapActions).toHaveBeenCalledWith(expect.objectContaining({
      sessionUser: args.domainState.auth.sessionUser,
      refreshMyPageForUser: coordinatorMocks.dataLoaders.refreshMyPageForUser,
    }));
    expect(coordinatorMocks.useAppBootstrapLifecycle).toHaveBeenCalledWith(expect.objectContaining({
      activeTab: 'map',
      selectedPlaceId: 'place-1',
      ensureFeedReviews: coordinatorMocks.dataLoaders.ensureFeedReviews,
    }));
    expect(result.current).toMatchObject({
      activeTab: 'map',
      selectedPlaceId: 'place-1',
      initialMapViewport: { lat: 36.35, lng: 127.38, zoom: 13 },
      viewModels: coordinatorMocks.viewModels,
      reviewActions: coordinatorMocks.reviewActions,
      routeActions: coordinatorMocks.routeActions,
      adminActions: coordinatorMocks.adminActions,
      shellNavigation: coordinatorMocks.shellNavigation,
      mapStageActions: coordinatorMocks.mapStageActions,
      pageStageActions: coordinatorMocks.pageStageActions,
      paginationActions: coordinatorMocks.paginationActions,
    });
  });

  it('applies an initial route notice without overwriting an existing notice', async () => {
    coordinatorMocks.getInitialNotice.mockReturnValue('query-notice');
    const args = coordinatorArgs();

    renderHook(() => useAppShellCoordinator(args));

    await waitFor(() => expect(args.shellRuntimeState.setNotice).toHaveBeenCalledWith(expect.any(Function)));
    const updater = vi.mocked(args.shellRuntimeState.setNotice).mock.calls[0][0] as (current: string | null) => string | null;
    expect(updater(null)).toBe('query-notice');
    expect(updater('existing')).toBe('existing');
  });
});
