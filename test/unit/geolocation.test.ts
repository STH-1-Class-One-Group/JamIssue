import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { GeolocationConfig } from '../../src/config/mapConfig';
import { getCurrentDevicePosition } from '../../src/lib/geolocation';

type WatchSuccess = PositionCallback;
type WatchError = PositionErrorCallback;

function positionFixture(accuracy: number, overrides: Partial<GeolocationCoordinates> = {}): GeolocationPosition {
  return {
    coords: {
      latitude: GeolocationConfig.validAreaCenter.latitude,
      longitude: GeolocationConfig.validAreaCenter.longitude,
      accuracy,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
      ...overrides,
    },
    timestamp: Date.now(),
  } as GeolocationPosition;
}

function errorFixture(code: number): GeolocationPositionError {
  return {
    code,
    message: `error-${code}`,
    PERMISSION_DENIED: 1,
    POSITION_UNAVAILABLE: 2,
    TIMEOUT: 3,
  } as GeolocationPositionError;
}

function installGeolocationMock() {
  const callbacks: { success?: WatchSuccess; error?: WatchError } = {};
  const geolocation = {
    watchPosition: vi.fn((success: WatchSuccess, error: WatchError) => {
      callbacks.success = success;
      callbacks.error = error;
      return 42;
    }),
    clearWatch: vi.fn(),
  };

  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    value: geolocation,
  });

  return { callbacks, geolocation };
}

describe('getCurrentDevicePosition', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('resolves early when a precise in-area position is received', async () => {
    const { callbacks, geolocation } = installGeolocationMock();

    const pending = getCurrentDevicePosition();
    callbacks.success?.(positionFixture(GeolocationConfig.earlySuccessAccuracyMeters));

    await expect(pending).resolves.toMatchObject({
      latitude: GeolocationConfig.validAreaCenter.latitude,
      longitude: GeolocationConfig.validAreaCenter.longitude,
      accuracyMeters: GeolocationConfig.earlySuccessAccuracyMeters,
    });
    expect(geolocation.clearWatch).toHaveBeenCalledWith(42);
  });

  it('uses the best watched position at settle timeout', async () => {
    const { callbacks } = installGeolocationMock();

    const pending = getCurrentDevicePosition();
    callbacks.success?.(positionFixture(GeolocationConfig.maxAcceptableAccuracyMeters));
    callbacks.success?.(positionFixture(GeolocationConfig.earlySuccessAccuracyMeters + 1));
    await vi.advanceTimersByTimeAsync(GeolocationConfig.settleTimeoutMs);

    await expect(pending).resolves.toMatchObject({
      accuracyMeters: GeolocationConfig.earlySuccessAccuracyMeters + 1,
    });
  });

  it('rejects when geolocation is unavailable or no position arrives before timeout', async () => {
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: undefined,
    });

    await expect(getCurrentDevicePosition()).rejects.toBeInstanceOf(Error);

    installGeolocationMock();
    const pending = getCurrentDevicePosition();
    const rejection = expect(pending).rejects.toBeInstanceOf(Error);
    await vi.advanceTimersByTimeAsync(GeolocationConfig.settleTimeoutMs);

    await rejection;
  });

  it('rejects invalid positions from the best watched candidate', async () => {
    const { callbacks } = installGeolocationMock();

    const farAway = getCurrentDevicePosition();
    const farAwayRejection = expect(farAway).rejects.toBeInstanceOf(Error);
    callbacks.success?.(positionFixture(GeolocationConfig.earlySuccessAccuracyMeters, { latitude: 0, longitude: 0 }));
    await farAwayRejection;

    const nextMock = installGeolocationMock();
    const inaccurate = getCurrentDevicePosition();
    const inaccurateRejection = expect(inaccurate).rejects.toBeInstanceOf(Error);
    nextMock.callbacks.success?.(positionFixture(GeolocationConfig.maxAcceptableAccuracyMeters + 1));
    await vi.advanceTimersByTimeAsync(GeolocationConfig.settleTimeoutMs);
    await inaccurateRejection;
  });

  it('maps browser geolocation error codes to rejected errors', async () => {
    for (const code of [1, 2, 3, 999]) {
      const { callbacks } = installGeolocationMock();
      const pending = getCurrentDevicePosition();
      const rejection = expect(pending).rejects.toBeInstanceOf(Error);

      callbacks.error?.(errorFixture(code));

      await rejection;
    }
  });
});
