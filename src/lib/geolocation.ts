import { calculateDistanceMeters, formatDistanceMeters } from './visits';

export interface CurrentDeviceLocation {
  latitude: number;
  longitude: number;
  accuracyMeters: number;
}

// 대전 시청 좌표 (대전 범역 외 위치 거부용)
const DAEJEON_CENTER = { latitude: 36.3504, longitude: 127.3845 };
// 대전 범역 반경 (45km, 대전시 실제 운영 범위 기준)
const DAEJEON_VALID_RADIUS_METERS = 45_000;
// GPS 정확도 요구 (5km 이상 오차면 "위치 정확도 부족" 재요청)
const MAX_ACCEPTABLE_LOCATION_ACCURACY_METERS = 5_000;
// GPS 정확도 우수 기준 (150m 이내면 바로 반환, 더 나은 값 대기 X)
const EARLY_SUCCESS_LOCATION_ACCURACY_METERS = 150;

function validateCurrentDevicePosition(position: GeolocationPosition): CurrentDeviceLocation {
  const nextPosition = {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    accuracyMeters: Math.round(position.coords.accuracy ?? 0),
  };

  // 대전시 밖 위치 감지 시 및시 거부
  const distanceFromDaejeon = calculateDistanceMeters(
    DAEJEON_CENTER.latitude,
    DAEJEON_CENTER.longitude,
    nextPosition.latitude,
    nextPosition.longitude,
  );

  if (distanceFromDaejeon > DAEJEON_VALID_RADIUS_METERS) {
    throw new Error('현재 위치가 대전 반경 밖으로 잡혔어요. 위치 서비스나 Wi-Fi를 켠 뒤 다시 확인해 주세요.');
  }

  // GPS 정확도 부족 시 재요청 (Wi-Fi 기반 위치정보는 오차 큼)
  if (nextPosition.accuracyMeters > MAX_ACCEPTABLE_LOCATION_ACCURACY_METERS) {
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

    // watchPosition으로 위치 변화 감지: 더 나은 정확도가 나올 때까지 대기
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

        if (position.coords.accuracy <= EARLY_SUCCESS_LOCATION_ACCURACY_METERS) {
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
      {
        enableHighAccuracy: true,
        timeout: 10_000,
        maximumAge: 0,
      },
    );

    timeoutId = window.setTimeout(() => {
      finishWithBestPosition(watchId);
    }, 8_000);
  });
}
