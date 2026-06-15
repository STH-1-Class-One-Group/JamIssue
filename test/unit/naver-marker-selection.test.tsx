import { render } from '@testing-library/react';
import { act } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { NaverMarkerConfig } from '../../src/config/mapConfig';
import { useNaverFestivalMarkers } from '../../src/components/naver-map/useNaverFestivalMarkers';
import { useNaverPlaceMarkers } from '../../src/components/naver-map/useNaverPlaceMarkers';
import { useNaverTourismMarkers } from '../../src/components/naver-map/useNaverTourismMarkers';
import type { TourismPlaceItem } from '../../src/tourismTypes';
import type { FestivalItem, Place } from '../../src/types';

type MarkerRecord = {
  options: Record<string, unknown>;
  setIcon: ReturnType<typeof vi.fn>;
  setMap: ReturnType<typeof vi.fn>;
  setPosition: ReturnType<typeof vi.fn>;
  setZIndex: ReturnType<typeof vi.fn>;
};

function createMapsApi(markerRecords: MarkerRecord[]) {
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

  return {
    Point,
    LatLng,
    Marker,
    Event: {
      addListener: vi.fn(),
    },
  } as unknown as typeof window.naver.maps;
}

function clearMarkerSpies(markerRecords: MarkerRecord[]) {
  markerRecords.forEach((marker) => {
    marker.setIcon.mockClear();
    marker.setMap.mockClear();
    marker.setPosition.mockClear();
    marker.setZIndex.mockClear();
  });
}

const places = [
  { id: 'place-1', latitude: 36.1, longitude: 127.1, category: 'cafe' },
  { id: 'place-2', latitude: 36.2, longitude: 127.2, category: 'restaurant' },
  { id: 'place-3', latitude: 36.3, longitude: 127.3, category: 'culture' },
] as Place[];

function buildCuratedPlaces(count: number): Place[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `curated-place-${index + 1}`,
    name: `Curated Place ${index + 1}`,
    district: '대전',
    category: index % 2 === 0 ? 'cafe' : 'restaurant',
    jamColor: '#f6a8c8',
    accentColor: '#315f72',
    latitude: 36.1 + index * 0.001,
    longitude: 127.1 + index * 0.001,
  })) as Place[];
}

const festivals = [
  { id: 'festival-1', latitude: 36.4, longitude: 127.4 },
  { id: 'festival-2', latitude: 36.5, longitude: 127.5 },
  { id: 'festival-3', latitude: 36.6, longitude: 127.6 },
] as FestivalItem[];

const tourismPlaces = [
  {
    id: 'tourism-1',
    name: 'Tourism 1',
    category: 'restaurant',
    primaryType: 'restaurant',
    subType: 'unknown',
    displayGroup: 'restaurant',
    officialCategoryLabel: '음식점',
    curationStatus: 'raw_kto',
    ktoContentTypeId: '39',
    ktoContentTypeLabel: '음식점',
    ktoFacet: 'restaurant',
    district: '서구',
    address: null,
    roadAddress: null,
    summary: '',
    description: null,
    latitude: 36.7,
    longitude: 127.7,
    imageUrl: null,
    sourcePageUrl: null,
    sourceUpdatedAt: null,
    sourceName: 'KTO 관광정보',
    hasDetail: true,
    detailKind: 'restaurant',
    isCurated: false,
    curatedPlace: null,
  },
  {
    id: 'tourism-2',
    name: 'Tourism 2',
    category: 'culture',
    primaryType: 'culture',
    subType: 'unknown',
    displayGroup: 'culture',
    officialCategoryLabel: '문화시설',
    curationStatus: 'raw_kto',
    ktoContentTypeId: '14',
    ktoContentTypeLabel: '문화시설',
    ktoFacet: 'culture',
    district: '중구',
    address: null,
    roadAddress: null,
    summary: '',
    description: null,
    latitude: 36.8,
    longitude: 127.8,
    imageUrl: null,
    sourcePageUrl: null,
    sourceUpdatedAt: null,
    sourceName: 'KTO 관광정보',
    hasDetail: true,
    detailKind: 'culture',
    isCurated: false,
    curatedPlace: null,
  },
] as TourismPlaceItem[];

function buildTourismPlaces(count: number): TourismPlaceItem[] {
  return Array.from({ length: count }, (_, index) => ({
    ...tourismPlaces[0],
    id: `tourism-bulk-${index + 1}`,
    name: `Tourism Bulk ${index + 1}`,
    latitude: 36.0 + index * 0.001,
    longitude: 127.0 + index * 0.001,
  }));
}

function createMapWithBounds(maxLatitude: number) {
  return {
    getBounds: () => ({
      extend: vi.fn(),
      hasLatLng: (position: { lat: () => number }) => position.lat() < maxLatitude,
    }),
    getCenter: () => ({ lat: () => 36.35, lng: () => 127.38 }),
    getZoom: () => 13,
  };
}

describe('naver marker selection updates', () => {
  it('updates only previous and next place marker state when selection changes', () => {
    const markerRecords: MarkerRecord[] = [];
    const mapsApi = createMapsApi(markerRecords);
    const mapRef = { current: {} };
    const onSelectPlace = vi.fn();

    function Harness({ selectedPlaceId }: { selectedPlaceId: string | null }) {
      useNaverPlaceMarkers({
        status: 'ready',
        mapsApi,
        mapRef,
        places,
        selectedPlaceId,
        onSelectPlace,
      });
      return null;
    }

    const { rerender } = render(<Harness selectedPlaceId={null} />);

    expect(markerRecords).toHaveLength(places.length);
    clearMarkerSpies(markerRecords);

    rerender(<Harness selectedPlaceId="place-2" />);
    rerender(<Harness selectedPlaceId="place-3" />);

    expect(markerRecords[0].setIcon).not.toHaveBeenCalled();
    expect(markerRecords[0].setZIndex).not.toHaveBeenCalled();
    expect(markerRecords[0].setPosition).not.toHaveBeenCalled();

    expect(markerRecords[1].setIcon).toHaveBeenCalledTimes(2);
    expect(markerRecords[1].setZIndex).toHaveBeenLastCalledWith(NaverMarkerConfig.zIndex.placeDefault);
    expect(markerRecords[1].setPosition).not.toHaveBeenCalled();

    expect(markerRecords[2].setIcon).toHaveBeenCalledTimes(1);
    expect(markerRecords[2].setZIndex).toHaveBeenLastCalledWith(NaverMarkerConfig.zIndex.placeActive);
    expect(markerRecords[2].setPosition).not.toHaveBeenCalled();
  });

  it('creates one place marker per curated map-bootstrap place without a page-size cap', () => {
    const markerRecords: MarkerRecord[] = [];
    const mapsApi = createMapsApi(markerRecords);
    const mapRef = { current: {} };
    const onSelectPlace = vi.fn();
    const allCuratedPlaces = buildCuratedPlaces(81);

    function Harness() {
      useNaverPlaceMarkers({
        status: 'ready',
        mapsApi,
        mapRef,
        places: allCuratedPlaces,
        selectedPlaceId: null,
        onSelectPlace,
      });
      return null;
    }

    render(<Harness />);

    expect(markerRecords).toHaveLength(81);
  });

  it('updates only previous and next festival marker state when selection changes', () => {
    const markerRecords: MarkerRecord[] = [];
    const mapsApi = createMapsApi(markerRecords);
    const mapRef = { current: {} };
    const onSelectFestival = vi.fn();

    function Harness({ selectedFestivalId }: { selectedFestivalId: string | null }) {
      useNaverFestivalMarkers({
        status: 'ready',
        mapsApi,
        mapRef,
        festivals,
        selectedFestivalId,
        onSelectFestival,
      });
      return null;
    }

    const { rerender } = render(<Harness selectedFestivalId={null} />);

    expect(markerRecords).toHaveLength(festivals.length);
    clearMarkerSpies(markerRecords);

    rerender(<Harness selectedFestivalId="festival-2" />);
    rerender(<Harness selectedFestivalId="festival-3" />);

    expect(markerRecords[0].setIcon).not.toHaveBeenCalled();
    expect(markerRecords[0].setZIndex).not.toHaveBeenCalled();
    expect(markerRecords[0].setPosition).not.toHaveBeenCalled();

    expect(markerRecords[1].setIcon).toHaveBeenCalledTimes(2);
    expect(markerRecords[1].setZIndex).toHaveBeenLastCalledWith(NaverMarkerConfig.zIndex.festivalDefault);
    expect(markerRecords[1].setPosition).not.toHaveBeenCalled();

    expect(markerRecords[2].setIcon).toHaveBeenCalledTimes(1);
    expect(markerRecords[2].setZIndex).toHaveBeenLastCalledWith(NaverMarkerConfig.zIndex.festivalActive);
    expect(markerRecords[2].setPosition).not.toHaveBeenCalled();
  });

  it('uses tourism-specific z-index layers for KTO markers', () => {
    const markerRecords: MarkerRecord[] = [];
    const mapsApi = createMapsApi(markerRecords);
    const mapRef = { current: {} };
    const onSelectTourismPlace = vi.fn();

    function Harness({ selectedTourismPlaceId }: { selectedTourismPlaceId: string | null }) {
      useNaverTourismMarkers({
        status: 'ready',
        mapsApi,
        mapRef,
        viewportVersion: 0,
        tourismPlaces,
        selectedTourismPlaceId,
        onSelectTourismPlace,
      });
      return null;
    }

    const { rerender } = render(<Harness selectedTourismPlaceId={null} />);

    expect(markerRecords).toHaveLength(tourismPlaces.length);
    expect(markerRecords[0].options.zIndex).toBe(NaverMarkerConfig.zIndex.tourismDefault);
    expect(markerRecords[0].options.zIndex).not.toBe(NaverMarkerConfig.zIndex.festivalDefault);
    clearMarkerSpies(markerRecords);

    rerender(<Harness selectedTourismPlaceId="tourism-2" />);

    expect(markerRecords[0].setZIndex).toHaveBeenLastCalledWith(NaverMarkerConfig.zIndex.tourismDefault);
    expect(markerRecords[1].setZIndex).toHaveBeenLastCalledWith(NaverMarkerConfig.zIndex.tourismActive);
  });

  it('materializes only KTO markers inside the current map bounds', () => {
    const markerRecords: MarkerRecord[] = [];
    const mapsApi = createMapsApi(markerRecords);
    const mapRef = { current: createMapWithBounds(36.012) };
    const onSelectTourismPlace = vi.fn();
    const allTourismPlaces = buildTourismPlaces(200);

    function Harness() {
      useNaverTourismMarkers({
        status: 'ready',
        mapsApi,
        mapRef,
        viewportVersion: 0,
        tourismPlaces: allTourismPlaces,
        selectedTourismPlaceId: null,
        onSelectTourismPlace,
      });
      return null;
    }

    render(<Harness />);

    expect(markerRecords).toHaveLength(12);
  });

  it('caps KTO marker materialization even when many production items are inside bounds', () => {
    vi.useFakeTimers();
    const markerRecords: MarkerRecord[] = [];
    const mapsApi = createMapsApi(markerRecords);
    const mapRef = { current: createMapWithBounds(37) };
    const onSelectTourismPlace = vi.fn();
    const productionLikeTourismPlaces = buildTourismPlaces(395);

    function Harness() {
      useNaverTourismMarkers({
        status: 'ready',
        mapsApi,
        mapRef,
        viewportVersion: 0,
        tourismPlaces: productionLikeTourismPlaces,
        selectedTourismPlaceId: null,
        onSelectTourismPlace,
      });
      return null;
    }

    try {
      render(<Harness />);

      expect(markerRecords).toHaveLength(NaverMarkerConfig.materialization.tourismMarkerBatchSize);

      act(() => {
        vi.runAllTimers();
      });

      expect(markerRecords).toHaveLength(NaverMarkerConfig.materialization.tourismViewportMarkerLimit);
    } finally {
      vi.useRealTimers();
    }
  });

  it('keeps a selected KTO marker materialized even when it is outside the viewport cap', () => {
    vi.useFakeTimers();
    const markerRecords: MarkerRecord[] = [];
    const mapsApi = createMapsApi(markerRecords);
    const mapRef = { current: createMapWithBounds(37) };
    const onSelectTourismPlace = vi.fn();
    const productionLikeTourismPlaces = buildTourismPlaces(395);
    const selectedTourismPlaceId = productionLikeTourismPlaces[0].id;

    function Harness() {
      useNaverTourismMarkers({
        status: 'ready',
        mapsApi,
        mapRef,
        viewportVersion: 0,
        tourismPlaces: productionLikeTourismPlaces,
        selectedTourismPlaceId,
        onSelectTourismPlace,
      });
      return null;
    }

    try {
      render(<Harness />);

      act(() => {
        vi.runAllTimers();
      });

      expect(markerRecords).toHaveLength(NaverMarkerConfig.materialization.tourismViewportMarkerLimit + 1);
      expect(markerRecords.some((marker) => marker.options.zIndex === NaverMarkerConfig.zIndex.tourismActive)).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it('uses the fallback marker cap and batches creation when map bounds are unavailable', () => {
    vi.useFakeTimers();
    const markerRecords: MarkerRecord[] = [];
    const mapsApi = createMapsApi(markerRecords);
    const mapRef = {
      current: {
        getCenter: () => ({ lat: () => 36.35, lng: () => 127.38 }),
        getZoom: () => 13,
      },
    };
    const onSelectTourismPlace = vi.fn();
    const allTourismPlaces = buildTourismPlaces(200);

    function Harness() {
      useNaverTourismMarkers({
        status: 'ready',
        mapsApi,
        mapRef,
        viewportVersion: 0,
        tourismPlaces: allTourismPlaces,
        selectedTourismPlaceId: null,
        onSelectTourismPlace,
      });
      return null;
    }

    try {
      render(<Harness />);

      expect(markerRecords).toHaveLength(NaverMarkerConfig.materialization.tourismMarkerBatchSize);

      act(() => {
        vi.runAllTimers();
      });

      expect(markerRecords).toHaveLength(NaverMarkerConfig.materialization.tourismFallbackMarkerLimit);
    } finally {
      vi.useRealTimers();
    }
  });
});
