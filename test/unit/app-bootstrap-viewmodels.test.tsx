import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, expect, test, vi } from 'vitest';
import type { Dispatch, SetStateAction } from 'react';
import type { Place, RoutePreview } from '../../src/types/core';
import type { SessionUser } from '../../src/types/auth';
import type { Review, StampLog, StampState } from '../../src/types/review';
import type { MyPageResponse } from '../../src/types/my-page';
import { handleBootstrapAuthNotice } from '../../src/hooks/app-bootstrap/bootstrapAuthNotice';
import { bootstrapFestivalLoader } from '../../src/hooks/app-bootstrap/bootstrapFestivalLoader';
import { bootstrapMapSession } from '../../src/hooks/app-bootstrap/bootstrapMapSession';
import {
  applyBootstrapSelections,
  resetBootstrapRuntime,
  resetFestivalSelection,
} from '../../src/hooks/app-bootstrap/bootstrapRuntimeReset';
import { useAppBootstrapSharedRefs } from '../../src/hooks/app-bootstrap/useAppBootstrapSharedRefs';
import { useAppTabWarmup } from '../../src/hooks/app-tab-loaders/useAppTabWarmup';
import { useAppViewModels } from '../../src/hooks/useAppViewModels';
import { buildPlaceNameById, filterPlacesByCategory, getRoutePreviewPlaces, getSelectedFestival, getSelectedPlace } from '../../src/hooks/app-view-models/placeSelections';
import { getGlobalStatus, getHydratedMyPage } from '../../src/hooks/app-view-models/statusModels';
import { getHasCreatedReviewToday, getKnownMyReviews, getReviewProofMessage } from '../../src/hooks/app-view-models/reviewCapability';

const apiMocks = vi.hoisted(() => ({
  getFestivals: vi.fn(),
  getMapBootstrap: vi.fn(),
}));

vi.mock('../../src/api/bootstrapClient', () => ({
  getFestivals: apiMocks.getFestivals,
  getMapBootstrap: apiMocks.getMapBootstrap,
}));

const sessionUser: SessionUser = {
  id: 'user-1',
  nickname: 'tester',
  email: null,
  provider: 'kakao',
  profileImage: null,
  isAdmin: false,
  profileCompletedAt: null,
};

const TEST_REVIEW_MOOD = 'test-mood' as Review['mood'];

function placeFixture(overrides: Partial<Place> = {}): Place {
  return {
    id: 'place-1',
    name: 'Place 1',
    district: 'District',
    category: 'cafe',
    jamColor: '#f4a',
    accentColor: '#333',
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

function stampState(): StampState {
  return { collectedPlaceIds: ['place-1'], logs: [], travelSessions: [] };
}

function myPageFixture(overrides: Partial<MyPageResponse> = {}): MyPageResponse {
  return {
    user: sessionUser,
    stats: {
      reviewCount: 1,
      stampCount: 1,
      uniquePlaceCount: 1,
      totalPlaceCount: 1,
      routeCount: 0,
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
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

test('bootstrap auth notice redirects incomplete OAuth profiles to my tab only for success states', () => {
  const goToTab = vi.fn();
  const setNotice = vi.fn();

  handleBootstrapAuthNotice({ authState: 'kakao-success', user: sessionUser, goToTab, setNotice });
  expect(goToTab).toHaveBeenCalledWith('my');
  expect(setNotice).toHaveBeenCalled();

  goToTab.mockClear();
  setNotice.mockClear();
  handleBootstrapAuthNotice({
    authState: 'kakao-error',
    user: { ...sessionUser, profileCompletedAt: null },
    goToTab,
    setNotice,
  });
  expect(goToTab).not.toHaveBeenCalled();
  expect(setNotice).not.toHaveBeenCalled();
});

test('bootstrap runtime reset clears pagination and invalid stale selections', () => {
  const calls = {
    feedNextCursor: vi.fn(),
    feedHasMore: vi.fn(),
    feedLoadingMore: vi.fn(),
    myCommentsNextCursor: vi.fn(),
    myCommentsHasMore: vi.fn(),
    myCommentsLoadingMore: vi.fn(),
    myCommentsLoadedOnce: vi.fn(),
    providers: vi.fn(),
  };
  resetBootstrapRuntime({
    setFeedNextCursor: calls.feedNextCursor,
    setFeedHasMore: calls.feedHasMore,
    setFeedLoadingMore: calls.feedLoadingMore,
    setMyCommentsNextCursor: calls.myCommentsNextCursor,
    setMyCommentsHasMore: calls.myCommentsHasMore,
    setMyCommentsLoadingMore: calls.myCommentsLoadingMore,
    setMyCommentsLoadedOnce: calls.myCommentsLoadedOnce,
    setProviders: calls.providers,
  });
  expect(calls.feedNextCursor).toHaveBeenCalledWith(null);
  expect(calls.providers).toHaveBeenCalledWith([]);

  const setSelectedPlaceId = vi.fn((updater: (current: string | null) => string | null) => updater('stale-place'));
  const setSelectedFestivalId = vi.fn((updater: (current: string | null) => string | null) => updater('festival-1'));
  applyBootstrapSelections({ placeIds: ['place-1'], setSelectedPlaceId, setSelectedFestivalId });
  expect(setSelectedPlaceId.mock.results[0].value).toBeNull();
  expect(setSelectedFestivalId.mock.results[0].value).toBeNull();

  const resetFestivalId = vi.fn((updater: (current: string | null) => string | null) => updater('festival-1'));
  resetFestivalSelection(['festival-1'], resetFestivalId);
  expect(resetFestivalId.mock.results[0].value).toBe('festival-1');
});

test('festival loader applies results only while active', async () => {
  const festival = {
    id: 'festival-1',
    title: 'Festival',
    venueName: null,
    startDate: '2026-05-14',
    endDate: '2026-05-15',
    homepageUrl: null,
    roadAddress: null,
    latitude: null,
    longitude: null,
    isOngoing: true,
    sourceName: null,
  };
  const setFestivals = vi.fn() as Dispatch<SetStateAction<typeof festival[]>>;
  const setSelectedFestivalId = vi.fn();
  apiMocks.getFestivals.mockResolvedValue([festival]);

  await bootstrapFestivalLoader({
    setFestivals,
    setSelectedFestivalId,
    isActive: () => true,
  });
  expect(setFestivals).toHaveBeenCalledWith([festival]);
  expect(setSelectedFestivalId).toHaveBeenCalledWith(expect.any(Function));

  setFestivals.mockClear();
  await bootstrapFestivalLoader({
    setFestivals,
    setSelectedFestivalId,
    isActive: () => false,
  });
  expect(setFestivals).not.toHaveBeenCalled();
});

test('map bootstrap session hydrates map, auth, runtime, and my page state', async () => {
  const providers = [{ key: 'kakao' as const, label: 'Kakao', isEnabled: true, loginUrl: '/login' }];
  apiMocks.getMapBootstrap.mockResolvedValue({
    auth: { isAuthenticated: true, user: sessionUser, providers },
    places: [placeFixture()],
    stamps: stampState(),
    hasRealData: true,
  });
  const refreshMyPageForUserRef = { current: vi.fn().mockResolvedValue(myPageFixture()) };
  const resetReviewCachesRef = { current: vi.fn() };
  const goToTabRef = { current: vi.fn() };
  const setters = {
    setPlaces: vi.fn(),
    setStampState: vi.fn(),
    setHasRealData: vi.fn(),
    setSessionUser: vi.fn(),
    setFeedNextCursor: vi.fn(),
    setFeedHasMore: vi.fn(),
    setFeedLoadingMore: vi.fn(),
    setMyCommentsNextCursor: vi.fn(),
    setMyCommentsHasMore: vi.fn(),
    setMyCommentsLoadingMore: vi.fn(),
    setMyCommentsLoadedOnce: vi.fn(),
    setProviders: vi.fn(),
    setSelectedPlaceId: vi.fn(),
    setSelectedFestivalId: vi.fn(),
    setMyPage: vi.fn(),
    setNotice: vi.fn(),
  };

  await bootstrapMapSession({
    authState: 'kakao-success',
    refreshMyPageForUserRef,
    resetReviewCachesRef,
    goToTabRef,
    ...setters,
    isActive: () => true,
  });

  expect(setters.setPlaces).toHaveBeenCalledWith([expect.objectContaining({ id: 'place-1' })]);
  expect(setters.setStampState).toHaveBeenCalledWith(stampState());
  expect(setters.setHasRealData).toHaveBeenCalledWith(true);
  expect(setters.setSessionUser).toHaveBeenCalledWith(sessionUser);
  expect(resetReviewCachesRef.current).toHaveBeenCalled();
  expect(setters.setProviders).toHaveBeenLastCalledWith(providers);
  expect(refreshMyPageForUserRef.current).toHaveBeenCalledWith(sessionUser, true);
  expect(goToTabRef.current).toHaveBeenCalledWith('my');
});

test('bootstrap shared refs update to latest callback identities', () => {
  const initial = {
    refreshMyPageForUser: vi.fn().mockResolvedValue(null),
    resetReviewCaches: vi.fn(),
    goToTab: vi.fn(),
    formatErrorMessage: vi.fn(() => 'initial'),
    reportBackgroundError: vi.fn(),
  };
  const { result, rerender } = renderHook((props: typeof initial) => useAppBootstrapSharedRefs(props), {
    initialProps: initial,
  });
  const next = {
    refreshMyPageForUser: vi.fn().mockResolvedValue(myPageFixture()),
    resetReviewCaches: vi.fn(),
    goToTab: vi.fn(),
    formatErrorMessage: vi.fn(() => 'next'),
    reportBackgroundError: vi.fn(),
  };

  rerender(next);

  expect(result.current.refreshMyPageForUserRef.current).toBe(next.refreshMyPageForUser);
  expect(result.current.resetReviewCachesRef.current).toBe(next.resetReviewCaches);
  expect(result.current.goToTabRef.current).toBe(next.goToTab);
  expect(result.current.formatErrorMessageRef.current).toBe(next.formatErrorMessage);
  expect(result.current.reportBackgroundErrorRef.current).toBe(next.reportBackgroundError);
});

test('tab warmup calls only the active tab loader path', async () => {
  const ensureFeedReviews = vi.fn().mockResolvedValue(undefined);
  const fetchCommunityRoutes = vi.fn().mockResolvedValue([]);
  const refreshMyPageForUser = vi.fn().mockResolvedValue(myPageFixture());
  const refreshAdminSummary = vi.fn().mockResolvedValue(null);
  const loadMoreMyComments = vi.fn().mockResolvedValue(undefined);
  const reportBackgroundError = vi.fn();

  const { rerender } = renderHook(
    ({ activeTab, myPage, myPageTab, loadedOnce }) => useAppTabWarmup({
      activeTab,
      sessionUser,
      myPage,
      myPageTab,
      adminSummary: null,
      communityRouteSort: 'latest',
      myCommentsLoadedOnce: loadedOnce,
      ensureFeedReviews,
      fetchCommunityRoutes,
      refreshMyPageForUser,
      refreshAdminSummary,
      loadMoreMyComments,
      reportBackgroundError,
    }),
    { initialProps: { activeTab: 'feed' as const, myPage: null as MyPageResponse | null, myPageTab: 'feeds', loadedOnce: false } },
  );

  await waitFor(() => expect(ensureFeedReviews).toHaveBeenCalled());

  rerender({ activeTab: 'course', myPage: null, myPageTab: 'feeds', loadedOnce: false });
  await waitFor(() => expect(fetchCommunityRoutes).toHaveBeenCalledWith('latest'));

  rerender({ activeTab: 'my', myPage: null, myPageTab: 'feeds', loadedOnce: false });
  await waitFor(() => expect(refreshMyPageForUser).toHaveBeenCalledWith(sessionUser, true));

  rerender({ activeTab: 'my', myPage: myPageFixture(), myPageTab: 'comments', loadedOnce: false });
  await waitFor(() => expect(loadMoreMyComments).toHaveBeenCalledWith(true));
  expect(reportBackgroundError).not.toHaveBeenCalled();
});

test('view model helpers select visible data and global status without leaking internal state', () => {
  const places = [placeFixture(), placeFixture({ id: 'place-2', name: 'Place 2', category: 'food' })];
  const routePreview: RoutePreview = {
    id: 'route-1',
    title: 'Route',
    subtitle: 'Subtitle',
    mood: 'mood',
    placeIds: ['place-2', 'missing-place', 'place-1'],
    placeNames: ['Place 2', 'Missing', 'Place 1'],
  };
  const myPage = myPageFixture();
  const notifications = [{ id: 'notification-1', type: 'review-created' as const, title: 'title', body: 'body', createdAt: '2026-05-14', isRead: false, reviewId: null, commentId: null, routeId: null, actorName: null }];

  expect(filterPlacesByCategory(places, 'all')).toBe(places);
  expect(filterPlacesByCategory(places, 'food')).toEqual([expect.objectContaining({ id: 'place-2' })]);
  expect(getSelectedPlace(places, 'place-1')).toEqual(expect.objectContaining({ id: 'place-1' }));
  expect(getSelectedPlace(places, 'missing')).toBeNull();
  expect(getRoutePreviewPlaces(places, routePreview).map((place) => place.id)).toEqual(['place-2', 'place-1']);
  expect(getSelectedFestival([{ id: 'festival-1' }], 'festival-1')).toEqual({ id: 'festival-1' });
  expect(buildPlaceNameById(places)).toMatchObject({ 'place-1': 'Place 1', 'place-2': 'Place 2' });
  expect(getHydratedMyPage({ myPage, notifications, unreadNotificationCount: 1 })).toMatchObject({ notifications, unreadNotificationCount: 1 });
  expect(getGlobalStatus({ notice: 'notice', bootstrapStatus: 'ready', bootstrapError: null, mapLocationStatus: 'idle', mapLocationMessage: null })).toEqual({ tone: 'info', message: 'notice' });
  expect(getGlobalStatus({ notice: null, bootstrapStatus: 'error', bootstrapError: 'failed', mapLocationStatus: 'idle', mapLocationMessage: null })).toEqual({ tone: 'error', message: 'failed' });
  expect(getGlobalStatus({ notice: null, bootstrapStatus: 'ready', bootstrapError: null, mapLocationStatus: 'error', mapLocationMessage: 'gps' })).toEqual({ tone: 'error', message: 'gps' });
});

test('review capability helpers deduplicate current-user reviews and detect today proof', () => {
  const todayStamp: StampLog = {
    id: 'stamp-1',
    placeId: 'place-1',
    placeName: 'Place 1',
    stampedAt: '2026-05-14T00:00:00Z',
    stampedDate: '2026-05-14',
    visitNumber: 1,
    visitLabel: '1',
    travelSessionId: null,
    travelSessionStampCount: 1,
    isToday: true,
  };
  const myReview = reviewFixture({ id: 'review-1', userId: 'user-1', stampId: 'stamp-1' });
  const otherReview = reviewFixture({ id: 'review-2', userId: 'other-user' });

  expect(getKnownMyReviews({
    reviews: [myReview, otherReview],
    selectedPlaceReviews: [myReview],
    myPageReviews: [myReview],
    sessionUser,
  })).toEqual([myReview]);
  expect(getHasCreatedReviewToday({ knownMyReviews: [myReview], sessionUser, todayStamp })).toBe(true);
  expect(getHasCreatedReviewToday({ knownMyReviews: [], sessionUser: null, todayStamp })).toBe(false);
  expect(getReviewProofMessage({ sessionUser, hasCreatedReviewToday: true, todayStamp })).not.toHaveLength(0);
  expect(getReviewProofMessage({ sessionUser: null, hasCreatedReviewToday: false, todayStamp: null })).not.toHaveLength(0);
});

test('useAppViewModels composes filtered places, selected records, stamp proof, and global status', () => {
  const todayStamp: StampLog = {
    id: 'stamp-1',
    placeId: 'place-1',
    placeName: 'Place 1',
    stampedAt: '2026-05-14T00:00:00Z',
    stampedDate: '2026-05-14',
    visitNumber: 1,
    visitLabel: '1',
    travelSessionId: null,
    travelSessionStampCount: 1,
    isToday: true,
  };
  const places = [
    placeFixture({ totalVisitCount: 2 }),
    placeFixture({ id: 'place-2', name: 'Place 2', category: 'food' }),
  ];
  const { result, rerender } = renderHook(
    (props: { notice: string | null; selectedPlaceId: string | null }) => useAppViewModels({
      places,
      festivals: [{
        id: 'festival-1',
        title: 'Festival',
        venueName: null,
        startDate: '2026-05-14',
        endDate: '2026-05-15',
        homepageUrl: null,
        roadAddress: null,
        latitude: null,
        longitude: null,
        isOngoing: true,
      }],
      reviews: [],
      selectedPlaceReviews: [],
      selectedPlaceId: props.selectedPlaceId,
      selectedFestivalId: 'festival-1',
      selectedRoutePreview: {
        id: 'route-1',
        title: 'Route',
        subtitle: 'subtitle',
        mood: 'walk',
        placeIds: ['place-2', 'place-1'],
        placeNames: ['Place 2', 'Place 1'],
      },
      activeCategory: 'all',
      myPage: null,
      notifications: [],
      unreadNotificationCount: 0,
      stampState: { collectedPlaceIds: ['place-1'], logs: [todayStamp], travelSessions: [] },
      currentPosition: { latitude: 36.35, longitude: 127.38 },
      sessionUser,
      notice: props.notice,
      bootstrapStatus: 'ready',
      bootstrapError: null,
      mapLocationStatus: 'idle',
      mapLocationMessage: null,
    }),
    { initialProps: { notice: 'notice', selectedPlaceId: 'place-1' } },
  );

  expect(result.current).toMatchObject({
    filteredPlaces: places,
    selectedPlace: expect.objectContaining({ id: 'place-1' }),
    selectedFestival: expect.objectContaining({ id: 'festival-1', title: 'Festival' }),
    routePreviewPlaces: [expect.objectContaining({ id: 'place-2' }), expect.objectContaining({ id: 'place-1' })],
    todayStamp,
    latestStamp: todayStamp,
    visitCount: 2,
    hasCreatedReviewToday: false,
    canCreateReview: true,
    globalStatus: { tone: 'info', message: 'notice' },
  });
  expect(result.current.selectedPlaceDistanceMeters).toBe(0);

  rerender({ notice: null, selectedPlaceId: null });

  expect(result.current.selectedPlace).toBeNull();
  expect(result.current.canCreateReview).toBe(false);
});
