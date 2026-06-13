/*
 * File: geolocation.ts
 * Purpose: Resolve the browser's current device position for map and stamp flows.
 * Primary Responsibility: Convert browser geolocation callbacks into validated Daejeon-area coordinates.
 * Design Intent: Keep browser API quirks and user-readable failure messages behind one promise-based boundary.
 * Non-Goals: This module does not move the map, claim stamps, or render UI feedback.
 * Dependencies: GeolocationConfig and distance helpers.
 */
import { GeolocationConfig } from '../config/mapConfig';
import { calculateDistanceMeters, formatDistanceMeters } from './visits';

export interface CurrentDeviceLocation {
  latitude: number;
  longitude: number;
  accuracyMeters: number;
}

function validateCurrentDevicePosition(position: GeolocationPosition): CurrentDeviceLocation {
  const nextPosition = {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    accuracyMeters: Math.round(position.coords.accuracy ?? 0),
  };

  const distanceFromDaejeon = calculateDistanceMeters(
    GeolocationConfig.validAreaCenter.latitude,
    GeolocationConfig.validAreaCenter.longitude,
    nextPosition.latitude,
    nextPosition.longitude,
  );

  if (distanceFromDaejeon > GeolocationConfig.validRadiusMeters) {
    throw new Error('현재 위치가 대전 반경 밖으로 잡혔어요. 위치 서비스나 Wi-Fi를 켠 뒤 다시 확인해 주세요.');
  }

  if (nextPosition.accuracyMeters > GeolocationConfig.maxAcceptableAccuracyMeters) {
    throw new Error(`현재 위치 정확도가 약 ${formatDistanceMeters(nextPosition.accuracyMeters)}로 너무 넓어요. 위치를 다시 확인해 주세요.`);
  }

  return nextPosition;
}

export function getCurrentDevicePosition() {
  return new Promise<CurrentDeviceLocation>((resolve, reject) => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      reject(new Error('이 기기에서는 현재 위치 확인을 사용할 수 없어요.'));
      return;
    }

    let bestPosition: GeolocationPosition | null = null;
    let finished = false;
    let timeoutId = 0;
    let watchId: number | null = null;

    const cleanup = () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
      window.clearTimeout(timeoutId);
      finished = true;
    };

    const finishWithError = (error: Error) => {
      if (finished) {
        return;
      }
      cleanup();
      reject(error);
    };

    const finishWithBestPosition = () => {
      if (finished) {
        return;
      }

      if (!bestPosition) {
        cleanup();
        reject(new Error('현재 위치를 확인하지 못했어요.'));
        return;
      }

      try {
        const nextPosition = validateCurrentDevicePosition(bestPosition);
        cleanup();
        resolve(nextPosition);
      } catch (error) {
        cleanup();
        reject(error instanceof Error ? error : new Error('현재 위치를 확인하지 못했어요.'));
      }
    };

    watchId = navigator.geolocation.watchPosition(
      (position) => {
        if (!bestPosition || position.coords.accuracy < bestPosition.coords.accuracy) {
          bestPosition = position;
        }

        if (position.coords.accuracy <= GeolocationConfig.earlySuccessAccuracyMeters) {
          finishWithBestPosition();
        }
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          finishWithError(new Error('브라우저 위치 권한이 꺼져 있어요. 위치 권한을 허용해 주세요.'));
          return;
        }
        if (error.code === error.POSITION_UNAVAILABLE) {
          finishWithError(new Error('현재 위치를 찾지 못했어요. GPS가 잘 잡히는 곳에서 다시 시도해 주세요.'));
          return;
        }
        if (error.code === error.TIMEOUT) {
          finishWithError(new Error('위치 확인 시간이 초과됐어요. 다시 시도해 주세요.'));
          return;
        }
        finishWithError(new Error('현재 위치를 확인하지 못했어요.'));
      },
      GeolocationConfig.watchOptions,
    );
    if (finished && watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      return;
    }

    timeoutId = window.setTimeout(() => {
      finishWithBestPosition();
    }, GeolocationConfig.settleTimeoutMs);
  });
}
