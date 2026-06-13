import { afterEach, describe, expect, it, vi } from 'vitest';
import { getCurrentDevicePosition } from '../../src/lib/geolocation';

const originalGeolocation = navigator.geolocation;

afterEach(() => {
  vi.useRealTimers();
  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    value: originalGeolocation,
  });
});

function installGeolocationMock(mock: Partial<Geolocation>) {
  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    value: mock,
  });
}

function createPosition(latitude: number, longitude: number, accuracy: number): GeolocationPosition {
  return {
    coords: {
      latitude,
      longitude,
      accuracy,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
    },
    timestamp: Date.now(),
  };
}

describe('getCurrentDevicePosition', () => {
  it('resolves a readable Daejeon position when the browser reports accurate coordinates', async () => {
    const clearWatch = vi.fn();
    const watchPosition = vi.fn<Geolocation['watchPosition']>((success) => {
      success(createPosition(36.3504, 127.3845, 30));
      return 7;
    });
    installGeolocationMock({ clearWatch, watchPosition });

    await expect(getCurrentDevicePosition()).resolves.toEqual({
      latitude: 36.3504,
      longitude: 127.3845,
      accuracyMeters: 30,
    });
    expect(clearWatch).toHaveBeenCalledWith(7);
  });

  it('rejects with readable guidance when location permission is denied', async () => {
    const clearWatch = vi.fn();
    const watchPosition = vi.fn<Geolocation['watchPosition']>((_success, error) => {
      error?.({
        code: 1,
        message: 'denied',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      });
      return 9;
    });
    installGeolocationMock({ clearWatch, watchPosition });

    await expect(getCurrentDevicePosition()).rejects.toThrow('브라우저 위치 권한이 꺼져 있어요.');
    expect(clearWatch).toHaveBeenCalledWith(9);
  });
});
