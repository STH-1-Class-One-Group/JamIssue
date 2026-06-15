import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useNaverMapInstance } from '../../src/components/naver-map/useNaverMapInstance';
import { loadNaverMaps } from '../../src/components/naver-map/mapSdk';

vi.mock('../../src/components/naver-map/mapSdk', () => ({
  DAEJEON_CENTER: { latitude: 36.3504, longitude: 127.3845 },
  loadNaverMaps: vi.fn(),
}));

describe('useNaverMapInstance', () => {
  it('disables the Naver default zoom control for the floating capsule map shell', async () => {
    const mapConstructor = vi.fn(function MapMock() {
      return {
        getCenter: () => ({ lat: () => 36.3504, lng: () => 127.3845 }),
        getZoom: () => 13,
      };
    });
    const latLngConstructor = vi.fn(function LatLngMock(lat: number, lng: number) {
      return { lat: () => lat, lng: () => lng };
    });
    vi.mocked(loadNaverMaps).mockResolvedValue({
      LatLng: latLngConstructor,
      Map: mapConstructor,
    } as unknown as Awaited<ReturnType<typeof loadNaverMaps>>);

    const mapElement = document.createElement('div');
    renderHook(() => useNaverMapInstance({
      clientId: 'client-id',
      mapElementRef: { current: mapElement },
    }));

    await waitFor(() => expect(mapConstructor).toHaveBeenCalledTimes(1));
    expect(mapConstructor.mock.calls[0][1]).toMatchObject({
      zoomControl: false,
      scaleControl: false,
      logoControl: false,
      mapDataControl: false,
    });
  });
});
