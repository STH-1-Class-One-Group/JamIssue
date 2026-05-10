import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { NaverMarkerConfig } from '../../src/config/mapConfig';
import { useNaverFestivalMarkers } from '../../src/components/naver-map/useNaverFestivalMarkers';
import { useNaverPlaceMarkers } from '../../src/components/naver-map/useNaverPlaceMarkers';
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

const festivals = [
  { id: 'festival-1', latitude: 36.4, longitude: 127.4 },
  { id: 'festival-2', latitude: 36.5, longitude: 127.5 },
  { id: 'festival-3', latitude: 36.6, longitude: 127.6 },
] as FestivalItem[];

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
});
