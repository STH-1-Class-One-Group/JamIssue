import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { GeolocationConfig } from '../../src/config/mapConfig';
import { categoryItems, normalizePlaceCategory } from '../../src/lib/categories';
import { filterPlacesByCategory } from '../../src/lib/filterPlaces';
import { getCurrentDevicePosition } from '../../src/lib/geolocation';
import {
  calculateDistanceMeters,
  formatDistanceMeters,
  formatReviewVisitedAt,
  getLatestPlaceStamp,
  getPlaceVisitCount,
  getTodayStampLog,
} from '../../src/lib/visits';
import { useAppMapStore } from '../../src/store/app-map-store';
import { useAppPageRuntimeStore } from '../../src/store/app-page-runtime-store';
import { useAppRouteStore } from '../../src/store/app-route-store';
import { useAppShellRuntimeStore } from '../../src/store/app-shell-runtime-store';
import { useAppUIStore } from '../../src/store/app-ui-store';
import { useAuthStore } from '../../src/store/auth-store';
import { useMyPageStore } from '../../src/store/my-page-store';
import {
  applyAllReadNotifications,
  applyCreatedNotification,
  applyDeletedNotification,
  applyReadNotification,
  clearReconnectTimer,
  countUnread,
  initialNotificationStoreState,
} from '../../src/store/notification-store/helpers';
import type { NotificationStoreState } from '../../src/store/notification-store/types';
import { useNotificationStore } from '../../src/store/notification-store';
import { useReviewUIStore } from '../../src/store/review-ui-store';
import { resolveValue } from '../../src/store/store-utils';
import type { AuthProvider, Place, RoutePreview, SessionUser, StampLog, UserNotification } from '../../src/types';

const placeFixtures: Place[] = [
  {
    id: 'place-1',
    name: 'Place 1',
    district: 'District',
    category: 'restaurant',
    jamColor: '#111111',
    accentColor: '#222222',
    latitude: 36.35,
    longitude: 127.38,
    summary: 'summary',
    description: 'description',
    vibeTags: [],
    visitTime: '1h',
    routeHint: 'hint',
    stampReward: 'reward',
    heroLabel: 'hero',
  },
  {
    id: 'place-2',
    name: 'Place 2',
    district: 'District',
    category: 'culture',
    jamColor: '#333333',
    accentColor: '#444444',
    latitude: 36.36,
    longitude: 127.39,
    summary: 'summary',
    description: 'description',
    vibeTags: [],
    visitTime: '1h',
    routeHint: 'hint',
    stampReward: 'reward',
    heroLabel: 'hero',
  },
];

const stampLogs: StampLog[] = [
  {
    id: 'stamp-1',
    placeId: 'place-1',
    placeName: 'Place 1',
    stampedAt: '2026-05-14T00:00:00Z',
    stampedDate: '2026-05-14',
    visitNumber: 1,
    visitLabel: '1',
    travelSessionId: null,
    travelSessionStampCount: 1,
    isToday: false,
  },
  {
    id: 'stamp-2',
    placeId: 'place-1',
    placeName: 'Place 1',
    stampedAt: '2026-05-14T01:00:00Z',
    stampedDate: '2026-05-14',
    visitNumber: 2,
    visitLabel: '2',
    travelSessionId: 'session-1',
    travelSessionStampCount: 2,
    isToday: true,
  },
];

const sessionUser: SessionUser = {
  id: 'user-1',
  nickname: 'tester',
  email: null,
  provider: 'kakao',
  profileImage: null,
  isAdmin: false,
  profileCompletedAt: null,
};
const geolocationPermissionDenied = 1;
const geolocationPositionUnavailable = 2;
const geolocationTimeout = 3;

function notificationFixture(id: string, isRead = false): UserNotification {
  return {
    id,
    type: 'review-comment',
    title: 'title',
    body: 'body',
    createdAt: '2026-05-14T00:00:00Z',
    isRead,
    reviewId: 'review-1',
    commentId: null,
    routeId: null,
    actorName: 'tester',
  };
}

function makeGeolocationPosition(
  latitude: number,
  longitude: number,
  accuracy: number,
): GeolocationPosition {
  return {
    coords: {
      latitude,
      longitude,
      accuracy,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
      toJSON: () => ({}),
    },
    timestamp: Date.now(),
    toJSON: () => ({}),
  };
}

function setGeolocationMock(geolocation: Geolocation) {
  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    value: geolocation,
  });
}

beforeEach(() => {
  useAppMapStore.setState({ activeCategory: 'all', selectedRoutePreview: null });
  useAppPageRuntimeStore.setState({
    reviewSubmitting: false,
    reviewError: null,
    reviewLikeUpdatingId: null,
    commentSubmittingReviewId: null,
    commentMutatingId: null,
    deletingReviewId: null,
    routeSubmitting: false,
    routeError: null,
    routeLikeUpdatingId: null,
    profileSaving: false,
    profileError: null,
    myPageError: null,
    isLoggingOut: false,
    feedNextCursor: null,
    feedHasMore: false,
    feedLoadingMore: false,
    myCommentsNextCursor: null,
    myCommentsHasMore: false,
    myCommentsLoadingMore: false,
    myCommentsLoadedOnce: false,
  });
  useAppRouteStore.setState({
    activeTab: 'map',
    drawerState: 'closed',
    selectedPlaceId: null,
    selectedFestivalId: null,
  });
  useAppShellRuntimeStore.setState({
    bootstrapStatus: 'idle',
    bootstrapError: null,
    notice: null,
    currentPosition: null,
    mapLocationStatus: 'idle',
    mapLocationMessage: null,
    mapLocationFocusKey: 0,
    stampActionStatus: 'idle',
  });
  useAppUIStore.setState({ returnView: null });
  useAuthStore.setState({ sessionUser: null });
  useMyPageStore.setState({ myPageTab: 'stamps' });
  useNotificationStore.setState(initialNotificationStoreState);
  useReviewUIStore.setState({
    feedPlaceFilterId: null,
    activeCommentReviewId: null,
    highlightedCommentId: null,
    highlightedReviewId: null,
    highlightedRouteId: null,
  });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('place category and visit utilities', () => {
  it('normalizes external category aliases and filters places without copying all results', () => {
    expect(normalizePlaceCategory('restaurant')).toBe('restaurant');
    expect(normalizePlaceCategory('cafe')).toBe('cafe');
    expect(normalizePlaceCategory('food')).toBe('restaurant');
    expect(normalizePlaceCategory('night')).toBe('attraction');
    expect(normalizePlaceCategory('landmark', 'science-museum')).toBe('culture');
    expect(normalizePlaceCategory('landmark', 'tower')).toBe('attraction');
    expect(normalizePlaceCategory('unknown')).toBe('attraction');
    expect(categoryItems.map((item) => item.key)).toEqual(['all', 'restaurant', 'cafe', 'attraction', 'culture']);
    expect(filterPlacesByCategory(placeFixtures, 'all')).toBe(placeFixtures);
    expect(filterPlacesByCategory(placeFixtures, 'culture')).toEqual([placeFixtures[1]]);
  });

  it('formats distances and derives stamp visit state', () => {
    expect(calculateDistanceMeters(36.3504, 127.3845, 36.3504, 127.3845)).toBe(0);
    expect(formatDistanceMeters(42.4)).toBe('42m');
    expect(formatDistanceMeters(1234)).toBe('1.2km');
    expect(getTodayStampLog(stampLogs, 'place-1')).toBe(stampLogs[1]);
    expect(getTodayStampLog(stampLogs, 'place-2')).toBeNull();
    expect(getPlaceVisitCount(stampLogs, 'place-1')).toBe(2);
    expect(getLatestPlaceStamp(stampLogs, 'place-1')).toBe(stampLogs[0]);
    expect(formatReviewVisitedAt('not-a-date')).toBe('not-a-date');
  });
});

describe('geolocation utility', () => {
  it('rejects when geolocation is unavailable on the current device', async () => {
    const originalGeolocation = navigator.geolocation;
    Reflect.deleteProperty(navigator, 'geolocation');

    await expect(getCurrentDevicePosition()).rejects.toBeInstanceOf(Error);

    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: originalGeolocation,
    });
  });

  it('resolves the best position inside the valid area', async () => {
    vi.useFakeTimers();
    const clearWatch = vi.fn();
    setGeolocationMock({
      clearWatch,
      getCurrentPosition: vi.fn(),
      watchPosition: vi.fn((success) => {
        window.setTimeout(() => {
          success(makeGeolocationPosition(36.3504, 127.3845, GeolocationConfig.earlySuccessAccuracyMeters));
        }, 0);
        return 7;
      }),
    });

    const positionPromise = getCurrentDevicePosition();
    await vi.runOnlyPendingTimersAsync();

    await expect(positionPromise).resolves.toEqual({
      latitude: 36.3504,
      longitude: 127.3845,
      accuracyMeters: GeolocationConfig.earlySuccessAccuracyMeters,
    });
    expect(clearWatch).toHaveBeenCalledWith(7);
    vi.useRealTimers();
  });

  it('rejects explicit geolocation permission errors', async () => {
    vi.useFakeTimers();
    const permissionError = {
      code: geolocationPermissionDenied,
      message: 'permission denied',
      PERMISSION_DENIED: geolocationPermissionDenied,
      POSITION_UNAVAILABLE: geolocationPositionUnavailable,
      TIMEOUT: geolocationTimeout,
    } satisfies GeolocationPositionError;
    setGeolocationMock({
      clearWatch: vi.fn(),
      getCurrentPosition: vi.fn(),
      watchPosition: vi.fn((_success, error) => {
        window.setTimeout(() => {
          error?.(permissionError);
        }, 0);
        return 8;
      }),
    });

    const positionPromise = expect(getCurrentDevicePosition()).rejects.toBeInstanceOf(Error);
    await vi.runOnlyPendingTimersAsync();

    await positionPromise;
    vi.useRealTimers();
  });

  it('rejects unavailable and timed-out geolocation errors with cleanup', async () => {
    vi.useFakeTimers();
    const clearWatch = vi.fn();
    const unavailableError = {
      code: geolocationPositionUnavailable,
      message: 'position unavailable',
      PERMISSION_DENIED: geolocationPermissionDenied,
      POSITION_UNAVAILABLE: geolocationPositionUnavailable,
      TIMEOUT: geolocationTimeout,
    } satisfies GeolocationPositionError;
    setGeolocationMock({
      clearWatch,
      getCurrentPosition: vi.fn(),
      watchPosition: vi.fn((_success, error) => {
        window.setTimeout(() => {
          error?.(unavailableError);
        }, 0);
        return 9;
      }),
    });

    const unavailablePromise = expect(getCurrentDevicePosition()).rejects.toBeInstanceOf(Error);
    await vi.runOnlyPendingTimersAsync();
    await unavailablePromise;
    expect(clearWatch).toHaveBeenCalledWith(9);

    const timeoutError = { ...unavailableError, code: geolocationTimeout, message: 'timeout' };
    setGeolocationMock({
      clearWatch,
      getCurrentPosition: vi.fn(),
      watchPosition: vi.fn((_success, error) => {
        window.setTimeout(() => {
          error?.(timeoutError);
        }, 0);
        return 10;
      }),
    });

    const timeoutPromise = expect(getCurrentDevicePosition()).rejects.toBeInstanceOf(Error);
    await vi.runOnlyPendingTimersAsync();
    await timeoutPromise;
    expect(clearWatch).toHaveBeenCalledWith(10);
    vi.useRealTimers();
  });

  it('rejects unknown geolocation errors with the generic failure path', async () => {
    vi.useFakeTimers();
    const clearWatch = vi.fn();
    const unknownError = {
      code: 999,
      message: 'unknown',
      PERMISSION_DENIED: geolocationPermissionDenied,
      POSITION_UNAVAILABLE: geolocationPositionUnavailable,
      TIMEOUT: geolocationTimeout,
    } satisfies GeolocationPositionError;
    setGeolocationMock({
      clearWatch,
      getCurrentPosition: vi.fn(),
      watchPosition: vi.fn((_success, error) => {
        window.setTimeout(() => {
          error?.(unknownError);
        }, 0);
        return 14;
      }),
    });

    const positionPromise = expect(getCurrentDevicePosition()).rejects.toBeInstanceOf(Error);
    await vi.runOnlyPendingTimersAsync();

    await positionPromise;
    expect(clearWatch).toHaveBeenCalledWith(14);
    vi.useRealTimers();
  });

  it('rejects when no position arrives before settle timeout', async () => {
    vi.useFakeTimers();
    const clearWatch = vi.fn();
    setGeolocationMock({
      clearWatch,
      getCurrentPosition: vi.fn(),
      watchPosition: vi.fn(() => 11),
    });

    const positionPromise = expect(getCurrentDevicePosition()).rejects.toBeInstanceOf(Error);
    await vi.advanceTimersByTimeAsync(GeolocationConfig.settleTimeoutMs);

    await positionPromise;
    expect(clearWatch).toHaveBeenCalledWith(11);
    vi.useRealTimers();
  });

  it('rejects positions outside the service area or with insufficient accuracy', async () => {
    vi.useFakeTimers();
    const clearWatch = vi.fn();
    setGeolocationMock({
      clearWatch,
      getCurrentPosition: vi.fn(),
      watchPosition: vi.fn((success) => {
        window.setTimeout(() => {
          success(makeGeolocationPosition(0, 0, GeolocationConfig.earlySuccessAccuracyMeters));
        }, 0);
        return 12;
      }),
    });

    const outsideAreaPromise = expect(getCurrentDevicePosition()).rejects.toBeInstanceOf(Error);
    await vi.runOnlyPendingTimersAsync();
    await outsideAreaPromise;
    expect(clearWatch).toHaveBeenCalledWith(12);

    setGeolocationMock({
      clearWatch,
      getCurrentPosition: vi.fn(),
      watchPosition: vi.fn((success) => {
        window.setTimeout(() => {
          success(makeGeolocationPosition(
            36.3504,
            127.3845,
            GeolocationConfig.maxAcceptableAccuracyMeters + 1,
          ));
        }, 0);
        return 13;
      }),
    });

    const inaccuratePromise = expect(getCurrentDevicePosition()).rejects.toBeInstanceOf(Error);
    await vi.runOnlyPendingTimersAsync();
    await vi.advanceTimersByTimeAsync(GeolocationConfig.settleTimeoutMs);
    await inaccuratePromise;
    expect(clearWatch).toHaveBeenCalledWith(13);
    vi.useRealTimers();
  });
});

describe('store setter contracts', () => {
  it('resolves direct and functional setter values', () => {
    expect(resolveValue('next', 'current')).toBe('next');
    expect(resolveValue((current: number) => current + 1, 1)).toBe(2);
  });

  it('updates route, map, shell, auth, and page stores through functional setters', () => {
    const routePreview: RoutePreview = {
      id: 'route-1',
      title: 'Route 1',
      subtitle: 'subtitle',
      mood: 'walk',
      placeIds: ['place-1'],
      placeNames: ['Place 1'],
    };
    const providers: AuthProvider[] = [{ key: 'kakao', label: 'Kakao', isEnabled: true, loginUrl: '/login' }];

    useAppRouteStore.getState().setActiveTab('feed');
    useAppRouteStore.getState().setDrawerState('partial');
    useAppRouteStore.getState().setSelectedPlaceId(() => 'place-1');
    useAppRouteStore.getState().setSelectedFestivalId('festival-1');
    useAppMapStore.getState().setActiveCategory('culture');
    useAppMapStore.getState().setSelectedRoutePreview(() => routePreview);
    useAppShellRuntimeStore.getState().setBootstrapStatus('ready');
    useAppShellRuntimeStore.getState().setBootstrapError('error');
    useAppShellRuntimeStore.getState().setNotice('notice');
    useAppShellRuntimeStore.getState().setCurrentPosition({ latitude: 36.35, longitude: 127.38 });
    useAppShellRuntimeStore.getState().setMapLocationStatus('loading');
    useAppShellRuntimeStore.getState().setMapLocationMessage('map');
    useAppShellRuntimeStore.getState().setMapLocationFocusKey((current) => current + 1);
    useAppShellRuntimeStore.getState().setStampActionStatus('ready');
    useAppShellRuntimeStore.getState().setStampActionMessage('stamp');
    useAuthStore.getState().setSessionUser(sessionUser);
    useAuthStore.getState().setProviders(providers);
    useMyPageStore.getState().setMyPageTab('feeds');

    expect(useAppRouteStore.getState()).toMatchObject({
      activeTab: 'feed',
      drawerState: 'partial',
      selectedPlaceId: 'place-1',
      selectedFestivalId: 'festival-1',
    });
    expect(useAppMapStore.getState()).toMatchObject({
      activeCategory: 'culture',
      selectedRoutePreview: routePreview,
    });
    expect(useAppShellRuntimeStore.getState()).toMatchObject({
      bootstrapStatus: 'ready',
      bootstrapError: 'error',
      notice: 'notice',
      currentPosition: { latitude: 36.35, longitude: 127.38 },
      mapLocationStatus: 'loading',
      mapLocationMessage: 'map',
      mapLocationFocusKey: 1,
      stampActionStatus: 'ready',
      stampActionMessage: 'stamp',
    });
    expect(useAuthStore.getState()).toMatchObject({ sessionUser, providers });
    expect(useMyPageStore.getState().myPageTab).toBe('feeds');
  });

  it('updates page runtime, return-view, and review UI stores', () => {
    useAppPageRuntimeStore.getState().setReviewSubmitting(true);
    useAppPageRuntimeStore.getState().setReviewError('review-error');
    useAppPageRuntimeStore.getState().setReviewLikeUpdatingId('review-1');
    useAppPageRuntimeStore.getState().setCommentSubmittingReviewId('review-1');
    useAppPageRuntimeStore.getState().setCommentMutatingId('comment-1');
    useAppPageRuntimeStore.getState().setDeletingReviewId('review-2');
    useAppPageRuntimeStore.getState().setRouteSubmitting(true);
    useAppPageRuntimeStore.getState().setRouteError('route-error');
    useAppPageRuntimeStore.getState().setRouteLikeUpdatingId('route-1');
    useAppPageRuntimeStore.getState().setProfileSaving(true);
    useAppPageRuntimeStore.getState().setProfileError('profile-error');
    useAppPageRuntimeStore.getState().setMyPageError('my-page-error');
    useAppPageRuntimeStore.getState().setIsLoggingOut(true);
    useAppPageRuntimeStore.getState().setFeedNextCursor('feed-cursor');
    useAppPageRuntimeStore.getState().setFeedHasMore(true);
    useAppPageRuntimeStore.getState().setFeedLoadingMore(true);
    useAppPageRuntimeStore.getState().setMyCommentsNextCursor('comment-cursor');
    useAppPageRuntimeStore.getState().setMyCommentsHasMore(true);
    useAppPageRuntimeStore.getState().setMyCommentsLoadingMore(true);
    useAppPageRuntimeStore.getState().setMyCommentsLoadedOnce(true);
    useAppUIStore.getState().setReturnView({
      tab: 'my',
      myPageTab: 'comments',
      activeCommentReviewId: 'review-1',
      highlightedCommentId: 'comment-1',
      highlightedReviewId: 'review-1',
      placeId: 'place-1',
      festivalId: null,
      drawerState: 'full',
      feedPlaceFilterId: 'place-1',
    });
    useReviewUIStore.getState().setFeedPlaceFilterId('place-1');
    useReviewUIStore.getState().setActiveCommentReviewId('review-1');
    useReviewUIStore.getState().setHighlightedCommentId('comment-1');
    useReviewUIStore.getState().setHighlightedReviewId('review-1');
    useReviewUIStore.getState().setHighlightedRouteId('route-1');

    expect(useAppPageRuntimeStore.getState()).toMatchObject({
      reviewSubmitting: true,
      reviewError: 'review-error',
      reviewLikeUpdatingId: 'review-1',
      commentSubmittingReviewId: 'review-1',
      commentMutatingId: 'comment-1',
      deletingReviewId: 'review-2',
      routeSubmitting: true,
      routeError: 'route-error',
      routeLikeUpdatingId: 'route-1',
      profileSaving: true,
      profileError: 'profile-error',
      myPageError: 'my-page-error',
      isLoggingOut: true,
      feedNextCursor: 'feed-cursor',
      feedHasMore: true,
      feedLoadingMore: true,
      myCommentsNextCursor: 'comment-cursor',
      myCommentsHasMore: true,
      myCommentsLoadingMore: true,
      myCommentsLoadedOnce: true,
    });
    expect(useAppUIStore.getState().returnView).toMatchObject({ tab: 'my', myPageTab: 'comments' });
    expect(useReviewUIStore.getState()).toMatchObject({
      feedPlaceFilterId: 'place-1',
      activeCommentReviewId: 'review-1',
      highlightedCommentId: 'comment-1',
      highlightedReviewId: 'review-1',
      highlightedRouteId: 'route-1',
    });
  });
});

describe('notification store helpers', () => {
  it('applies notification mutations and unread counts without duplicating created items', () => {
    const existing = notificationFixture('notification-1');
    const replacement = { ...existing, body: 'updated' };
    const other = notificationFixture('notification-2', true);
    const state: NotificationStoreState = {
      ...initialNotificationStoreState,
      notifications: [existing, other],
      unreadCount: 1,
    };

    expect(countUnread(state.notifications)).toBe(1);
    expect(applyCreatedNotification(state, { notification: replacement, unreadCount: 1 })).toMatchObject({
      notifications: [replacement, other],
      unreadCount: 1,
      connected: true,
      status: 'ready',
      error: null,
    });
    expect(applyReadNotification(state, { notificationId: 'notification-1', unreadCount: 0 })).toMatchObject({
      notifications: [{ ...existing, isRead: true }, other],
      unreadCount: 0,
      connected: true,
    });
    expect(applyAllReadNotifications(state, { unreadCount: 0 })).toMatchObject({
      notifications: [{ ...existing, isRead: true }, { ...other, isRead: true }],
      unreadCount: 0,
      connected: true,
    });
    expect(applyDeletedNotification(state, { notificationId: 'notification-1', unreadCount: 0 })).toMatchObject({
      notifications: [other],
      unreadCount: 0,
      connected: true,
    });
  });

  it('clears reconnect timers and hydrates notification store state', () => {
    const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout');
    clearReconnectTimer(123);
    clearReconnectTimer(null);

    const notifications = [notificationFixture('notification-1'), notificationFixture('notification-2', true)];
    useNotificationStore.getState().hydrate(notifications);

    expect(clearTimeoutSpy).toHaveBeenCalledWith(123);
    expect(useNotificationStore.getState()).toMatchObject({
      notifications,
      unreadCount: 1,
      status: 'ready',
      error: null,
    });
    clearTimeoutSpy.mockRestore();
  });
});
