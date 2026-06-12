import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useNaverMapInteractions } from '../../src/components/naver-map/useNaverMapInteractions';
import type { NaverMapInstance, NaverMapsApi } from '../../src/components/naver-map/naverMapTypes';
import type { FestivalItem, Place } from '../../src/types/core';

const hookMocks = vi.hoisted(() => ({
  useNaverCurrentLocationFocus: vi.fn(),
  useNaverCurrentLocationMarker: vi.fn(),
  useNaverFestivalMarkers: vi.fn(),
  useNaverPlaceMarkers: vi.fn(),
  useNaverRoutePreviewOverlay: vi.fn(),
  useNaverSelectionSync: vi.fn(),
}));

vi.mock('../../src/components/naver-map/useNaverCurrentLocationFocus', () => ({
  useNaverCurrentLocationFocus: hookMocks.useNaverCurrentLocationFocus,
}));
vi.mock('../../src/components/naver-map/useNaverCurrentLocationMarker', () => ({
  useNaverCurrentLocationMarker: hookMocks.useNaverCurrentLocationMarker,
}));
vi.mock('../../src/components/naver-map/useNaverFestivalMarkers', () => ({
  useNaverFestivalMarkers: hookMocks.useNaverFestivalMarkers,
}));
vi.mock('../../src/components/naver-map/useNaverPlaceMarkers', () => ({
  useNaverPlaceMarkers: hookMocks.useNaverPlaceMarkers,
}));
vi.mock('../../src/components/naver-map/useNaverRoutePreviewOverlay', () => ({
  useNaverRoutePreviewOverlay: hookMocks.useNaverRoutePreviewOverlay,
}));
vi.mock('../../src/components/naver-map/useNaverSelectionSync', () => ({
  useNaverSelectionSync: hookMocks.useNaverSelectionSync,
}));

function placeFixture(overrides: Partial<Place> = {}): Place {
  return {
    id: 'place-1',
    name: 'Place 1',
    district: 'District',
    category: 'cafe',
    jamColor: '#fff',
    accentColor: '#000',
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

function festivalFixture(overrides: Partial<FestivalItem> = {}): FestivalItem {
  return {
    id: 'festival-1',
    title: 'Festival',
    venueName: null,
    startDate: '2026-05-14',
    endDate: '2026-05-15',
    homepageUrl: null,
    roadAddress: null,
    latitude: 36.36,
    longitude: 127.39,
    isOngoing: true,
    ...overrides,
  };
}

describe('useNaverMapInteractions', () => {
  it('delegates map interaction responsibilities to owner hooks with stable internal refs', () => {
    const mapsApi = { Marker: vi.fn() } as unknown as NaverMapsApi;
    const mapRef = { current: { panTo: vi.fn() } as unknown as NaverMapInstance };
    const mapElementRef = { current: document.createElement('div') };
    const places = [placeFixture()];
    const festivals = [festivalFixture()];
    const routePreviewPlaces = [placeFixture({ id: 'place-2' })];
    const onSelectPlace = vi.fn();
    const onSelectFestival = vi.fn();

    renderHook(() => useNaverMapInteractions({
      status: 'ready',
      mapsApi,
      mapRef,
      mapElementRef,
      places,
      festivals,
      selectedPlaceId: 'place-1',
      selectedFestivalId: null,
      onSelectPlace,
      onSelectFestival,
      currentPosition: { latitude: 36.35, longitude: 127.38 },
      focusCurrentLocationKey: 3,
      routePreviewPlaces,
    }));

    expect(hookMocks.useNaverPlaceMarkers).toHaveBeenCalledWith({
      status: 'ready',
      mapsApi,
      mapRef,
      places,
      selectedPlaceId: 'place-1',
      onSelectPlace,
    });
    expect(hookMocks.useNaverFestivalMarkers).toHaveBeenCalledWith({
      status: 'ready',
      mapsApi,
      mapRef,
      festivals,
      selectedFestivalId: null,
      onSelectFestival,
    });
    expect(hookMocks.useNaverCurrentLocationMarker).toHaveBeenCalledWith({
      status: 'ready',
      mapsApi,
      mapRef,
      currentPosition: { latitude: 36.35, longitude: 127.38 },
    });
    expect(hookMocks.useNaverSelectionSync).toHaveBeenCalledWith({
      status: 'ready',
      mapsApi,
      mapRef,
      mapElementRef,
      places,
      festivals,
      selectedPlaceId: 'place-1',
      selectedFestivalId: null,
    });
    expect(hookMocks.useNaverCurrentLocationFocus).toHaveBeenCalledWith(expect.objectContaining({
      status: 'ready',
      mapsApi,
      mapRef,
      currentPosition: { latitude: 36.35, longitude: 127.38 },
      focusCurrentLocationKey: 3,
      selectedPlaceId: 'place-1',
      selectedFestivalId: null,
      lastHandledCurrentLocationFocusKeyRef: { current: 0 },
    }));
    expect(hookMocks.useNaverRoutePreviewOverlay).toHaveBeenCalledWith(expect.objectContaining({
      status: 'ready',
      mapsApi,
      mapRef,
      routePreviewPlaces,
      selectedPlaceId: 'place-1',
      selectedFestivalId: null,
    }));
    expect(hookMocks.useNaverRoutePreviewOverlay.mock.calls[0][0].routeLineRef.current).toBeNull();
    expect(hookMocks.useNaverRoutePreviewOverlay.mock.calls[0][0].routeStepMarkersRef.current).toEqual([]);
  });
});
