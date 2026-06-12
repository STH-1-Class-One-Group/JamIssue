import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useNaverCurrentLocationFocus } from '../../src/components/naver-map/useNaverCurrentLocationFocus';
import { useNaverCurrentLocationMarker } from '../../src/components/naver-map/useNaverCurrentLocationMarker';
import { useNaverFestivalMarkers } from '../../src/components/naver-map/useNaverFestivalMarkers';
import { useNaverPlaceMarkers } from '../../src/components/naver-map/useNaverPlaceMarkers';
import { useNaverRoutePreviewOverlay } from '../../src/components/naver-map/useNaverRoutePreviewOverlay';
import { useNaverSelectionSync } from '../../src/components/naver-map/useNaverSelectionSync';
import { useNaverViewportChangeRef } from '../../src/components/naver-map/useNaverViewportChangeRef';
import { useNaverViewportSync } from '../../src/components/naver-map/useNaverViewportSync';
import type { NaverMapInstance, NaverMapsApi, NaverMarkerInstance, NaverPolylineInstance } from '../../src/components/naver-map/naverMapTypes';
import type { FestivalItem, Place } from '../../src/types/core';

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

function mapsApiFixture() {
  class LatLng {
    constructor(private readonly latValue: number, private readonly lngValue: number) {}
    lat() {
      return this.latValue;
    }
    lng() {
      return this.lngValue;
    }
  }
  class Point {
    constructor(public readonly x: number, public readonly y: number) {}
  }
  class LatLngBounds {
    extend = vi.fn();
  }
  const Marker = vi.fn(function marker(
    this: {
      options: unknown;
      setIcon: ReturnType<typeof vi.fn>;
      setMap: ReturnType<typeof vi.fn>;
      setPosition: ReturnType<typeof vi.fn>;
      setZIndex: ReturnType<typeof vi.fn>;
    },
    options: unknown,
  ) {
    this.options = options;
    this.setIcon = vi.fn();
    this.setMap = vi.fn();
    this.setPosition = vi.fn();
    this.setZIndex = vi.fn();
  });
  const Polyline = vi.fn(function polyline(this: { options: unknown; setMap: ReturnType<typeof vi.fn> }, options: unknown) {
    this.options = options;
    this.setMap = vi.fn();
  });
  const addListener = vi.fn((_target: unknown, _event: string, handler: () => void) => ({ handler }));
  const removeListener = vi.fn();

  return {
    api: {
      Event: { addListener, removeListener },
      LatLng,
      LatLngBounds,
      Marker,
      Point,
      Polyline,
    } as unknown as NaverMapsApi,
    addListener,
    removeListener,
    Marker,
    Polyline,
  };
}

function mapFixture(overrides: Partial<NaverMapInstance> = {}) {
  return {
    fitBounds: vi.fn(),
    getCenter: vi.fn(() => ({ lat: () => 36.35, lng: () => 127.38 })),
    getZoom: vi.fn(() => 12),
    panBy: vi.fn(),
    panTo: vi.fn(),
    setCenter: vi.fn(),
    setZoom: vi.fn(),
    ...overrides,
  } as unknown as NaverMapInstance;
}

describe('naver map hook boundaries', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it('focuses current location once and skips focus while another entity is selected', () => {
    const { api } = mapsApiFixture();
    const map = mapFixture();
    const lastHandledCurrentLocationFocusKeyRef = { current: 0 };
    const props = {
      status: 'ready' as const,
      mapsApi: api,
      mapRef: { current: map },
      currentPosition: { latitude: 36.35, longitude: 127.38 },
      focusCurrentLocationKey: 1,
      selectedPlaceId: null,
      selectedFestivalId: null,
      lastHandledCurrentLocationFocusKeyRef,
    };
    const { rerender } = renderHook((nextProps: typeof props) => useNaverCurrentLocationFocus(nextProps), {
      initialProps: props,
    });

    expect(map.panTo).toHaveBeenCalledTimes(1);
    expect(lastHandledCurrentLocationFocusKeyRef.current).toBe(1);

    rerender(props);
    expect(map.panTo).toHaveBeenCalledTimes(1);

    rerender({ ...props, focusCurrentLocationKey: 2, selectedPlaceId: 'place-1' });
    expect(map.panTo).toHaveBeenCalledTimes(1);
    expect(lastHandledCurrentLocationFocusKeyRef.current).toBe(2);
  });

  it('creates, updates, and removes the current location marker', () => {
    const { api, Marker } = mapsApiFixture();
    const map = mapFixture();
    const { rerender } = renderHook(
      ({ currentPosition }) => useNaverCurrentLocationMarker({
        status: 'ready',
        mapsApi: api,
        mapRef: { current: map },
        currentPosition,
      }),
      { initialProps: { currentPosition: { latitude: 36.35, longitude: 127.38 } as { latitude: number; longitude: number } | null } },
    );

    expect(Marker).toHaveBeenCalledTimes(1);
    const marker = Marker.mock.instances[0] as unknown as NaverMarkerInstance;

    rerender({ currentPosition: { latitude: 36.36, longitude: 127.39 } });
    expect(marker.setPosition).toHaveBeenCalled();
    expect(marker.setMap).toHaveBeenCalledWith(map);

    rerender({ currentPosition: null });
    expect(marker.setMap).toHaveBeenCalledWith(null);
  });

  it('keeps viewport change callbacks fresh and debounced behind the Naver idle event', () => {
    vi.useFakeTimers();
    const { api, addListener, removeListener } = mapsApiFixture();
    const map = mapFixture();
    const firstCallback = vi.fn();
    const secondCallback = vi.fn();
    const viewportRef = renderHook(({ callback }) => useNaverViewportChangeRef(callback), {
      initialProps: { callback: firstCallback as ((lat: number, lng: number, zoom: number) => void) | undefined },
    });
    viewportRef.rerender({ callback: secondCallback });
    const { unmount } = renderHook(() => useNaverViewportSync({
      status: 'ready',
      mapsApi: api,
      mapRef: { current: map },
      onViewportChangeRef: viewportRef.result.current,
    }));

    addListener.mock.calls[0][2]();
    vi.runAllTimers();

    expect(secondCallback).toHaveBeenCalledWith(36.35, 127.38, 12);
    expect(firstCallback).not.toHaveBeenCalled();

    unmount();
    expect(removeListener).toHaveBeenCalledWith(addListener.mock.results[0].value);
  });

  it('skips viewport listeners until the map is ready and clears pending idle updates on cleanup', () => {
    vi.useFakeTimers();
    const { api, addListener, removeListener } = mapsApiFixture();
    const map = mapFixture();
    const onViewportChange = vi.fn();
    const onViewportChangeRef = { current: onViewportChange };
    const props = {
      status: 'loading' as const,
      mapsApi: api,
      mapRef: { current: map as NaverMapInstance | null },
      onViewportChangeRef,
    };
    const { rerender, unmount } = renderHook((nextProps: typeof props) => useNaverViewportSync(nextProps), {
      initialProps: props,
    });

    expect(addListener).not.toHaveBeenCalled();

    rerender({ ...props, status: 'ready' });
    addListener.mock.calls[0][2]();
    addListener.mock.calls[0][2]();
    vi.runOnlyPendingTimers();
    expect(onViewportChange).toHaveBeenCalledTimes(1);

    onViewportChange.mockClear();
    addListener.mock.calls[0][2]();
    props.mapRef.current = null;
    addListener.mock.calls[0][2]();
    unmount();
    vi.runOnlyPendingTimers();

    expect(onViewportChange).not.toHaveBeenCalled();
    expect(removeListener).toHaveBeenCalledWith(addListener.mock.results[0].value);
  });

  it('syncs selected places and festivals to map zoom and pan behavior', () => {
    vi.useFakeTimers();
    const { api } = mapsApiFixture();
    const map = mapFixture({ getZoom: vi.fn(() => 10) });
    const mapElement = document.createElement('div');
    Object.defineProperty(mapElement, 'clientHeight', { configurable: true, value: 800 });

    renderHook(() => useNaverSelectionSync({
      status: 'ready',
      mapsApi: api,
      mapRef: { current: map },
      mapElementRef: { current: mapElement },
      places: [placeFixture()],
      festivals: [festivalFixture()],
      selectedPlaceId: 'place-1',
      selectedFestivalId: null,
    }));
    vi.runAllTimers();

    expect(map.setZoom).toHaveBeenCalledWith(expect.any(Number), false);
    expect(map.panTo).toHaveBeenCalled();
    expect(map.panBy).toHaveBeenCalledWith(0, expect.any(Number));
  });

  it('uses setCenter fallback and skips pan offsets when selected targets are unavailable', () => {
    vi.useFakeTimers();
    const { api } = mapsApiFixture();
    const map = mapFixture({
      getZoom: vi.fn(() => Number.NaN),
      panBy: undefined,
      panTo: undefined,
      setCenter: vi.fn(),
    });

    renderHook(() => useNaverSelectionSync({
      status: 'ready',
      mapsApi: api,
      mapRef: { current: map },
      mapElementRef: { current: null },
      places: [],
      festivals: [festivalFixture({ latitude: 36.37, longitude: 127.4 })],
      selectedPlaceId: null,
      selectedFestivalId: 'festival-1',
    }));

    expect(map.setZoom).not.toHaveBeenCalled();
    expect(map.setCenter).toHaveBeenCalled();
    vi.runAllTimers();
    expect(map.panBy).toBeUndefined();

    const unavailableMap = mapFixture();
    renderHook(() => useNaverSelectionSync({
      status: 'ready',
      mapsApi: api,
      mapRef: { current: unavailableMap },
      mapElementRef: { current: null },
      places: [],
      festivals: [festivalFixture({ latitude: null, longitude: null })],
      selectedPlaceId: null,
      selectedFestivalId: 'festival-1',
    }));
    expect(unavailableMap.panTo).not.toHaveBeenCalled();
  });

  it('creates, selects, updates, and removes place markers through the SDK boundary', () => {
    const { api, addListener, Marker } = mapsApiFixture();
    const map = mapFixture();
    const onSelectPlace = vi.fn();
    const firstPlace = placeFixture();
    const secondPlace = placeFixture({ id: 'place-2', latitude: 36.36, longitude: 127.39 });
    const initialProps = {
      status: 'ready' as const,
      mapsApi: api,
      mapRef: { current: map },
      places: [firstPlace, secondPlace],
      selectedPlaceId: null as string | null,
      onSelectPlace,
    };

    const { rerender } = renderHook((props: typeof initialProps) => useNaverPlaceMarkers(props), {
      initialProps,
    });

    expect(Marker).toHaveBeenCalledTimes(2);
    addListener.mock.calls[0][2]();
    expect(onSelectPlace).toHaveBeenCalledWith('place-1');

    const firstMarker = Marker.mock.instances[0] as unknown as NaverMarkerInstance & {
      setIcon: ReturnType<typeof vi.fn>;
      setZIndex: ReturnType<typeof vi.fn>;
    };
    rerender({ ...initialProps, selectedPlaceId: 'place-1' });
    expect(firstMarker.setIcon).toHaveBeenCalled();
    expect(firstMarker.setZIndex).toHaveBeenCalledWith(expect.any(Number));

    rerender({ ...initialProps, places: [firstPlace], selectedPlaceId: 'place-1' });
    const secondMarker = Marker.mock.instances[1] as unknown as NaverMarkerInstance;
    expect(secondMarker.setMap).toHaveBeenCalledWith(null);
  });

  it('creates, selects, skips coordinate-less, and removes festival markers through the SDK boundary', () => {
    const { api, Marker } = mapsApiFixture();
    const map = mapFixture();
    const validFestival = festivalFixture();
    const missingCoordinateFestival = festivalFixture({ id: 'festival-2', latitude: null, longitude: null });
    const initialProps = {
      status: 'ready' as const,
      mapsApi: api,
      mapRef: { current: map },
      festivals: [validFestival, missingCoordinateFestival],
      selectedFestivalId: null as string | null,
      onSelectFestival: vi.fn(),
    };

    const { rerender } = renderHook((props: typeof initialProps) => useNaverFestivalMarkers(props), {
      initialProps,
    });

    expect(Marker).toHaveBeenCalledTimes(1);
    const marker = Marker.mock.instances[0] as unknown as NaverMarkerInstance & {
      setIcon: ReturnType<typeof vi.fn>;
      setZIndex: ReturnType<typeof vi.fn>;
    };

    rerender({ ...initialProps, selectedFestivalId: 'festival-1' });
    expect(marker.setIcon).toHaveBeenCalled();
    expect(marker.setZIndex).toHaveBeenCalledWith(expect.any(Number));

    rerender({ ...initialProps, festivals: [], selectedFestivalId: null });
    expect(marker.setMap).toHaveBeenCalledWith(null);
  });

  it('draws route preview overlays and clears previous map objects on update', () => {
    const { api, Marker, Polyline } = mapsApiFixture();
    const map = mapFixture();
    const staleLine = { setMap: vi.fn() } as unknown as NaverPolylineInstance;
    const staleMarker = { setMap: vi.fn() } as unknown as NaverMarkerInstance;
    const routeLineRef = { current: staleLine };
    const routeStepMarkersRef = { current: [staleMarker] };
    const routePreviewPlaces = [placeFixture(), placeFixture({ id: 'place-2', latitude: 36.36, longitude: 127.39 })];

    renderHook(() => useNaverRoutePreviewOverlay({
      status: 'ready',
      mapsApi: api,
      mapRef: { current: map },
      routeLineRef,
      routeStepMarkersRef,
      routePreviewPlaces,
      selectedPlaceId: null,
      selectedFestivalId: null,
    }));

    expect(staleLine.setMap).toHaveBeenCalledWith(null);
    expect(staleMarker.setMap).toHaveBeenCalledWith(null);
    expect(Polyline).toHaveBeenCalledWith(expect.objectContaining({ map, path: expect.any(Array) }));
    expect(Marker).toHaveBeenCalledTimes(2);
    expect(map.fitBounds).toHaveBeenCalledWith(expect.anything(), expect.any(Object));
    expect(routeStepMarkersRef.current).toHaveLength(2);
  });

  it('handles empty and single-place route preview overlays without fitting bounds', () => {
    const { api } = mapsApiFixture();
    const map = mapFixture();
    const routeLineRef = { current: null as NaverPolylineInstance | null };
    const routeStepMarkersRef = { current: [] as NaverMarkerInstance[] };
    const { rerender } = renderHook(
      ({ routePreviewPlaces, selectedPlaceId }) => useNaverRoutePreviewOverlay({
        status: 'ready',
        mapsApi: api,
        mapRef: { current: map },
        routeLineRef,
        routeStepMarkersRef,
        routePreviewPlaces,
        selectedPlaceId,
        selectedFestivalId: null,
      }),
      { initialProps: { routePreviewPlaces: [] as Place[], selectedPlaceId: null as string | null } },
    );

    expect(map.fitBounds).not.toHaveBeenCalled();

    rerender({ routePreviewPlaces: [placeFixture()], selectedPlaceId: null });
    expect(map.panTo).toHaveBeenCalled();
    expect(map.fitBounds).not.toHaveBeenCalled();

    map.panTo = vi.fn();
    rerender({ routePreviewPlaces: [placeFixture({ id: 'place-2' })], selectedPlaceId: 'place-2' });
    expect(map.panTo).not.toHaveBeenCalled();
  });
});
