import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useFestivalBootstrapEffect, useMapBootstrapEffect } from '../../src/hooks/app-bootstrap/useAppBootstrapEffects';
import { useAppBootstrapLifecycle } from '../../src/hooks/app-bootstrap/useAppBootstrapLifecycle';

const bootstrapMocks = vi.hoisted(() => ({
  bootstrapFestivalLoader: vi.fn(),
  bootstrapMapSession: vi.fn(),
  clearAuthQueryParams: vi.fn(),
  useAppTabWarmup: vi.fn(),
  useSelectedPlaceReviewSync: vi.fn(),
}));

vi.mock('../../src/hooks/app-bootstrap/bootstrapFestivalLoader', () => ({
  bootstrapFestivalLoader: bootstrapMocks.bootstrapFestivalLoader,
}));
vi.mock('../../src/hooks/app-bootstrap/bootstrapMapSession', () => ({
  bootstrapMapSession: bootstrapMocks.bootstrapMapSession,
}));
vi.mock('../../src/hooks/app-route/useAppRouteState', () => ({
  clearAuthQueryParams: bootstrapMocks.clearAuthQueryParams,
}));
vi.mock('../../src/hooks/app-tab-loaders/useAppTabWarmup', () => ({
  useAppTabWarmup: bootstrapMocks.useAppTabWarmup,
}));
vi.mock('../../src/hooks/useSelectedPlaceReviewSync', () => ({
  useSelectedPlaceReviewSync: bootstrapMocks.useSelectedPlaceReviewSync,
}));

function sharedRefs() {
  return {
    formatErrorMessageRef: { current: (error: unknown) => (error instanceof Error ? error.message : 'error') },
    goToTabRef: { current: vi.fn() },
    refreshMyPageForUserRef: { current: vi.fn() },
    reportBackgroundErrorRef: { current: vi.fn() },
    resetReviewCachesRef: { current: vi.fn() },
  };
}

function mapEffectParams() {
  return {
    ...sharedRefs(),
    setBootstrapError: vi.fn(),
    setBootstrapStatus: vi.fn(),
    setFeedHasMore: vi.fn(),
    setFeedLoadingMore: vi.fn(),
    setFeedNextCursor: vi.fn(),
    setHasRealData: vi.fn(),
    setMyCommentsHasMore: vi.fn(),
    setMyCommentsLoadedOnce: vi.fn(),
    setMyCommentsLoadingMore: vi.fn(),
    setMyCommentsNextCursor: vi.fn(),
    setMyPage: vi.fn(),
    setNotice: vi.fn(),
    setPlaces: vi.fn(),
    setProviders: vi.fn(),
    setSelectedFestivalId: vi.fn(),
    setSelectedPlaceId: vi.fn(),
    setSessionUser: vi.fn(),
    setStampState: vi.fn(),
  };
}

describe('app bootstrap effects', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState(null, '', '/?auth=kakao-success');
  });

  it('runs the map bootstrap session and finalizes auth query cleanup', async () => {
    bootstrapMocks.bootstrapMapSession.mockResolvedValue(undefined);
    const params = mapEffectParams();

    renderHook(() => useMapBootstrapEffect(params));

    await waitFor(() => expect(params.setBootstrapStatus).toHaveBeenLastCalledWith('ready'));
    expect(params.setBootstrapStatus).toHaveBeenCalledWith('loading');
    expect(params.setBootstrapError).toHaveBeenCalledWith(null);
    expect(bootstrapMocks.bootstrapMapSession).toHaveBeenCalledWith(expect.objectContaining({
      authState: 'kakao-success',
      setPlaces: params.setPlaces,
      setSessionUser: params.setSessionUser,
      isActive: expect.any(Function),
    }));
    expect(bootstrapMocks.clearAuthQueryParams).toHaveBeenCalled();
  });

  it('maps bootstrap errors through the provided formatter', async () => {
    bootstrapMocks.bootstrapMapSession.mockRejectedValue(new Error('bootstrap failed'));
    const params = mapEffectParams();

    renderHook(() => useMapBootstrapEffect(params));

    await waitFor(() => expect(params.setBootstrapStatus).toHaveBeenLastCalledWith('error'));
    expect(params.setBootstrapError).toHaveBeenCalledWith('bootstrap failed');
    expect(bootstrapMocks.clearAuthQueryParams).toHaveBeenCalled();
  });

  it('loads festivals and reports background failures without blocking app bootstrap', async () => {
    const reportBackgroundErrorRef = { current: vi.fn() };
    bootstrapMocks.bootstrapFestivalLoader.mockRejectedValue(new Error('festival failed'));

    renderHook(() => useFestivalBootstrapEffect({
      reportBackgroundErrorRef,
      setFestivals: vi.fn(),
      setSelectedFestivalId: vi.fn(),
    }));

    await waitFor(() => expect(reportBackgroundErrorRef.current).toHaveBeenCalledWith(expect.any(Error)));
  });
});

describe('app bootstrap lifecycle composition', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    bootstrapMocks.bootstrapMapSession.mockResolvedValue(undefined);
    bootstrapMocks.bootstrapFestivalLoader.mockResolvedValue(undefined);
  });

  it('wires selected-place sync, tab warmup, store bindings, and bootstrap effects', async () => {
    const params = {
      activeTab: 'my' as const,
      adminSummary: null,
      communityRouteSort: 'latest' as const,
      ensureFeedReviews: vi.fn(),
      fetchCommunityRoutes: vi.fn(),
      formatErrorMessage: vi.fn((error: unknown) => String(error)),
      goToTab: vi.fn(),
      loadMoreMyComments: vi.fn(),
      myCommentsLoadedOnce: false,
      myPage: null,
      myPageTab: 'comments',
      placeReviewsCacheRef: { current: {} },
      refreshAdminSummary: vi.fn(),
      refreshMyPageForUser: vi.fn(),
      reportBackgroundError: vi.fn(),
      resetReviewCaches: vi.fn(),
      selectedPlaceId: 'place-1',
      sessionUser: null,
      setFestivals: vi.fn(),
      setHasRealData: vi.fn(),
      setMyPage: vi.fn(),
      setPlaces: vi.fn(),
      setSelectedPlaceReviews: vi.fn(),
      setStampState: vi.fn(),
    };

    renderHook(() => useAppBootstrapLifecycle(params));

    expect(bootstrapMocks.useSelectedPlaceReviewSync).toHaveBeenCalledWith(expect.objectContaining({
      activeTab: 'my',
      selectedPlaceId: 'place-1',
      setSelectedPlaceReviews: params.setSelectedPlaceReviews,
    }));
    expect(bootstrapMocks.useAppTabWarmup).toHaveBeenCalledWith(expect.objectContaining({
      activeTab: 'my',
      myPageTab: 'comments',
      ensureFeedReviews: params.ensureFeedReviews,
      loadMoreMyComments: params.loadMoreMyComments,
    }));
    await waitFor(() => expect(bootstrapMocks.bootstrapMapSession).toHaveBeenCalled());
    expect(bootstrapMocks.bootstrapFestivalLoader).toHaveBeenCalled();
  });
});
