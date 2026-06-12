import { describe, expect, it, vi } from 'vitest';
import { syncFestivalMarkerLifecycle, syncFestivalMarkerSelection } from '../../src/components/naver-map/festivalMarkerController';
import type { FestivalMarkerStore } from '../../src/components/naver-map/festivalMarkerController';
import type { NaverMapInstance, NaverMapsApi, NaverMarkerInstance } from '../../src/components/naver-map/naverMapTypes';
import { NaverMarkerConfig } from '../../src/config/mapConfig';
import type { FestivalItem } from '../../src/types/core';

type MarkerRecord = NaverMarkerInstance & {
  options: Record<string, unknown>;
  setIcon: ReturnType<typeof vi.fn>;
  setMap: ReturnType<typeof vi.fn>;
  setPosition: ReturnType<typeof vi.fn>;
  setZIndex: ReturnType<typeof vi.fn>;
};

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

function markerFixture(): MarkerRecord {
  return {
    options: {},
    setIcon: vi.fn(),
    setMap: vi.fn(),
    setPosition: vi.fn(),
    setZIndex: vi.fn(),
  };
}

function mapsApiFixture(markerRecords: MarkerRecord[] = []) {
  class Point {
    constructor(
      readonly x: number,
      readonly y: number,
    ) {}
  }

  class LatLng {
    constructor(
      readonly latitude: number,
      readonly longitude: number,
    ) {}

    lat() {
      return this.latitude;
    }

    lng() {
      return this.longitude;
    }
  }

  class Marker {
    readonly options: Record<string, unknown>;
    readonly setIcon = vi.fn();
    readonly setMap = vi.fn();
    readonly setPosition = vi.fn();
    readonly setZIndex = vi.fn();

    constructor(options: Record<string, unknown>) {
      this.options = options;
      markerRecords.push(this);
    }
  }

  const addListener = vi.fn((_target: NaverMarkerInstance, _eventName: string, handler: () => void) => ({ handler }));

  return {
    addListener,
    api: {
      Event: {
        addListener,
        removeListener: vi.fn(),
      },
      LatLng,
      LatLngBounds: class LatLngBounds {
        extend = vi.fn();
      },
      Map: vi.fn(),
      Marker,
      Point,
      Polyline: vi.fn(),
    } as unknown as NaverMapsApi,
  };
}

describe('festival marker controller', () => {
  it('creates coordinate-backed markers, skips coordinate-less items, and removes stale markers', () => {
    const markerRecords: MarkerRecord[] = [];
    const { api, addListener } = mapsApiFixture(markerRecords);
    const staleMarker = markerFixture();
    const markers: FestivalMarkerStore = new Map([['stale', staleMarker]]);
    const onSelectFestival = vi.fn();
    const activeFestival = festivalFixture();
    const coordinateLessFestival = festivalFixture({ id: 'festival-2', latitude: null, longitude: null });

    syncFestivalMarkerLifecycle({
      mapsApi: api,
      map: {} as NaverMapInstance,
      markers,
      festivals: [activeFestival, coordinateLessFestival],
      selectedFestivalId: activeFestival.id,
      onSelectFestival,
    });

    expect(staleMarker.setMap).toHaveBeenCalledWith(null);
    expect(markers.has('stale')).toBe(false);
    expect(markerRecords).toHaveLength(1);
    expect(markers.get(activeFestival.id)).toBe(markerRecords[0]);
    expect(markerRecords[0].options).toEqual(expect.objectContaining({
      title: '',
      zIndex: NaverMarkerConfig.zIndex.festivalActive,
    }));

    addListener.mock.calls[0][2]();
    expect(onSelectFestival).toHaveBeenCalledWith(activeFestival.id);
  });

  it('moves existing markers instead of recreating them', () => {
    const markerRecords: MarkerRecord[] = [];
    const { api } = mapsApiFixture(markerRecords);
    const existingMarker = markerFixture();
    const markers: FestivalMarkerStore = new Map([['festival-1', existingMarker]]);

    syncFestivalMarkerLifecycle({
      mapsApi: api,
      map: {} as NaverMapInstance,
      markers,
      festivals: [festivalFixture({ latitude: 36.4, longitude: 127.5 })],
      selectedFestivalId: null,
      onSelectFestival: vi.fn(),
    });

    expect(markerRecords).toHaveLength(0);
    expect(existingMarker.setPosition).toHaveBeenCalledWith(expect.objectContaining({
      latitude: 36.4,
      longitude: 127.5,
    }));
  });

  it('patches only previous and next selected markers when the festival list identity is stable', () => {
    const { api } = mapsApiFixture();
    const festivals = [
      festivalFixture({ id: 'festival-1' }),
      festivalFixture({ id: 'festival-2' }),
      festivalFixture({ id: 'festival-3' }),
    ];
    const firstMarker = markerFixture();
    const previousMarker = markerFixture();
    const selectedMarker = markerFixture();
    const markers: FestivalMarkerStore = new Map([
      ['festival-1', firstMarker],
      ['festival-2', previousMarker],
      ['festival-3', selectedMarker],
    ]);

    syncFestivalMarkerSelection({
      mapsApi: api,
      markers,
      festivals,
      previousFestivals: festivals,
      previousFestivalId: 'festival-2',
      selectedFestivalId: 'festival-3',
    });

    expect(firstMarker.setIcon).not.toHaveBeenCalled();
    expect(firstMarker.setZIndex).not.toHaveBeenCalled();
    expect(previousMarker.setZIndex).toHaveBeenCalledWith(NaverMarkerConfig.zIndex.festivalDefault);
    expect(selectedMarker.setZIndex).toHaveBeenCalledWith(NaverMarkerConfig.zIndex.festivalActive);
  });

  it('refreshes every existing marker when the festival list identity changes', () => {
    const { api } = mapsApiFixture();
    const previousFestivals = [festivalFixture({ id: 'festival-1' })];
    const festivals = [
      festivalFixture({ id: 'festival-1' }),
      festivalFixture({ id: 'festival-2' }),
      festivalFixture({ id: 'festival-3' }),
    ];
    const firstMarker = markerFixture();
    const selectedMarker = markerFixture();
    const markers: FestivalMarkerStore = new Map([
      ['festival-1', firstMarker],
      ['festival-2', selectedMarker],
    ]);

    syncFestivalMarkerSelection({
      mapsApi: api,
      markers,
      festivals,
      previousFestivals,
      previousFestivalId: 'festival-1',
      selectedFestivalId: 'festival-2',
    });

    expect(firstMarker.setZIndex).toHaveBeenCalledWith(NaverMarkerConfig.zIndex.festivalDefault);
    expect(selectedMarker.setZIndex).toHaveBeenCalledWith(NaverMarkerConfig.zIndex.festivalActive);
  });

  it('ignores missing previous or next selection markers during stable selection patches', () => {
    const { api } = mapsApiFixture();
    const festivals = [festivalFixture({ id: 'festival-1' })];
    const markers: FestivalMarkerStore = new Map();

    expect(() => syncFestivalMarkerSelection({
      mapsApi: api,
      markers,
      festivals,
      previousFestivals: festivals,
      previousFestivalId: null,
      selectedFestivalId: 'missing',
    })).not.toThrow();
  });
});
