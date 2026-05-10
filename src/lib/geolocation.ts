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

    const cleanup = (watchId: number) => {
      navigator.geolocation.clearWatch(watchId);
      window.clearTimeout(timeoutId);
      finished = true;
    };

    const finishWithError = (watchId: number, error: Error) => {
      if (finished) {
        return;
      }
      cleanup(watchId);
      reject(error);
    };

    const finishWithBestPosition = (watchId: number) => {
      if (finished) {
        return;
      }

      if (!bestPosition) {
        cleanup(watchId);
        reject(new Error('현재 위치를 확인하지 못했어요.'));
        return;
      }

      try {
        const nextPosition = validateCurrentDevicePosition(bestPosition);
        cleanup(watchId);
        resolve(nextPosition);
      } catch (error) {
        cleanup(watchId);
        reject(error instanceof Error ? error : new Error('현재 위치를 확인하지 못했어요.'));
      }
    };

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        if (!bestPosition || position.coords.accuracy < bestPosition.coords.accuracy) {
          bestPosition = position;
        }

        if (position.coords.accuracy <= GeolocationConfig.earlySuccessAccuracyMeters) {
          finishWithBestPosition(watchId);
        }
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          finishWithError(watchId, new Error('브라우저 위치 권한이 꺼져 있어요. 위치 권한을 허용해 주세요.'));
          return;
        }
        if (error.code === error.POSITION_UNAVAILABLE) {
          finishWithError(watchId, new Error('현재 위치를 찾지 못했어요. GPS가 잘 잡히는 곳에서 다시 시도해 주세요.'));
          return;
        }
        if (error.code === error.TIMEOUT) {
          finishWithError(watchId, new Error('위치 확인 시간이 초과됐어요. 다시 시도해 주세요.'));
          return;
        }
        finishWithError(watchId, new Error('현재 위치를 확인하지 못했어요.'));
      },
      GeolocationConfig.watchOptions,
    );

    timeoutId = window.setTimeout(() => {
      finishWithBestPosition(watchId);
    }, GeolocationConfig.settleTimeoutMs);
  });
}
