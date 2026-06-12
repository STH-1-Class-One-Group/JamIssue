import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { RoutePreview } from '../../src/types/core';
import type { SessionUser } from '../../src/types/auth';
import type { Review, UserRoute } from '../../src/types/review';
import {
  createAdminSummaryLoader,
  createMyPageSummaryLoader,
} from '../../src/hooks/app-tab-loaders/summaryLoaders';
import { createFeedReviewLoader } from '../../src/hooks/app-tab-loaders/feedReviewLoader';
import { createCommunityRouteLoader } from '../../src/hooks/app-tab-loaders/communityRouteLoader';
import {
  buildHistoryState,
  buildRouteUrl,
  getRoutePreviewFromHistoryState,
  type RouteState,
} from '../../src/hooks/app-route/routeHistoryState';
import {
  clearAuthQueryParams,
  getInitialMapViewport,
  getInitialNotice,
  getInitialRouteState,
  getLoginReturnUrl,
  updateMapViewportInUrl,
} from '../../src/hooks/app-route/useAppRouteState';
import { applyRouteState, buildCommitRouteState } from '../../src/hooks/app-route/routeStateActions';
import { createReturnViewSnapshot } from '../../src/hooks/app-navigation/returnView';
import { createTabNavigationHelpers } from '../../src/hooks/app-navigation/tabNavigation';
import { createReviewNavigationHelpers } from '../../src/hooks/app-navigation/reviewNavigation';
import { createBottomNavChangeHandler } from '../../src/hooks/app-navigation/shellBottomNav';
import { createNavigateBackHandler } from '../../src/hooks/app-navigation/shellBackNavigation';
import { clampPosition, getDefaultPosition } from '../../src/components/floating-back-button/position';
import { useFloatingBackButton } from '../../src/components/floating-back-button/useFloatingBackButton';
import {
  BUTTON_SIZE,
  DESKTOP_BOTTOM_PADDING,
  EDGE_PADDING,
} from '../../src/components/floating-back-button/constants';

const apiMocks = vi.hoisted(() => ({
  getAdminSummary: vi.fn(),
  getMySummary: vi.fn(),
  getReviewFeedPage: vi.fn(),
  getCommunityRoutes: vi.fn(),
  getReviewDetail: vi.fn(),
}));

vi.mock('../../src/api/adminClient', () => ({
  getAdminSummary: apiMocks.getAdminSummary,
}));

vi.mock('../../src/api/myClient', () => ({
  getMySummary: apiMocks.getMySummary,
}));

vi.mock('../../src/api/reviewsClient', () => ({
  getReviewFeedPage: apiMocks.getReviewFeedPage,
  getReviewDetail: apiMocks.getReviewDetail,
}));

vi.mock('../../src/api/routesClient', () => ({
  getCommunityRoutes: apiMocks.getCommunityRoutes,
}));

const TEST_REVIEW_MOOD = 'test-mood' as Review['mood'];

function reviewFixture(overrides: Partial<Review> = {}): Review {
  return {
    id: 'review-1',
    userId: 'user-1',
    placeId: 'place-1',
    placeName: 'Place 1',
    author: 'author',
    body: 'body',
    mood: TEST_REVIEW_MOOD,
    badge: 'badge',
    visitedAt: '2026-05-14',
    imageUrl: null,
    thumbnailUrl: null,
    commentCount: 0,
    likeCount: 0,
    likedByMe: false,
    stampId: 'stamp-1',
    visitNumber: 1,
    visitLabel: '1',
    travelSessionId: null,
    hasPublishedRoute: false,
    comments: [],
    ...overrides,
  };
}

function routeFixture(overrides: Partial<UserRoute> = {}): UserRoute {
  return {
    id: 'route-1',
    authorId: 'user-1',
    author: 'author',
    title: 'Route',
    description: 'Description',
    mood: 'mood',
    likeCount: 0,
    likedByMe: false,
    createdAt: '2026-05-14',
    placeIds: ['place-1'],
    placeNames: ['Place 1'],
    isUserGenerated: true,
    travelSessionId: null,
    ...overrides,
  };
}

const routePreviewFixture: RoutePreview = {
  id: 'route-1',
  title: 'Route',
  subtitle: 'Subtitle',
  mood: 'mood',
  placeIds: ['place-1'],
  placeNames: ['Place 1'],
};

const adminUser: SessionUser = {
  id: 'admin-1',
  nickname: 'admin',
  email: null,
  provider: 'kakao',
  profileImage: null,
  isAdmin: true,
  profileCompletedAt: null,
};

function resetLocation(path = '/') {
  window.history.replaceState({}, '', path);
}

beforeEach(() => {
  vi.clearAllMocks();
  resetLocation('/');
});

afterEach(() => {
  vi.useRealTimers();
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

describe('tab data loaders', () => {
  test('admin summary loader clears non-admin state and reuses cached summaries off my tab', async () => {
    const setAdminLoading = vi.fn();
    const setAdminSummary = vi.fn();
    const summary = {
      userCount: 1,
      placeCount: 2,
      reviewCount: 3,
      commentCount: 4,
      stampCount: 5,
      sourceReady: true,
      places: [],
    };

    const nonAdminLoader = createAdminSummaryLoader({
      activeTab: 'my',
      adminSummary: summary,
      sessionUser: { ...adminUser, isAdmin: false },
      setAdminLoading,
      setAdminSummary,
    });

    await expect(nonAdminLoader()).resolves.toBeNull();
    expect(setAdminSummary).toHaveBeenCalledWith(null);
    expect(apiMocks.getAdminSummary).not.toHaveBeenCalled();

    const cachedLoader = createAdminSummaryLoader({
      activeTab: 'feed',
      adminSummary: summary,
      sessionUser: adminUser,
      setAdminLoading,
      setAdminSummary,
    });

    await expect(cachedLoader()).resolves.toBe(summary);
    expect(apiMocks.getAdminSummary).not.toHaveBeenCalled();
  });

  test('admin summary loader fetches forced data with loading guards', async () => {
    const setAdminLoading = vi.fn();
    const setAdminSummary = vi.fn();
    const summary = {
      userCount: 1,
      placeCount: 2,
      reviewCount: 3,
      commentCount: 4,
      stampCount: 5,
      sourceReady: true,
      places: [],
    };
    apiMocks.getAdminSummary.mockResolvedValue(summary);

    const loader = createAdminSummaryLoader({
      activeTab: 'feed',
      adminSummary: summary,
      sessionUser: adminUser,
      setAdminLoading,
      setAdminSummary,
    });

    await expect(loader(true)).resolves.toBe(summary);
    expect(setAdminLoading).toHaveBeenNthCalledWith(1, true);
    expect(setAdminSummary).toHaveBeenCalledWith(summary);
    expect(setAdminLoading).toHaveBeenLastCalledWith(false);
  });

  test('my page loader normalizes reviews, clears unauthenticated state, and preserves non-my tab errors', async () => {
    const setMyPage = vi.fn();
    const setMyPageError = vi.fn();
    const myPage = {
      user: adminUser,
      stats: {
        stampCount: 0,
        reviewCount: 0,
        commentCount: 0,
        routeCount: 0,
        visitedPlaceCount: 0,
        collectedPlaceCount: 0,
      },
      reviews: [reviewFixture()],
      comments: [],
      notifications: [],
      unreadNotificationCount: 0,
      stampLogs: [],
      travelSessions: [],
      visitedPlaces: [],
      unvisitedPlaces: [],
      collectedPlaces: [],
      routes: [],
    };
    apiMocks.getMySummary.mockResolvedValue(myPage);

    const loader = createMyPageSummaryLoader({
      activeTab: 'my',
      myPage: null,
      setMyPage,
      setMyPageError,
    });

    await expect(loader(null)).resolves.toBeNull();
    expect(setMyPage).toHaveBeenCalledWith(null);
    expect(setMyPageError).toHaveBeenCalledWith(null);

    await expect(loader(adminUser, true)).resolves.toMatchObject({ reviews: [{ id: 'review-1' }] });
    expect(setMyPage).toHaveBeenLastCalledWith(expect.objectContaining({ reviews: [expect.objectContaining({ id: 'review-1' })] }));
    expect(setMyPageError).toHaveBeenLastCalledWith(null);

    const backgroundLoader = createMyPageSummaryLoader({
      activeTab: 'feed',
      myPage: null,
      setMyPage,
      setMyPageError,
    });
    apiMocks.getMySummary.mockRejectedValueOnce(new Error('network'));

    await expect(backgroundLoader(adminUser, true)).resolves.toBeNull();
    expect(setMyPage).toHaveBeenLastCalledWith(null);
    expect(setMyPageError).toHaveBeenLastCalledWith('network');
  });

  test('feed and community loaders respect cache refs and update pagination state', async () => {
    const setReviews = vi.fn();
    const setFeedNextCursor = vi.fn();
    const setFeedHasMore = vi.fn();
    const feedLoadedRef = { current: false };
    apiMocks.getReviewFeedPage.mockResolvedValue({ items: [reviewFixture()], nextCursor: 'cursor-2' });

    const ensureFeedReviews = createFeedReviewLoader({
      feedLoadedRef,
      setReviews,
      setFeedNextCursor,
      setFeedHasMore,
    });

    await ensureFeedReviews();
    expect(setReviews).toHaveBeenCalledWith([expect.objectContaining({ id: 'review-1' })]);
    expect(setFeedNextCursor).toHaveBeenCalledWith('cursor-2');
    expect(setFeedHasMore).toHaveBeenCalledWith(true);
    expect(feedLoadedRef.current).toBe(true);

    await ensureFeedReviews();
    expect(apiMocks.getReviewFeedPage).toHaveBeenCalledTimes(1);

    const cachedRoute = routeFixture({ id: 'cached-route' });
    const communityRoutesCacheRef = { current: { popular: [cachedRoute] } };
    const replaceCommunityRoutes = vi.fn();
    const setCommunityRoutes = vi.fn();
    const fetchCommunityRoutes = createCommunityRouteLoader({
      communityRoutesCacheRef,
      replaceCommunityRoutes,
      setCommunityRoutes,
    });

    await expect(fetchCommunityRoutes('popular')).resolves.toEqual([cachedRoute]);
    expect(setCommunityRoutes).toHaveBeenCalledWith([cachedRoute]);
    expect(apiMocks.getCommunityRoutes).not.toHaveBeenCalled();

    const latestRoutes = [routeFixture({ id: 'latest-route' })];
    apiMocks.getCommunityRoutes.mockResolvedValue(latestRoutes);
    await expect(fetchCommunityRoutes('latest')).resolves.toEqual(latestRoutes);
    expect(replaceCommunityRoutes).toHaveBeenCalledWith(latestRoutes, 'latest');
  });
});

describe('route state helpers', () => {
  test('initial route and map viewport are read from URL with safe fallbacks', () => {
    resetLocation('/?tab=feed&place=place-1&drawer=full&lat=36.3504119&lng=127.3845475&z=13');

    expect(getInitialRouteState()).toEqual({
      tab: 'feed',
      placeId: 'place-1',
      festivalId: null,
      drawerState: 'full',
    });
    expect(getInitialMapViewport()).toEqual({
      lat: 36.3504119,
      lng: 127.3845475,
      zoom: 13,
    });

    resetLocation('/?auth=kakao-success&lat=bad&lng=bad&z=bad');
    expect(getInitialRouteState().tab).toBe('my');
    expect(getInitialMapViewport()).toMatchObject({ zoom: expect.any(Number) });
    expect(getInitialNotice()).not.toBeNull();
    expect(getLoginReturnUrl()).toBe(`${window.location.origin}/?tab=my`);
  });

  test('route URL builders preserve query state and isolate map drawer params', () => {
    resetLocation('/guide?foo=bar');

    expect(buildRouteUrl({ tab: 'map', placeId: 'place-1', festivalId: null, drawerState: 'closed' }))
      .toBe('/guide?foo=bar&tab=map&place=place-1&drawer=partial');
    expect(buildRouteUrl({ tab: 'map', placeId: null, festivalId: 'festival-1', drawerState: 'full' }))
      .toBe('/guide?foo=bar&tab=map&festival=festival-1&drawer=full');
    expect(buildRouteUrl({ tab: 'feed', placeId: 'place-1', festivalId: null, drawerState: 'full' }))
      .toBe('/guide?foo=bar&tab=feed');

    updateMapViewportInUrl(36.3504119, 127.3845475, 14);
    expect(window.location.search).toContain('lat=36.35041');
    expect(window.location.search).toContain('lng=127.38455');
    expect(window.location.search).toContain('z=14');
  });

  test('history state contracts validate route previews and commit push/replace state', () => {
    const routeState: RouteState = { tab: 'map', placeId: 'place-1', festivalId: null, drawerState: 'partial' };
    const setters = {
      setActiveTab: vi.fn(),
      setSelectedPlaceId: vi.fn(),
      setSelectedFestivalId: vi.fn(),
      setDrawerState: vi.fn(),
      setSelectedRoutePreview: vi.fn(),
    };

    expect(buildHistoryState(routeState, routePreviewFixture)).toEqual({ ...routeState, routePreview: routePreviewFixture });
    expect(getRoutePreviewFromHistoryState({ routePreview: routePreviewFixture })).toBe(routePreviewFixture);
    expect(getRoutePreviewFromHistoryState({ routePreview: { id: 'bad' } })).toBeNull();

    applyRouteState(routeState, routePreviewFixture, setters);
    expect(setters.setActiveTab).toHaveBeenCalledWith('map');
    expect(setters.setSelectedPlaceId).toHaveBeenCalledWith('place-1');
    expect(setters.setSelectedRoutePreview).toHaveBeenCalledWith(routePreviewFixture);

    const pushSpy = vi.spyOn(window.history, 'pushState');
    const replaceSpy = vi.spyOn(window.history, 'replaceState');
    const commitRouteState = buildCommitRouteState({
      ...setters,
      getSelectedRoutePreview: () => routePreviewFixture,
    });

    commitRouteState(routeState);
    expect(pushSpy).toHaveBeenCalledWith(expect.objectContaining({ routePreview: routePreviewFixture }), '', expect.stringContaining('place=place-1'));

    commitRouteState({ tab: 'feed', placeId: null, festivalId: null, drawerState: 'closed' }, 'replace');
    expect(replaceSpy).toHaveBeenCalledWith(expect.objectContaining({ routePreview: null }), '', expect.stringContaining('tab=feed'));
  });

  test('auth query cleanup removes only auth parameters', () => {
    resetLocation('/?tab=my&auth=kakao-error&reason=denied');

    clearAuthQueryParams();

    expect(window.location.search).toBe('?tab=my');
  });

  test('route helpers cover auth providers, drawer fallbacks, SSR fallbacks, and cleanup no-op', () => {
    resetLocation('/?tab=bad&festival=festival-1&drawer=bad');
    expect(getInitialRouteState()).toEqual({
      tab: 'map',
      placeId: null,
      festivalId: 'festival-1',
      drawerState: 'partial',
    });

    for (const [auth, expected] of [
      ['naver-success', '네이버 로그인을 완료했어요.'],
      ['naver-linked', '네이버 계정을 연결했어요.'],
      ['naver-error', '네이버 로그인에 실패했어요. (denied)'],
      ['kakao-linked', '카카오 계정을 연결했어요.'],
      ['kakao-error', '카카오 로그인에 실패했어요. (denied)'],
    ] as const) {
      resetLocation(`/?auth=${auth}&reason=denied`);
      expect(getInitialNotice()).toBe(expected);
    }

    resetLocation('/?tab=feed');
    clearAuthQueryParams();
    expect(window.location.search).toBe('?tab=feed');

    const originalWindow = globalThis.window;
    Reflect.deleteProperty(globalThis, 'window');
    expect(getInitialRouteState()).toEqual({ tab: 'map', placeId: null, festivalId: null, drawerState: 'closed' });
    expect(getInitialNotice()).toBeNull();
    expect(getLoginReturnUrl()).toBe('http://localhost:8000/?tab=my');
    clearAuthQueryParams();
    Object.defineProperty(globalThis, 'window', { configurable: true, value: originalWindow });
  });
});

describe('navigation helpers', () => {
  test('return view snapshots and tab helpers preserve focused feed state when opening places', () => {
    const setReturnView = vi.fn();
    const commitRouteState = vi.fn();
    const setSelectedRoutePreview = vi.fn();
    const handleCloseReviewComments = vi.fn();
    const snapshotReturnView = createReturnViewSnapshot({
      activeTab: 'course',
      myPageTab: 'feeds',
      activeCommentReviewId: 'comment-review',
      highlightedCommentId: 'comment-1',
      highlightedReviewId: 'review-1',
      selectedPlaceId: null,
      selectedFestivalId: null,
      drawerState: 'closed',
      feedPlaceFilterId: null,
    });
    const helpers = createTabNavigationHelpers({
      activeTab: 'course',
      activeCommentReviewId: 'comment-review',
      highlightedCommentId: 'comment-1',
      highlightedReviewId: 'review-1',
      setHighlightedRouteId: vi.fn(),
      setReturnView,
      setSelectedRoutePreview,
      commitRouteState,
      goToTab: vi.fn(),
      snapshotReturnView,
      handleCloseReviewComments,
    });

    helpers.handleOpenRoutePreview(routePreviewFixture);
    expect(setReturnView).toHaveBeenCalledWith(expect.objectContaining({ tab: 'course' }));
    expect(setSelectedRoutePreview).toHaveBeenCalledWith(routePreviewFixture);
    expect(handleCloseReviewComments).toHaveBeenCalled();
    expect(commitRouteState).toHaveBeenCalledWith(
      { tab: 'map', placeId: null, festivalId: null, drawerState: 'closed' },
      'push',
      { routePreview: routePreviewFixture },
    );

    helpers.handleOpenPlaceWithReturn('place-1');
    expect(commitRouteState).toHaveBeenLastCalledWith(
      { tab: 'map', placeId: 'place-1', festivalId: null, drawerState: 'partial' },
      'push',
      { routePreview: null },
    );
  });

  test('tab helpers open festivals and community routes with return-view rules per source tab', () => {
    const setReturnView = vi.fn();
    const setSelectedRoutePreview = vi.fn();
    const setHighlightedRouteId = vi.fn();
    const commitRouteState = vi.fn();
    const goToTab = vi.fn();
    const handleCloseReviewComments = vi.fn();
    const snapshotReturnView = vi.fn(() => ({ tab: 'feed', drawerState: 'closed' }));
    const feedHelpers = createTabNavigationHelpers({
      activeTab: 'feed',
      activeCommentReviewId: 'review-1',
      highlightedCommentId: 'comment-1',
      highlightedReviewId: 'review-1',
      setHighlightedRouteId,
      setReturnView,
      setSelectedRoutePreview,
      commitRouteState,
      goToTab,
      snapshotReturnView,
      handleCloseReviewComments,
    });

    feedHelpers.handleOpenPlaceWithReturn('place-1');
    expect(snapshotReturnView).toHaveBeenCalledWith(expect.objectContaining({
      activeCommentReviewId: null,
      highlightedCommentId: null,
      highlightedReviewId: null,
    }));
    expect(setReturnView).toHaveBeenCalledWith({ tab: 'feed', drawerState: 'closed' });

    feedHelpers.handleOpenFestivalWithReturn('festival-1');
    expect(setSelectedRoutePreview).toHaveBeenLastCalledWith(null);
    expect(commitRouteState).toHaveBeenLastCalledWith(
      { tab: 'map', placeId: null, festivalId: 'festival-1', drawerState: 'partial' },
      'push',
      { routePreview: null },
    );

    feedHelpers.handleOpenCommunityRouteWithReturn('route-1');
    expect(setHighlightedRouteId).toHaveBeenCalledWith('route-1');
    expect(handleCloseReviewComments).toHaveBeenCalled();
    expect(goToTab).toHaveBeenCalledWith('course');

    const courseHelpers = createTabNavigationHelpers({
      activeTab: 'course',
      activeCommentReviewId: null,
      highlightedCommentId: null,
      highlightedReviewId: null,
      setHighlightedRouteId,
      setReturnView,
      setSelectedRoutePreview,
      commitRouteState,
      goToTab,
      snapshotReturnView,
      handleCloseReviewComments,
    });
    setReturnView.mockClear();
    courseHelpers.handleOpenCommunityRouteWithReturn('route-2');
    expect(setReturnView).not.toHaveBeenCalled();
    expect(setHighlightedRouteId).toHaveBeenLastCalledWith('route-2');
  });

  test('review helpers load missing reviews, report failures, and navigate comments', async () => {
    const existingReview = reviewFixture({ id: 'existing-review' });
    const loadedReview = reviewFixture({ id: 'loaded-review' });
    const setNotice = vi.fn();
    const goToTab = vi.fn();
    const upsertReviewCollections = vi.fn();
    apiMocks.getReviewDetail.mockResolvedValueOnce(loadedReview).mockRejectedValueOnce(new Error('missing'));

    const helpers = createReviewNavigationHelpers({
      activeTab: 'map',
      reviews: [existingReview],
      selectedPlaceReviews: [],
      myPageReviews: [],
      goToTab,
      setActiveCommentReviewId: vi.fn(),
      setHighlightedCommentId: vi.fn(),
      setHighlightedReviewId: vi.fn(),
      setFeedPlaceFilterId: vi.fn(),
      setReturnView: vi.fn(),
      setNotice,
      upsertReviewCollections,
      snapshotReturnView: () => ({
        tab: 'map',
        myPageTab: 'feeds',
        activeCommentReviewId: null,
        highlightedCommentId: null,
        highlightedReviewId: null,
        placeId: null,
        festivalId: null,
        drawerState: 'closed',
        feedPlaceFilterId: null,
      }),
    });

    await helpers.handleOpenReviewWithReturn('existing-review');
    expect(apiMocks.getReviewDetail).not.toHaveBeenCalled();
    expect(upsertReviewCollections).toHaveBeenCalledWith(existingReview);
    expect(goToTab).toHaveBeenCalledWith('feed');

    await helpers.handleOpenReviewWithReturn('loaded-review');
    expect(upsertReviewCollections).toHaveBeenCalledWith(loadedReview);

    await helpers.handleOpenCommentWithReturn('missing-review', 'comment-1');
    expect(setNotice).toHaveBeenCalledWith('missing');
  });

  test('review helpers skip missing ids and avoid return-view snapshots when already on feed', async () => {
    const setReturnView = vi.fn();
    const goToTab = vi.fn();
    const setFeedPlaceFilterId = vi.fn();
    const setHighlightedReviewId = vi.fn();
    const setHighlightedCommentId = vi.fn();
    const setActiveCommentReviewId = vi.fn();
    const snapshotReturnView = vi.fn(() => ({ tab: 'map', drawerState: 'closed' }));
    const helpers = createReviewNavigationHelpers({
      activeTab: 'feed',
      reviews: [],
      selectedPlaceReviews: [],
      myPageReviews: [],
      goToTab,
      setActiveCommentReviewId,
      setHighlightedCommentId,
      setHighlightedReviewId,
      setFeedPlaceFilterId,
      setReturnView,
      setNotice: vi.fn(),
      upsertReviewCollections: vi.fn(),
      snapshotReturnView,
    });

    await helpers.handleOpenReviewWithReturn(null);
    expect(goToTab).not.toHaveBeenCalled();

    helpers.handleOpenPlaceFeedWithReturn('place-1');
    expect(snapshotReturnView).not.toHaveBeenCalled();
    expect(setReturnView).not.toHaveBeenCalled();
    expect(setFeedPlaceFilterId).toHaveBeenCalledWith('place-1');
    expect(setHighlightedReviewId).toHaveBeenCalledWith(null);
    expect(setHighlightedCommentId).toHaveBeenCalledWith(null);
    expect(setActiveCommentReviewId).toHaveBeenCalledWith(null);
    expect(goToTab).toHaveBeenCalledWith('feed');
  });

  test('bottom nav and shell back handlers reset cross-tab state before navigation', () => {
    const commitRouteState = vi.fn();
    const clearRoutePreview = vi.fn();
    const closeReviewComments = vi.fn();
    const setFeedPlaceFilterId = vi.fn();
    const setHighlightedReviewId = vi.fn();
    const handleBottomNavChange = createBottomNavChangeHandler({
      selectedPlaceId: 'place-1',
      selectedFestivalId: null,
      drawerState: 'partial',
      setSelectedRoutePreview: clearRoutePreview,
      handleCloseReviewComments: closeReviewComments,
      setFeedPlaceFilterId,
      setHighlightedReviewId,
      commitRouteState,
    });

    handleBottomNavChange('map');
    expect(commitRouteState).toHaveBeenCalledWith(
      { tab: 'map', placeId: 'place-1', festivalId: null, drawerState: 'partial' },
      'replace',
      { routePreview: null },
    );

    handleBottomNavChange('course');
    expect(setFeedPlaceFilterId).toHaveBeenCalledWith(null);
    expect(setHighlightedReviewId).toHaveBeenCalledWith(null);
    expect(commitRouteState).toHaveBeenLastCalledWith(
      { tab: 'course', placeId: null, festivalId: null, drawerState: 'closed' },
      'push',
    );

    const goToTab = vi.fn();
    const handleNavigateBack = createNavigateBackHandler({
      sessionUser: adminUser,
      returnView: null,
      activeCommentReviewId: null,
      activeTab: 'my',
      selectedPlaceId: null,
      selectedFestivalId: null,
      drawerState: 'closed',
      selectedRoutePreview: null,
      setMyPageTab: vi.fn(),
      setActiveCommentReviewId: vi.fn(),
      setHighlightedCommentId: vi.fn(),
      setHighlightedReviewId: vi.fn(),
      setFeedPlaceFilterId: vi.fn(),
      setSelectedRoutePreview: vi.fn(),
      setReturnView: vi.fn(),
      handleCloseReviewComments: closeReviewComments,
      goToTab,
      commitRouteState,
    });

    handleNavigateBack();
    expect(goToTab).toHaveBeenCalledWith('map', 'replace');
  });

  test('shell back handler prioritizes saved return views, comment sheets, route previews, and browser history', () => {
    const baseSetters = {
      setMyPageTab: vi.fn(),
      setActiveCommentReviewId: vi.fn(),
      setHighlightedCommentId: vi.fn(),
      setHighlightedReviewId: vi.fn(),
      setFeedPlaceFilterId: vi.fn(),
      setSelectedRoutePreview: vi.fn(),
      setReturnView: vi.fn(),
      handleCloseReviewComments: vi.fn(),
      goToTab: vi.fn(),
      commitRouteState: vi.fn(),
    };

    createNavigateBackHandler({
      sessionUser: null,
      returnView: {
        tab: 'map',
        myPageTab: 'feeds',
        activeCommentReviewId: 'review-1',
        highlightedCommentId: 'comment-1',
        highlightedReviewId: 'review-1',
        placeId: 'place-1',
        festivalId: null,
        drawerState: 'full',
        feedPlaceFilterId: 'place-2',
      },
      activeCommentReviewId: null,
      activeTab: 'feed',
      selectedPlaceId: null,
      selectedFestivalId: null,
      drawerState: 'closed',
      selectedRoutePreview: routePreviewFixture,
      ...baseSetters,
    })();

    expect(baseSetters.setMyPageTab).toHaveBeenCalledWith('feeds');
    expect(baseSetters.setReturnView).toHaveBeenCalledWith(null);
    expect(baseSetters.setSelectedRoutePreview).toHaveBeenCalledWith(null);
    expect(baseSetters.commitRouteState).toHaveBeenCalledWith(
      { tab: 'map', placeId: 'place-1', festivalId: null, drawerState: 'full' },
      'replace',
    );

    const commentSetters = { ...baseSetters, handleCloseReviewComments: vi.fn(), setSelectedRoutePreview: vi.fn() };
    createNavigateBackHandler({
      sessionUser: null,
      returnView: null,
      activeCommentReviewId: 'review-1',
      activeTab: 'feed',
      selectedPlaceId: null,
      selectedFestivalId: null,
      drawerState: 'closed',
      selectedRoutePreview: routePreviewFixture,
      ...commentSetters,
    })();
    expect(commentSetters.handleCloseReviewComments).toHaveBeenCalledTimes(1);
    expect(commentSetters.setSelectedRoutePreview).not.toHaveBeenCalled();

    const routePreviewSetters = { ...baseSetters, setSelectedRoutePreview: vi.fn() };
    createNavigateBackHandler({
      sessionUser: null,
      returnView: null,
      activeCommentReviewId: null,
      activeTab: 'course',
      selectedPlaceId: null,
      selectedFestivalId: null,
      drawerState: 'closed',
      selectedRoutePreview: routePreviewFixture,
      ...routePreviewSetters,
    })();
    expect(routePreviewSetters.setSelectedRoutePreview).toHaveBeenCalledWith(null);

    const backSpy = vi.spyOn(window.history, 'back').mockImplementation(() => undefined);
    window.history.pushState({}, '', '/?tab=map&place=place-1');
    createNavigateBackHandler({
      sessionUser: null,
      returnView: null,
      activeCommentReviewId: null,
      activeTab: 'map',
      selectedPlaceId: 'place-1',
      selectedFestivalId: null,
      drawerState: 'partial',
      selectedRoutePreview: null,
      ...baseSetters,
    })();
    expect(backSpy).toHaveBeenCalledTimes(1);
  });
});

describe('floating back button positioning', () => {
  test('position helpers preserve input without window and clamp to viewport fallback bounds', () => {
    const originalWindow = globalThis.window;
    Reflect.deleteProperty(globalThis, 'window');
    expect(clampPosition({ x: 5, y: 6 })).toEqual({ x: 5, y: 6 });
    expect(getDefaultPosition()).toEqual({ x: EDGE_PADDING, y: EDGE_PADDING });
    Object.defineProperty(globalThis, 'window', { configurable: true, value: originalWindow });

    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 120 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 160 });

    expect(clampPosition({ x: -100, y: 999 })).toEqual({
      x: EDGE_PADDING,
      y: Math.max(EDGE_PADDING, window.innerHeight - BUTTON_SIZE - DESKTOP_BOTTOM_PADDING),
    });
    expect(getDefaultPosition()).toEqual({
      x: window.innerWidth - BUTTON_SIZE - EDGE_PADDING,
      y: EDGE_PADDING,
    });
  });

  test('position helpers clamp to phone shell bounds and choose a mobile default', () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 390 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 844 });
    const shell = document.createElement('div');
    shell.className = 'phone-shell';
    shell.getBoundingClientRect = () => ({
      left: 10,
      top: 20,
      right: 410,
      bottom: 820,
      width: 400,
      height: 800,
      x: 10,
      y: 20,
      toJSON: () => ({}),
    });
    document.body.appendChild(shell);

    expect(clampPosition({ x: -100, y: 2000 })).toEqual({ x: 22, y: 762 });
    expect(getDefaultPosition()).toEqual({ x: 352, y: 582 });
  });

  test('floating button treats taps as navigation and mouse movement as drag', () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 800 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 600 });
    const onNavigateBack = vi.fn();
    const { result } = renderHook(() => useFloatingBackButton({ onNavigateBack }));
    type FloatingHandlerEvent = Parameters<typeof result.current.handlePointerDown>[0];
    const currentTarget = { setPointerCapture: vi.fn() };

    act(() => {
      result.current.handlePointerDown({
        button: 0,
        pointerId: 1,
        pointerType: 'touch',
        clientX: 10,
        clientY: 10,
        currentTarget,
      } as unknown as FloatingHandlerEvent);
      result.current.handlePointerUp({ pointerId: 1 } as unknown as Parameters<typeof result.current.handlePointerUp>[0]);
    });

    expect(onNavigateBack).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.handlePointerDown({
        button: 0,
        pointerId: 2,
        pointerType: 'mouse',
        clientX: 100,
        clientY: 100,
        currentTarget,
      } as unknown as FloatingHandlerEvent);
      result.current.handlePointerMove({
        pointerId: 2,
        clientX: 120,
        clientY: 130,
        preventDefault: vi.fn(),
      } as unknown as Parameters<typeof result.current.handlePointerMove>[0]);
      result.current.handlePointerUp({ pointerId: 2 } as unknown as Parameters<typeof result.current.handlePointerUp>[0]);
    });

    expect(onNavigateBack).toHaveBeenCalledTimes(1);
    expect(result.current.style.left).toBeGreaterThan(20);
    expect(result.current.isDragging).toBe(false);
  });

  test('floating button ignores non-primary pointers, foreign pointer moves, long-press drags, and click after movement', () => {
    vi.useFakeTimers();
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 390 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 844 });
    const onNavigateBack = vi.fn();
    const { result, unmount } = renderHook(() => useFloatingBackButton({ onNavigateBack }));
    type PointerDownEvent = Parameters<typeof result.current.handlePointerDown>[0];
    const currentTarget = { setPointerCapture: vi.fn() };

    act(() => {
      result.current.handlePointerDown({
        button: 1,
        pointerId: 10,
        pointerType: 'mouse',
        clientX: 1,
        clientY: 1,
        currentTarget,
      } as unknown as PointerDownEvent);
    });
    expect(currentTarget.setPointerCapture).not.toHaveBeenCalled();

    act(() => {
      result.current.handlePointerDown({
        button: 0,
        pointerId: 11,
        pointerType: 'touch',
        clientX: 20,
        clientY: 20,
        currentTarget,
      } as unknown as PointerDownEvent);
      result.current.handlePointerMove({
        pointerId: 99,
        clientX: 80,
        clientY: 80,
        preventDefault: vi.fn(),
      } as unknown as Parameters<typeof result.current.handlePointerMove>[0]);
      vi.runOnlyPendingTimers();
      result.current.handlePointerMove({
        pointerId: 11,
        clientX: 90,
        clientY: 100,
        preventDefault: vi.fn(),
      } as unknown as Parameters<typeof result.current.handlePointerMove>[0]);
      result.current.handlePointerCancel({ pointerId: 99 } as unknown as Parameters<typeof result.current.handlePointerCancel>[0]);
      result.current.handlePointerCancel({ pointerId: 11 } as unknown as Parameters<typeof result.current.handlePointerCancel>[0]);
    });

    expect(onNavigateBack).not.toHaveBeenCalled();
    expect(result.current.isDragging).toBe(false);

    const preventDefault = vi.fn();
    act(() => {
      result.current.handlePointerDown({
        button: 0,
        pointerId: 12,
        pointerType: 'mouse',
        clientX: 100,
        clientY: 100,
        currentTarget,
      } as unknown as PointerDownEvent);
      result.current.handlePointerMove({
        pointerId: 12,
        clientX: 150,
        clientY: 160,
        preventDefault: vi.fn(),
      } as unknown as Parameters<typeof result.current.handlePointerMove>[0]);
      result.current.handleClick({ preventDefault } as unknown as Parameters<typeof result.current.handleClick>[0]);
    });

    expect(preventDefault).toHaveBeenCalled();
    expect(onNavigateBack).not.toHaveBeenCalled();
    unmount();
  });
});
