import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { Dispatch, SetStateAction } from 'react';
import type { Place } from '../../src/types/core';
import type { SessionUser } from '../../src/types/auth';
import type { MyPageResponse } from '../../src/types/my-page';
import type { AdminSummaryResponse } from '../../src/types/admin';
import type { Review, StampState } from '../../src/types/review';
import { useAppShellRuntimeStore } from '../../src/store/app-shell-runtime-store';
import { useAppPageRuntimeStore } from '../../src/store/app-page-runtime-store';
import { useAuthStore } from '../../src/store/auth-store';
import { useAppAdminActions } from '../../src/hooks/useAppAdminActions';
import { useAppMapActions } from '../../src/hooks/useAppMapActions';
import { useAppAuthActions } from '../../src/hooks/useAppAuthActions';
import { useAppFeedbackEffects } from '../../src/hooks/useAppFeedbackEffects';
import { useNotificationLifecycle } from '../../src/hooks/useNotificationLifecycle';
import { useSelectedPlaceReviewSync } from '../../src/hooks/useSelectedPlaceReviewSync';

const apiMocks = vi.hoisted(() => ({
  importPublicData: vi.fn(),
  updatePlaceVisibility: vi.fn(),
  getFestivals: vi.fn(),
  getMapBootstrap: vi.fn(),
  claimStamp: vi.fn(),
  getCurrentDevicePosition: vi.fn(),
  getProviderLoginUrl: vi.fn(),
  logout: vi.fn(),
  updateProfile: vi.fn(),
  getReviews: vi.fn(),
}));

vi.mock('../../src/api/adminClient', () => ({
  importPublicData: apiMocks.importPublicData,
  updatePlaceVisibility: apiMocks.updatePlaceVisibility,
}));

vi.mock('../../src/api/bootstrapClient', () => ({
  getFestivals: apiMocks.getFestivals,
  getMapBootstrap: apiMocks.getMapBootstrap,
}));

vi.mock('../../src/api/stampClient', () => ({
  claimStamp: apiMocks.claimStamp,
}));

vi.mock('../../src/lib/geolocation', () => ({
  getCurrentDevicePosition: apiMocks.getCurrentDevicePosition,
}));

vi.mock('../../src/api/authClient', () => ({
  getProviderLoginUrl: apiMocks.getProviderLoginUrl,
  logout: apiMocks.logout,
  updateProfile: apiMocks.updateProfile,
}));

vi.mock('../../src/api/reviewsClient', () => ({
  getReviews: apiMocks.getReviews,
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

const adminUser: SessionUser = {
  ...sessionUser,
  id: 'admin-1',
  isAdmin: true,
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
    imageUrl: null,
    latitude: 36.35,
    longitude: 127.38,
    summary: 'summary',
    description: 'description',
    vibeTags: [],
    visitTime: '1h',
    routeHint: 'hint',
    stampReward: 'reward',
    heroLabel: 'hero',
    totalVisitCount: 1,
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

function emptyStampState(): StampState {
  return {
    collectedPlaceIds: [],
    logs: [],
    travelSessions: [],
  };
}

function emptyMyPage(overrides: Partial<MyPageResponse> = {}): MyPageResponse {
  return {
    user: sessionUser,
    stats: {
      stampCount: 0,
      reviewCount: 0,
      commentCount: 0,
      routeCount: 0,
      visitedPlaceCount: 0,
      collectedPlaceCount: 0,
    },
    reviews: [],
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

function resetRuntimeStores() {
  useAppShellRuntimeStore.setState({
    bootstrapStatus: 'idle',
    bootstrapError: null,
    notice: null,
    currentPosition: null,
    mapLocationStatus: 'idle',
    mapLocationMessage: null,
    mapLocationFocusKey: 0,
    stampActionStatus: 'idle',
    stampActionMessage: '',
  });
  useAppPageRuntimeStore.setState({
    profileSaving: false,
    profileError: null,
    isLoggingOut: false,
  });
  useAuthStore.setState({
    sessionUser: null,
    providers: [],
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  resetRuntimeStores();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  resetRuntimeStores();
});

describe('admin and map action hooks', () => {
  test('admin actions ignore non-admin users and synchronize map data after visibility updates', async () => {
    const setAdminBusyPlaceId = vi.fn();
    const setAdminSummary = vi.fn();
    const setPlaces = vi.fn();
    const setStampState = vi.fn();
    const setHasRealData = vi.fn();
    const setAdminLoading = vi.fn();
    const setFestivals = vi.fn();
    const updatedPlace = { id: 'place-1', isActive: false };
    apiMocks.updatePlaceVisibility.mockResolvedValue(updatedPlace);
    apiMocks.getMapBootstrap.mockResolvedValue({
      places: [placeFixture()],
      stamps: emptyStampState(),
      hasRealData: true,
    });

    const nonAdmin = renderHook(() => useAppAdminActions({
      sessionUser,
      setAdminBusyPlaceId,
      setAdminSummary,
      setPlaces,
      setStampState,
      setHasRealData,
      setAdminLoading,
      setFestivals,
      refreshAdminSummary: vi.fn(),
      formatErrorMessage: (error) => error instanceof Error ? error.message : 'error',
    }));

    await act(async () => {
      await nonAdmin.result.current.handleToggleAdminPlace('place-1', false);
    });
    expect(apiMocks.updatePlaceVisibility).not.toHaveBeenCalled();

    const admin = renderHook(() => useAppAdminActions({
      sessionUser: adminUser,
      setAdminBusyPlaceId,
      setAdminSummary,
      setPlaces,
      setStampState,
      setHasRealData,
      setAdminLoading,
      setFestivals,
      refreshAdminSummary: vi.fn(),
      formatErrorMessage: (error) => error instanceof Error ? error.message : 'error',
    }));

    await act(async () => {
      await admin.result.current.handleToggleAdminPlace('place-1', false);
    });

    expect(setAdminBusyPlaceId).toHaveBeenNthCalledWith(1, 'place-1');
    expect(apiMocks.updatePlaceVisibility).toHaveBeenCalledWith('place-1', { isActive: false });
    expect(setAdminSummary).toHaveBeenCalledWith(expect.any(Function));
    const currentSummary: AdminSummaryResponse = {
      userCount: 1,
      placeCount: 2,
      reviewCount: 0,
      commentCount: 0,
      stampCount: 0,
      sourceReady: true,
      places: [placeFixture(), placeFixture({ id: 'place-2' })],
    };
    const updateSummary = setAdminSummary.mock.calls.at(-1)?.[0] as (current: AdminSummaryResponse | null) => AdminSummaryResponse | null;
    expect(updateSummary(null)).toBeNull();
    expect(updateSummary(currentSummary)).toMatchObject({
      places: [updatedPlace, expect.objectContaining({ id: 'place-2' })],
    });
    expect(setPlaces).toHaveBeenCalledWith([expect.objectContaining({ id: 'place-1' })]);
    expect(setStampState).toHaveBeenCalledWith(emptyStampState());
    expect(setHasRealData).toHaveBeenCalledWith(true);
    expect(setAdminBusyPlaceId).toHaveBeenLastCalledWith(null);
    expect(useAppShellRuntimeStore.getState().notice).not.toBeNull();
  });

  test('admin visibility failures report formatted errors and clear busy state', async () => {
    const setAdminBusyPlaceId = vi.fn();
    apiMocks.updatePlaceVisibility.mockRejectedValueOnce(new Error('visibility failed'));
    const { result } = renderHook(() => useAppAdminActions({
      sessionUser: adminUser,
      setAdminBusyPlaceId,
      setAdminSummary: vi.fn(),
      setPlaces: vi.fn(),
      setStampState: vi.fn(),
      setHasRealData: vi.fn(),
      setAdminLoading: vi.fn(),
      setFestivals: vi.fn(),
      refreshAdminSummary: vi.fn(),
      formatErrorMessage: (error) => error instanceof Error ? error.message : 'error',
    }));

    await act(async () => {
      await result.current.handleToggleAdminPlace('place-1', true);
    });

    expect(apiMocks.updatePlaceVisibility).toHaveBeenCalledWith('place-1', { isActive: true });
    expect(useAppShellRuntimeStore.getState().notice).toBe('visibility failed');
    expect(setAdminBusyPlaceId).toHaveBeenLastCalledWith(null);
  });

  test('admin import refreshes summary, map bootstrap, and festival cache without blocking import completion', async () => {
    const setAdminLoading = vi.fn();
    const setAdminSummary = vi.fn();
    const setPlaces = vi.fn();
    const setStampState = vi.fn();
    const setHasRealData = vi.fn();
    const setFestivals = vi.fn();
    const nextSummary = {
      userCount: 1,
      placeCount: 1,
      reviewCount: 0,
      commentCount: 0,
      stampCount: 0,
      sourceReady: true,
      places: [],
    };
    apiMocks.importPublicData.mockResolvedValue({ importedPlaces: 1 });
    apiMocks.getMapBootstrap.mockResolvedValue({ places: [placeFixture()], stamps: emptyStampState(), hasRealData: true });
    apiMocks.getFestivals.mockResolvedValue([{ id: 'festival-1' }]);

    const { result } = renderHook(() => useAppAdminActions({
      sessionUser: adminUser,
      setAdminBusyPlaceId: vi.fn(),
      setAdminSummary,
      setPlaces,
      setStampState,
      setHasRealData,
      setAdminLoading,
      setFestivals,
      refreshAdminSummary: vi.fn().mockResolvedValue(nextSummary),
      formatErrorMessage: (error) => error instanceof Error ? error.message : 'error',
    }));

    await act(async () => {
      await result.current.handleRefreshAdminImport();
    });

    expect(setAdminLoading).toHaveBeenNthCalledWith(1, true);
    expect(setAdminSummary).toHaveBeenCalledWith(nextSummary);
    expect(setPlaces).toHaveBeenCalledWith([expect.objectContaining({ id: 'place-1' })]);
    expect(setStampState).toHaveBeenCalledWith(emptyStampState());
    expect(setHasRealData).toHaveBeenCalledWith(true);
    expect(setAdminLoading).toHaveBeenLastCalledWith(false);
    await waitFor(() => expect(setFestivals).toHaveBeenCalledWith([{ id: 'festival-1' }]));
  });

  test('admin import ignores non-admin users, reports failures, and tolerates festival refresh errors', async () => {
    const nonAdminLoading = vi.fn();
    const nonAdmin = renderHook(() => useAppAdminActions({
      sessionUser,
      setAdminBusyPlaceId: vi.fn(),
      setAdminSummary: vi.fn(),
      setPlaces: vi.fn(),
      setStampState: vi.fn(),
      setHasRealData: vi.fn(),
      setAdminLoading: nonAdminLoading,
      setFestivals: vi.fn(),
      refreshAdminSummary: vi.fn(),
      formatErrorMessage: (error) => error instanceof Error ? error.message : 'error',
    }));

    await act(async () => {
      await nonAdmin.result.current.handleRefreshAdminImport();
    });

    expect(apiMocks.importPublicData).not.toHaveBeenCalled();
    expect(nonAdminLoading).not.toHaveBeenCalled();

    apiMocks.importPublicData.mockRejectedValueOnce(new Error('import failed'));
    const setAdminLoading = vi.fn();
    const failingImport = renderHook(() => useAppAdminActions({
      sessionUser: adminUser,
      setAdminBusyPlaceId: vi.fn(),
      setAdminSummary: vi.fn(),
      setPlaces: vi.fn(),
      setStampState: vi.fn(),
      setHasRealData: vi.fn(),
      setAdminLoading,
      setFestivals: vi.fn(),
      refreshAdminSummary: vi.fn(),
      formatErrorMessage: (error) => error instanceof Error ? error.message : 'error',
    }));

    await act(async () => {
      await failingImport.result.current.handleRefreshAdminImport();
    });

    expect(useAppShellRuntimeStore.getState().notice).toBe('import failed');
    expect(setAdminLoading).toHaveBeenLastCalledWith(false);

    apiMocks.importPublicData.mockResolvedValueOnce({ importedPlaces: 1 });
    apiMocks.getMapBootstrap.mockResolvedValueOnce({ places: [], stamps: emptyStampState(), hasRealData: false });
    apiMocks.getFestivals.mockRejectedValueOnce(new Error('festival refresh failed'));
    const setFestivals = vi.fn();
    const successfulImport = renderHook(() => useAppAdminActions({
      sessionUser: adminUser,
      setAdminBusyPlaceId: vi.fn(),
      setAdminSummary: vi.fn(),
      setPlaces: vi.fn(),
      setStampState: vi.fn(),
      setHasRealData: vi.fn(),
      setAdminLoading: vi.fn(),
      setFestivals,
      refreshAdminSummary: vi.fn().mockResolvedValue(null),
      formatErrorMessage: (error) => error instanceof Error ? error.message : 'error',
    }));

    await act(async () => {
      await successfulImport.result.current.handleRefreshAdminImport();
    });

    await Promise.resolve();
    expect(setFestivals).not.toHaveBeenCalled();
    expect(useAppShellRuntimeStore.getState().notice).not.toBe('festival refresh failed');
  });

  test('admin manual override updates summary and reports failures without leaking busy state', async () => {
    const setAdminBusyPlaceId = vi.fn();
    const setAdminSummary = vi.fn();
    apiMocks.updatePlaceVisibility
      .mockResolvedValueOnce({ id: 'place-1', isManualOverride: true })
      .mockRejectedValueOnce(new Error('admin failed'));
    const { result } = renderHook(() => useAppAdminActions({
      sessionUser: adminUser,
      setAdminBusyPlaceId,
      setAdminSummary,
      setPlaces: vi.fn(),
      setStampState: vi.fn(),
      setHasRealData: vi.fn(),
      setAdminLoading: vi.fn(),
      setFestivals: vi.fn(),
      refreshAdminSummary: vi.fn(),
      formatErrorMessage: (error) => error instanceof Error ? error.message : 'error',
    }));

    await act(async () => {
      await result.current.handleToggleAdminManualOverride('place-1', true);
    });
    expect(apiMocks.updatePlaceVisibility).toHaveBeenCalledWith('place-1', { isManualOverride: true });
    expect(setAdminSummary).toHaveBeenCalledWith(expect.any(Function));
    const updateSummary = setAdminSummary.mock.calls.at(-1)?.[0] as (current: AdminSummaryResponse | null) => AdminSummaryResponse | null;
    expect(updateSummary(null)).toBeNull();
    expect(updateSummary({
      userCount: 1,
      placeCount: 2,
      reviewCount: 0,
      commentCount: 0,
      stampCount: 0,
      sourceReady: true,
      places: [placeFixture(), placeFixture({ id: 'place-2' })],
    })).toMatchObject({
      places: [expect.objectContaining({ isManualOverride: true }), expect.objectContaining({ id: 'place-2' })],
    });
    expect(useAppShellRuntimeStore.getState().notice).not.toBeNull();

    await act(async () => {
      await result.current.handleToggleAdminManualOverride('place-1', false);
    });
    expect(useAppShellRuntimeStore.getState().notice).toBe('admin failed');
    expect(setAdminBusyPlaceId).toHaveBeenLastCalledWith(null);
  });

  test('map actions handle unauthenticated stamp attempts and successful stamp claims', async () => {
    const place = placeFixture();
    const setPlaces = vi.fn() as Dispatch<SetStateAction<Place[]>>;
    const setStampState = vi.fn() as Dispatch<SetStateAction<StampState>>;
    const goToTab = vi.fn();
    const commitRouteState = vi.fn();
    const refreshMyPageForUser = vi.fn().mockResolvedValue(null);
    const nextStampState = emptyStampState();
    apiMocks.getCurrentDevicePosition.mockResolvedValue({ latitude: 36.35, longitude: 127.38, accuracyMeters: 8 });
    apiMocks.claimStamp.mockResolvedValue(nextStampState);

    const unauthenticated = renderHook(() => useAppMapActions({
      sessionUser: null,
      setPlaces,
      setStampState,
      goToTab,
      commitRouteState,
      refreshMyPageForUser,
      formatErrorMessage: (error) => error instanceof Error ? error.message : 'error',
    }));

    await act(async () => {
      await unauthenticated.result.current.handleClaimStamp(place);
    });
    expect(goToTab).toHaveBeenCalledWith('my');
    expect(apiMocks.claimStamp).not.toHaveBeenCalled();

    const authenticated = renderHook(() => useAppMapActions({
      sessionUser,
      setPlaces,
      setStampState,
      goToTab,
      commitRouteState,
      refreshMyPageForUser,
      formatErrorMessage: (error) => error instanceof Error ? error.message : 'error',
    }));

    await act(async () => {
      await authenticated.result.current.handleClaimStamp(place);
    });

    expect(apiMocks.claimStamp).toHaveBeenCalledWith({ placeId: 'place-1', latitude: 36.35, longitude: 127.38 });
    expect(setStampState).toHaveBeenCalledWith(nextStampState);
    expect(setPlaces).toHaveBeenCalledWith(expect.any(Function));
    expect(commitRouteState).toHaveBeenCalledWith(
      { tab: 'map', placeId: 'place-1', festivalId: null, drawerState: 'full' },
      'replace',
    );
    expect(refreshMyPageForUser).toHaveBeenCalledWith(sessionUser);
    expect(useAppShellRuntimeStore.getState().stampActionStatus).toBe('ready');
  });

  test('map actions refresh current position success and failure states', async () => {
    apiMocks.getCurrentDevicePosition
      .mockResolvedValueOnce({ latitude: 36.35, longitude: 127.38, accuracyMeters: 42 })
      .mockRejectedValueOnce(new Error('position failed'));
    const { result } = renderHook(() => useAppMapActions({
      sessionUser,
      setPlaces: vi.fn(),
      setStampState: vi.fn(),
      goToTab: vi.fn(),
      commitRouteState: vi.fn(),
      refreshMyPageForUser: vi.fn().mockResolvedValue(null),
      formatErrorMessage: (error) => error instanceof Error ? error.message : 'error',
    }));

    await act(async () => {
      await result.current.refreshCurrentPosition(true);
    });
    expect(useAppShellRuntimeStore.getState()).toMatchObject({
      currentPosition: { latitude: 36.35, longitude: 127.38 },
      mapLocationStatus: 'ready',
      mapLocationFocusKey: 1,
    });
    expect(useAppShellRuntimeStore.getState().mapLocationMessage).toContain('42m');

    await act(async () => {
      await result.current.refreshCurrentPosition(false);
    });
    expect(useAppShellRuntimeStore.getState()).toMatchObject({
      currentPosition: null,
      mapLocationStatus: 'error',
      mapLocationMessage: 'position failed',
      mapLocationFocusKey: 1,
    });
  });

  test('map stamp failures surface a notice and reset the action status', async () => {
    apiMocks.getCurrentDevicePosition.mockResolvedValue({ latitude: 36.35, longitude: 127.38, accuracyMeters: 8 });
    apiMocks.claimStamp.mockRejectedValue(new Error('stamp failed'));
    const { result } = renderHook(() => useAppMapActions({
      sessionUser,
      setPlaces: vi.fn(),
      setStampState: vi.fn(),
      goToTab: vi.fn(),
      commitRouteState: vi.fn(),
      refreshMyPageForUser: vi.fn().mockResolvedValue(null),
      formatErrorMessage: (error) => error instanceof Error ? error.message : 'error',
    }));

    await act(async () => {
      await result.current.handleClaimStamp(placeFixture());
    });

    expect(useAppShellRuntimeStore.getState().notice).toBe('stamp failed');
    expect(useAppShellRuntimeStore.getState().stampActionStatus).toBe('ready');
  });
});

describe('auth and feedback hooks', () => {
  test('auth actions validate profile input, update profile state, and clear data on logout', async () => {
    const setMyPage = vi.fn();
    const updatedUser = { ...sessionUser, nickname: 'next' };
    apiMocks.updateProfile.mockResolvedValue({ user: updatedUser, providers: [] });
    apiMocks.logout.mockResolvedValue({ user: null, providers: [{ key: 'kakao', label: 'Kakao', isEnabled: true, loginUrl: '/login' }] });

    const { result } = renderHook(() => useAppAuthActions({
      setMyPage,
      formatErrorMessage: (error) => error instanceof Error ? error.message : 'error',
    }));

    await act(async () => {
      await result.current.handleUpdateProfile('a');
    });
    expect(useAppPageRuntimeStore.getState().profileError).not.toBeNull();
    expect(apiMocks.updateProfile).not.toHaveBeenCalled();

    await act(async () => {
      await result.current.handleUpdateProfile('next');
    });
    expect(useAuthStore.getState().sessionUser).toEqual(updatedUser);
    expect(useAppPageRuntimeStore.getState().profileSaving).toBe(false);

    await act(async () => {
      await result.current.handleLogout();
    });
    expect(useAuthStore.getState().sessionUser).toBeNull();
    expect(setMyPage).toHaveBeenLastCalledWith(null);
    expect(useAppPageRuntimeStore.getState().isLoggingOut).toBe(false);
  });

  test('auth actions handle nullable profile responses and logout failures', async () => {
    const setMyPage = vi.fn();
    apiMocks.updateProfile.mockResolvedValueOnce({ user: null, providers: [] });
    apiMocks.updateProfile.mockRejectedValueOnce(new Error('profile failed'));
    apiMocks.logout.mockRejectedValueOnce(new Error('logout failed'));
    const { result } = renderHook(() => useAppAuthActions({
      setMyPage,
      formatErrorMessage: (error) => error instanceof Error ? error.message : 'error',
    }));

    await act(async () => {
      await result.current.handleUpdateProfile('valid');
    });
    expect(useAuthStore.getState().sessionUser).toBeNull();
    expect(setMyPage).not.toHaveBeenCalled();

    await act(async () => {
      await result.current.handleUpdateProfile('valid-again');
    });
    expect(useAppPageRuntimeStore.getState().profileError).toBe('profile failed');
    expect(useAppPageRuntimeStore.getState().profileSaving).toBe(false);

    await act(async () => {
      await result.current.handleLogout();
    });
    expect(useAppShellRuntimeStore.getState().notice).toBe('logout failed');
    expect(useAppPageRuntimeStore.getState().isLoggingOut).toBe(false);
  });

  test('feedback effects derive stamp guidance and auto-dismiss transient messages', () => {
    vi.useFakeTimers();
    useAppShellRuntimeStore.getState().setNotice('notice');
    useAppShellRuntimeStore.getState().setMapLocationMessage('location');

    renderHook(() => useAppFeedbackEffects({
      selectedPlace: placeFixture({ name: 'Place 1' }),
      selectedPlaceDistanceMeters: 20,
      sessionUser,
      todayStamp: null,
      notice: 'notice',
      mapLocationMessage: 'location',
      stampUnlockRadiusMeters: 100,
      noticeDismissDelayMs: 50,
    }));

    expect(useAppShellRuntimeStore.getState().stampActionMessage).toContain('20m');

    act(() => {
      vi.advanceTimersByTime(50);
    });

    expect(useAppShellRuntimeStore.getState().notice).toBeNull();
    expect(useAppShellRuntimeStore.getState().mapLocationMessage).toBeNull();
  });

  test('feedback effects cover stamp guidance branches and timer cleanup', () => {
    vi.useFakeTimers();
    const { rerender, unmount } = renderHook(
      (props: Parameters<typeof useAppFeedbackEffects>[0]) => useAppFeedbackEffects(props),
      {
        initialProps: {
          selectedPlace: null,
          selectedPlaceDistanceMeters: null,
          sessionUser,
          todayStamp: null,
          notice: null,
          mapLocationMessage: null,
          stampUnlockRadiusMeters: 100,
          noticeDismissDelayMs: 50,
        },
      },
    );

    expect(useAppShellRuntimeStore.getState().stampActionMessage).not.toBeNull();

    rerender({
      selectedPlace: placeFixture({ name: 'Place 1' }),
      selectedPlaceDistanceMeters: null,
      sessionUser: null,
      todayStamp: null,
      notice: null,
      mapLocationMessage: null,
      stampUnlockRadiusMeters: 100,
      noticeDismissDelayMs: 50,
    });
    expect(useAppShellRuntimeStore.getState().stampActionMessage).toContain('Place 1');

    rerender({
      selectedPlace: placeFixture({ name: 'Place 1' }),
      selectedPlaceDistanceMeters: null,
      sessionUser,
      todayStamp: { id: 'stamp-1', placeId: 'place-1', placeName: 'Place 1', stampedAt: '2026-05-14', visitNumber: 2, visitLabel: '2회차', travelSessionId: null, travelSessionStampCount: 0 },
      notice: null,
      mapLocationMessage: null,
      stampUnlockRadiusMeters: 100,
      noticeDismissDelayMs: 50,
    });
    expect(useAppShellRuntimeStore.getState().stampActionMessage).toContain('2회차');

    rerender({
      selectedPlace: placeFixture({ name: 'Place 1' }),
      selectedPlaceDistanceMeters: null,
      sessionUser,
      todayStamp: null,
      notice: null,
      mapLocationMessage: null,
      stampUnlockRadiusMeters: 100,
      noticeDismissDelayMs: 50,
    });
    expect(useAppShellRuntimeStore.getState().stampActionMessage).not.toBeNull();

    useAppShellRuntimeStore.getState().setNotice('sticky');
    useAppShellRuntimeStore.getState().setMapLocationMessage('map');
    rerender({
      selectedPlace: placeFixture({ name: 'Place 1' }),
      selectedPlaceDistanceMeters: 150,
      sessionUser,
      todayStamp: null,
      notice: 'sticky',
      mapLocationMessage: 'map',
      stampUnlockRadiusMeters: 100,
      noticeDismissDelayMs: 50,
    });
    expect(useAppShellRuntimeStore.getState().stampActionMessage).toContain('150m');

    unmount();
    act(() => {
      vi.advanceTimersByTime(50);
    });

    expect(useAppShellRuntimeStore.getState().notice).not.toBeNull();
    expect(useAppShellRuntimeStore.getState().mapLocationMessage).not.toBeNull();
  });
});

describe('notification and selected-place review effects', () => {
  test('notification lifecycle connects, fetches missing my page data, hydrates, and disconnects on cleanup', () => {
    const fetchNotifications = vi.fn().mockResolvedValue(undefined);
    const connectNotifications = vi.fn();
    const disconnectNotifications = vi.fn();
    const hydrateNotifications = vi.fn();

    const { rerender, unmount } = renderHook(
      ({ user, myPage }) => useNotificationLifecycle({
        sessionUser: user,
        myPage,
        fetchNotifications,
        connectNotifications,
        disconnectNotifications,
        hydrateNotifications,
      }),
      { initialProps: { user: sessionUser as SessionUser | null, myPage: null as MyPageResponse | null } },
    );

    expect(connectNotifications).toHaveBeenCalledWith(sessionUser);
    expect(fetchNotifications).toHaveBeenCalled();

    const myPage = emptyMyPage({ notifications: [{ id: 'notification-1' }], unreadNotificationCount: 1 });
    rerender({ user: sessionUser, myPage });
    expect(hydrateNotifications).toHaveBeenCalledWith(myPage.notifications, 1);

    unmount();
    expect(disconnectNotifications).toHaveBeenCalled();
  });

  test('selected place review sync uses cache, fetches missing place reviews, and reports background errors', async () => {
    const cachedReview = reviewFixture({ id: 'cached-review' });
    const loadedReview = reviewFixture({ id: 'loaded-review' });
    const placeReviewsCacheRef = { current: { 'cached-place': [cachedReview] } };
    const setSelectedPlaceReviews = vi.fn();
    const reportBackgroundError = vi.fn();
    apiMocks.getReviews.mockResolvedValue([loadedReview]);

    const { rerender } = renderHook(
      ({ activeTab, placeId }) => useSelectedPlaceReviewSync({
        activeTab,
        selectedPlaceId: placeId,
        placeReviewsCacheRef,
        setSelectedPlaceReviews,
        reportBackgroundError,
      }),
      { initialProps: { activeTab: 'feed' as const, placeId: null as string | null } },
    );

    expect(setSelectedPlaceReviews).toHaveBeenCalledWith([]);

    rerender({ activeTab: 'map', placeId: 'cached-place' });
    expect(setSelectedPlaceReviews).toHaveBeenLastCalledWith([cachedReview]);

    rerender({ activeTab: 'map', placeId: 'place-1' });
    await waitFor(() => expect(setSelectedPlaceReviews).toHaveBeenLastCalledWith([expect.objectContaining({ id: 'loaded-review' })]));
    expect(placeReviewsCacheRef.current['place-1']).toEqual([expect.objectContaining({ id: 'loaded-review' })]);

    apiMocks.getReviews.mockRejectedValueOnce(new Error('network'));
    rerender({ activeTab: 'map', placeId: 'place-2' });
    await waitFor(() => expect(reportBackgroundError).toHaveBeenCalledWith(expect.any(Error)));
  });
});
