import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useAppStageActions } from '../../src/hooks/useAppStageActions';
import { placeFixture, routeFixture } from '../fixtures/app-fixtures';

describe('useAppStageActions', () => {
  it('clears route preview when opening a place directly from the map', () => {
    const setSelectedRoutePreview = vi.fn();
    const commitRouteState = vi.fn();

    const { result } = renderHook(() => useAppStageActions({
      selectedPlace: placeFixture,
      selectedFestival: null,
      selectedPlaceId: placeFixture.id,
      selectedFestivalId: null,
      drawerState: 'partial',
      selectedRoutePreview: {
        id: routeFixture.id,
        title: routeFixture.title,
        subtitle: `${routeFixture.author} / ${routeFixture.createdAt}`,
        mood: routeFixture.mood,
        placeIds: routeFixture.placeIds,
        placeNames: routeFixture.placeNames,
      },
      setSelectedRoutePreview,
      commitRouteState,
      goToTab: vi.fn(),
      handleOpenPlaceFeedWithReturn: vi.fn(),
      refreshCurrentPosition: vi.fn().mockResolvedValue(undefined),
    }));

    act(() => {
      result.current.handleMapOpenPlace('place-2');
    });

    expect(setSelectedRoutePreview).toHaveBeenCalledWith(null);
    expect(commitRouteState).toHaveBeenCalledWith(
      { tab: 'map', placeId: 'place-2', festivalId: null, drawerState: 'partial' },
      'push',
      { routePreview: null },
    );
  });

  it('preserves the active route preview when opening a place from the route preview card', () => {
    const selectedRoutePreview = {
      id: routeFixture.id,
      title: routeFixture.title,
      subtitle: `${routeFixture.author} / ${routeFixture.createdAt}`,
      mood: routeFixture.mood,
      placeIds: routeFixture.placeIds,
      placeNames: routeFixture.placeNames,
    };
    const commitRouteState = vi.fn();

    const { result } = renderHook(() => useAppStageActions({
      selectedPlace: placeFixture,
      selectedFestival: null,
      selectedPlaceId: placeFixture.id,
      selectedFestivalId: null,
      drawerState: 'partial',
      selectedRoutePreview,
      setSelectedRoutePreview: vi.fn(),
      commitRouteState,
      goToTab: vi.fn(),
      handleOpenPlaceFeedWithReturn: vi.fn(),
      refreshCurrentPosition: vi.fn().mockResolvedValue(undefined),
    }));

    act(() => {
      result.current.handleMapOpenRoutePreviewPlace('place-2');
    });

    expect(commitRouteState).toHaveBeenCalledWith(
      { tab: 'map', placeId: 'place-2', festivalId: null, drawerState: 'partial' },
      'push',
      { routePreview: selectedRoutePreview },
    );
  });

  it('routes login requests to the my tab', () => {
    const goToTab = vi.fn();
    const { result } = renderHook(() => useAppStageActions({
      selectedPlace: placeFixture,
      selectedFestival: null,
      selectedPlaceId: placeFixture.id,
      selectedFestivalId: null,
      drawerState: 'partial',
      selectedRoutePreview: null,
      setSelectedRoutePreview: vi.fn(),
      commitRouteState: vi.fn(),
      goToTab,
      handleOpenPlaceFeedWithReturn: vi.fn(),
      refreshCurrentPosition: vi.fn().mockResolvedValue(undefined),
    }));

    act(() => {
      result.current.handleRequestLogin();
    });

    expect(goToTab).toHaveBeenCalledWith('my');
  });

  it('opens feeds, festivals, clears previews, and locates the current position', () => {
    const selectedRoutePreview = {
      id: routeFixture.id,
      title: routeFixture.title,
      subtitle: `${routeFixture.author} / ${routeFixture.createdAt}`,
      mood: routeFixture.mood,
      placeIds: routeFixture.placeIds,
      placeNames: routeFixture.placeNames,
    };
    const setSelectedRoutePreview = vi.fn();
    const commitRouteState = vi.fn();
    const handleOpenPlaceFeedWithReturn = vi.fn();
    const refreshCurrentPosition = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useAppStageActions({
      selectedPlace: placeFixture,
      selectedFestival: { id: 'festival-1' },
      selectedPlaceId: placeFixture.id,
      selectedFestivalId: null,
      drawerState: 'full',
      selectedRoutePreview,
      setSelectedRoutePreview,
      commitRouteState,
      goToTab: vi.fn(),
      handleOpenPlaceFeedWithReturn,
      refreshCurrentPosition,
    }));

    act(() => {
      result.current.handleMapOpenPlaceFeed();
      result.current.handleMapOpenFestival('festival-2');
      result.current.handleClearRoutePreview();
      result.current.handleExpandPlaceDrawer();
      result.current.handleCollapsePlaceDrawer();
      result.current.handleExpandFestivalDrawer();
      result.current.handleCollapseFestivalDrawer();
      result.current.handleLocateCurrentPosition();
    });

    expect(handleOpenPlaceFeedWithReturn).toHaveBeenCalledWith(placeFixture.id);
    expect(setSelectedRoutePreview).toHaveBeenCalledWith(null);
    expect(commitRouteState).toHaveBeenCalledWith(
      { tab: 'map', placeId: null, festivalId: 'festival-2', drawerState: 'partial' },
      'push',
      { routePreview: null },
    );
    expect(commitRouteState).toHaveBeenCalledWith(
      { tab: 'map', placeId: placeFixture.id, festivalId: null, drawerState: 'full' },
      'replace',
      { routePreview: null },
    );
    expect(commitRouteState).toHaveBeenCalledWith(
      { tab: 'map', placeId: placeFixture.id, festivalId: null, drawerState: 'full' },
      'replace',
    );
    expect(commitRouteState).toHaveBeenCalledWith(
      { tab: 'map', placeId: placeFixture.id, festivalId: null, drawerState: 'partial' },
      'replace',
    );
    expect(commitRouteState).toHaveBeenCalledWith(
      { tab: 'map', placeId: null, festivalId: 'festival-1', drawerState: 'full' },
      'replace',
    );
    expect(commitRouteState).toHaveBeenCalledWith(
      { tab: 'map', placeId: null, festivalId: 'festival-1', drawerState: 'partial' },
      'replace',
    );
    expect(refreshCurrentPosition).toHaveBeenCalledWith(true);
  });

  it('ignores drawer and feed actions when the required selection is missing', () => {
    const commitRouteState = vi.fn();
    const handleOpenPlaceFeedWithReturn = vi.fn();
    const { result } = renderHook(() => useAppStageActions({
      selectedPlace: null,
      selectedFestival: null,
      selectedPlaceId: null,
      selectedFestivalId: null,
      drawerState: 'closed',
      selectedRoutePreview: null,
      setSelectedRoutePreview: vi.fn(),
      commitRouteState,
      goToTab: vi.fn(),
      handleOpenPlaceFeedWithReturn,
      refreshCurrentPosition: vi.fn().mockResolvedValue(undefined),
    }));

    act(() => {
      result.current.handleMapOpenPlaceFeed();
      result.current.handleExpandPlaceDrawer();
      result.current.handleCollapsePlaceDrawer();
      result.current.handleExpandFestivalDrawer();
      result.current.handleCollapseFestivalDrawer();
    });

    expect(handleOpenPlaceFeedWithReturn).not.toHaveBeenCalled();
    expect(commitRouteState).not.toHaveBeenCalled();
  });
});
