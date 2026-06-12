import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useNaverMapInstance } from '../../src/components/naver-map/useNaverMapInstance';

const mapSdkMocks = vi.hoisted(() => ({
  loadNaverMaps: vi.fn(),
}));

vi.mock('../../src/components/naver-map/mapSdk', () => ({
  DAEJEON_CENTER: { latitude: 36.35, longitude: 127.38 },
  loadNaverMaps: mapSdkMocks.loadNaverMaps,
}));

function mapsApiFixture() {
  class LatLng {
    constructor(public readonly latitude: number, public readonly longitude: number) {}
  }
  const Map = vi.fn(function map(this: { element: HTMLElement; options: unknown }, element: HTMLElement, options: unknown) {
    this.element = element;
    this.options = options;
  });
  return { LatLng, Map };
}

describe('useNaverMapInstance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fails fast when the client id is absent', async () => {
    const mapElement = document.createElement('div');

    const { result } = renderHook(() => useNaverMapInstance({
      clientId: '',
      mapElementRef: { current: mapElement },
    }));

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.errorMessage).toEqual(expect.any(String));
    expect(mapSdkMocks.loadNaverMaps).not.toHaveBeenCalled();
  });

  it('creates the map instance with configured defaults and caller-provided viewport', async () => {
    const mapsApi = mapsApiFixture();
    mapSdkMocks.loadNaverMaps.mockResolvedValue(mapsApi);
    const mapElement = document.createElement('div');

    const { result } = renderHook(() => useNaverMapInstance({
      clientId: 'client-id',
      mapElementRef: { current: mapElement },
      initialCenter: { lat: 36.36, lng: 127.39 },
      initialZoom: 14,
    }));

    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(mapSdkMocks.loadNaverMaps).toHaveBeenCalledWith('client-id');
    expect(mapsApi.Map).toHaveBeenCalledWith(
      mapElement,
      expect.objectContaining({
        center: expect.objectContaining({ latitude: 36.36, longitude: 127.39 }),
        zoom: 14,
        scaleControl: false,
        logoControl: false,
        mapDataControl: false,
        zoomControl: true,
      }),
    );
    expect(result.current.mapRef.current).toBe(mapsApi.Map.mock.instances[0]);
  });

  it('surfaces SDK loading failures through the hook status', async () => {
    mapSdkMocks.loadNaverMaps.mockRejectedValue(new Error('sdk failed'));
    const mapElement = document.createElement('div');

    const { result } = renderHook(() => useNaverMapInstance({
      clientId: 'client-id',
      mapElementRef: { current: mapElement },
    }));

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.errorMessage).toBe('sdk failed');
    expect(result.current.mapRef.current).toBeNull();
  });
});
