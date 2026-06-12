import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAppRouteActions } from '../../src/hooks/app-route/useAppRouteActions';
import { useAppRouteActionStoreBindings } from '../../src/hooks/app-route/useAppRouteActionStoreBindings';
import { useAppRouteState } from '../../src/hooks/app-route/useAppRouteState';
import { useAppTabDataLoaders } from '../../src/hooks/app-tab-loaders/useAppTabDataLoaders';
import { useAppTabLoaderBindings } from '../../src/hooks/app-tab-loaders/useAppTabLoaderBindings';
import { useAppMapStore } from '../../src/store/app-map-store';
import { useAppPageRuntimeStore } from '../../src/store/app-page-runtime-store';
import { useAppRouteStore } from '../../src/store/app-route-store';
import { useAppShellRuntimeStore } from '../../src/store/app-shell-runtime-store';
import { useAuthStore } from '../../src/store/auth-store';
import { useMyPageStore } from '../../src/store/my-page-store';

const loaderMocks = vi.hoisted(() => ({
  communityRouteLoader: vi.fn(),
  createAdminSummaryLoader: vi.fn(),
  createCommunityRouteLoader: vi.fn(),
  createFeedReviewLoader: vi.fn(),
  createMyPageSummaryLoader: vi.fn(),
  feedReviewLoader: vi.fn(),
  publishRouteHandler: vi.fn(),
  toggleRouteLikeHandler: vi.fn(),
}));

vi.mock('../../src/hooks/app-tab-loaders/communityRouteLoader', () => ({
  createCommunityRouteLoader: loaderMocks.createCommunityRouteLoader,
}));
vi.mock('../../src/hooks/app-tab-loaders/feedReviewLoader', () => ({
  createFeedReviewLoader: loaderMocks.createFeedReviewLoader,
}));
vi.mock('../../src/hooks/app-tab-loaders/summaryLoaders', () => ({
  createAdminSummaryLoader: loaderMocks.createAdminSummaryLoader,
  createMyPageSummaryLoader: loaderMocks.createMyPageSummaryLoader,
}));
vi.mock('../../src/hooks/app-route-actions/publishRouteAction', () => ({
  createPublishRouteHandler: vi.fn(() => loaderMocks.publishRouteHandler),
}));
vi.mock('../../src/hooks/app-route-actions/routeLikeAction', () => ({
  createToggleRouteLikeHandler: vi.fn(() => loaderMocks.toggleRouteLikeHandler),
}));

function resetStores() {
  useAppRouteStore.setState({
    activeTab: 'map',
    drawerState: 'closed',
    selectedFestivalId: null,
    selectedPlaceId: null,
  });
  useAppMapStore.setState({ selectedRoutePreview: null });
  useAppPageRuntimeStore.setState({
    feedHasMore: false,
    feedLoadingMore: false,
    feedNextCursor: null,
    myPageError: null,
    routeError: null,
    routeLikeUpdatingId: null,
    routeSubmitting: false,
  });
  useAppShellRuntimeStore.setState({ notice: null });
  useAuthStore.setState({ sessionUser: null });
  useMyPageStore.setState({ myPageTab: 'feeds' });
}

describe('app route and loader hooks', () => {
  beforeEach(() => {
    resetStores();
    vi.clearAllMocks();
    window.history.replaceState(null, '', '/');
    loaderMocks.createCommunityRouteLoader.mockReturnValue(loaderMocks.communityRouteLoader);
    loaderMocks.createFeedReviewLoader.mockReturnValue(loaderMocks.feedReviewLoader);
    loaderMocks.createAdminSummaryLoader.mockReturnValue(vi.fn());
    loaderMocks.createMyPageSummaryLoader.mockReturnValue(vi.fn());
  });

  it('commits route state through tab, place, festival, and drawer helpers', () => {
    const { result } = renderHook(() => useAppRouteState());

    act(() => result.current.openPlace('place-1'));
    expect(useAppRouteStore.getState()).toMatchObject({
      activeTab: 'map',
      selectedPlaceId: 'place-1',
      selectedFestivalId: null,
      drawerState: 'partial',
    });

    act(() => result.current.openFestival('festival-1'));
    expect(useAppRouteStore.getState()).toMatchObject({
      selectedPlaceId: null,
      selectedFestivalId: 'festival-1',
      drawerState: 'partial',
    });

    act(() => result.current.goToTab('feed', 'replace'));
    expect(useAppRouteStore.getState()).toMatchObject({
      activeTab: 'feed',
      selectedPlaceId: null,
      selectedFestivalId: null,
      drawerState: 'closed',
    });

    act(() => result.current.closeDrawer());
    expect(useAppRouteStore.getState().drawerState).toBe('closed');
  });

  it('exposes route action and tab loader store bindings from their owner stores', () => {
    const sessionUser = { id: 'user-1', nickname: 'tester', email: null, provider: 'kakao', profileImage: null, isAdmin: false, profileCompletedAt: null };
    useAuthStore.setState({ sessionUser });
    const routeBindings = renderHook(() => useAppRouteActionStoreBindings());
    const loaderBindings = renderHook(() => useAppTabLoaderBindings());

    act(() => {
      routeBindings.result.current.setRouteSubmitting(true);
      routeBindings.result.current.setRouteError('route-error');
      routeBindings.result.current.setRouteLikeUpdatingId('route-1');
      routeBindings.result.current.setNotice('notice');
      routeBindings.result.current.setMyPageTab('routes');
      loaderBindings.result.current.setFeedHasMore(true);
      loaderBindings.result.current.setFeedNextCursor('cursor');
      loaderBindings.result.current.setMyPageError('my-error');
    });

    expect(routeBindings.result.current.sessionUser).toEqual(sessionUser);
    expect(useAppPageRuntimeStore.getState()).toMatchObject({
      feedHasMore: true,
      feedNextCursor: 'cursor',
      myPageError: 'my-error',
      routeError: 'route-error',
      routeLikeUpdatingId: 'route-1',
      routeSubmitting: true,
    });
    expect(useAppShellRuntimeStore.getState().notice).toBe('notice');
    expect(useMyPageStore.getState().myPageTab).toBe('routes');
  });

  it('builds tab data loaders and keeps curated course warmup idempotent', async () => {
    const setCourses = vi.fn((updater: (current: unknown[]) => unknown[]) => updater([]));
    const coursesLoadedRef = { current: false };
    const { result } = renderHook(() => useAppTabDataLoaders({
      activeTab: 'feed',
      adminSummary: null,
      communityRoutesCacheRef: { current: {} },
      coursesLoadedRef,
      feedLoadedRef: { current: false },
      myPage: null,
      replaceCommunityRoutes: vi.fn(),
      sessionUser: null,
      setAdminLoading: vi.fn(),
      setAdminSummary: vi.fn(),
      setCommunityRoutes: vi.fn(),
      setCourses,
      setMyPage: vi.fn(),
      setReviews: vi.fn(),
    }));

    expect(result.current.fetchCommunityRoutes).toBe(loaderMocks.communityRouteLoader);
    expect(result.current.ensureFeedReviews).toBe(loaderMocks.feedReviewLoader);
    await result.current.ensureCuratedCourses();
    await result.current.ensureCuratedCourses();
    await result.current.ensureCuratedCourses(true);

    expect(coursesLoadedRef.current).toBe(true);
    expect(setCourses).toHaveBeenCalledTimes(2);
  });

  it('wraps route mutation handlers with stable event callbacks', async () => {
    const { result, rerender } = renderHook(() => useAppRouteActions({
      communityRoutesCacheRef: { current: {} },
      formatErrorMessage: (error) => String(error),
      goToTab: vi.fn(),
      patchCommunityRoutes: vi.fn(),
      refreshMyPageForUser: vi.fn(),
      setMyPage: vi.fn(),
    }));
    const firstToggle = result.current.handleToggleRouteLike;
    const firstPublish = result.current.handlePublishRoute;

    rerender();
    await result.current.handleToggleRouteLike('route-1');
    await result.current.handlePublishRoute({
      travelSessionId: 'session-1',
      title: 'Route',
      description: 'description',
      mood: 'walk',
    });

    expect(result.current.handleToggleRouteLike).toBe(firstToggle);
    expect(result.current.handlePublishRoute).toBe(firstPublish);
    expect(loaderMocks.toggleRouteLikeHandler).toHaveBeenCalledWith('route-1');
    expect(loaderMocks.publishRouteHandler).toHaveBeenCalledWith({
      travelSessionId: 'session-1',
      title: 'Route',
      description: 'description',
      mood: 'walk',
    });
  });
});
