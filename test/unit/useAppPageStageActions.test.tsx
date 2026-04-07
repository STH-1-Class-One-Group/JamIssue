import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useAppPageStageActions } from '../../src/hooks/useAppPageStageActions';
import { sessionUserFixture } from '../fixtures/app-fixtures';

describe('useAppPageStageActions', () => {
  it('clears the feed place filter', () => {
    const setFeedPlaceFilterId = vi.fn();

    const { result } = renderHook(() => useAppPageStageActions({
      sessionUser: sessionUserFixture,
      setFeedPlaceFilterId,
      setCommunityRouteSort: vi.fn(),
      handleOpenCommentWithReturn: vi.fn(),
      fetchCommunityRoutes: vi.fn().mockResolvedValue(undefined),
      refreshMyPageForUser: vi.fn().mockResolvedValue(undefined),
      reportBackgroundError: vi.fn(),
    }));

    act(() => {
      result.current.handleClearPlaceFilter();
    });

    expect(setFeedPlaceFilterId).toHaveBeenCalledWith(null);
  });

  it('retries my-page only when a session user exists', async () => {
    const refreshMyPageForUser = vi.fn().mockResolvedValue(undefined);

    const { result, rerender } = renderHook(
      ({ sessionUser }) => useAppPageStageActions({
        sessionUser,
        setFeedPlaceFilterId: vi.fn(),
        setCommunityRouteSort: vi.fn(),
        handleOpenCommentWithReturn: vi.fn(),
        fetchCommunityRoutes: vi.fn().mockResolvedValue(undefined),
        refreshMyPageForUser,
        reportBackgroundError: vi.fn(),
      }),
      { initialProps: { sessionUser: null as typeof sessionUserFixture | null } },
    );

    await act(async () => {
      await result.current.handleRetryMyPage();
    });
    expect(refreshMyPageForUser).not.toHaveBeenCalled();

    rerender({ sessionUser: sessionUserFixture });
    await act(async () => {
      await result.current.handleRetryMyPage();
    });
    expect(refreshMyPageForUser).toHaveBeenCalledWith(sessionUserFixture, true);
  });

  it('reports background errors when route sorting refresh fails', async () => {
    const reportBackgroundError = vi.fn();
    const fetchCommunityRoutes = vi.fn().mockRejectedValue(new Error('boom'));
    const setCommunityRouteSort = vi.fn();

    const { result } = renderHook(() => useAppPageStageActions({
      sessionUser: sessionUserFixture,
      setFeedPlaceFilterId: vi.fn(),
      setCommunityRouteSort,
      handleOpenCommentWithReturn: vi.fn(),
      fetchCommunityRoutes,
      refreshMyPageForUser: vi.fn().mockResolvedValue(undefined),
      reportBackgroundError,
    }));

    await act(async () => {
      result.current.handleChangeRouteSort('latest');
      await Promise.resolve();
    });

    expect(setCommunityRouteSort).toHaveBeenCalledWith('latest');
    expect(reportBackgroundError).toHaveBeenCalled();
  });

  it('opens a my-page comment through the shared navigation helper', () => {
    const handleOpenCommentWithReturn = vi.fn();

    const { result } = renderHook(() => useAppPageStageActions({
      sessionUser: sessionUserFixture,
      setFeedPlaceFilterId: vi.fn(),
      setCommunityRouteSort: vi.fn(),
      handleOpenCommentWithReturn,
      fetchCommunityRoutes: vi.fn().mockResolvedValue(undefined),
      refreshMyPageForUser: vi.fn().mockResolvedValue(undefined),
      reportBackgroundError: vi.fn(),
    }));

    act(() => {
      result.current.handleOpenCommentFromMyPage('review-1', 'comment-1');
    });

    expect(handleOpenCommentWithReturn).toHaveBeenCalledWith('review-1', 'comment-1');
  });
});
