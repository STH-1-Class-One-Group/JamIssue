import type { Place, StampLog, TravelSession } from '../types';

const KOREA_TIME_ZONE = 'Asia/Seoul';

export function calculateDistanceMeters(
  startLatitude: number,
  startLongitude: number,
  endLatitude: number,
  endLongitude: number,
) {
  // Haversine 공식: 지구 표면의 2개 지점 간 대원거리(최단 거리) 계산
  // 스탬프 거리제한(120m 반경) 검증에 사용
  const earthRadiusMeters = 6_371_000;
  const latitudeDelta = ((endLatitude - startLatitude) * Math.PI) / 180;
  const longitudeDelta = ((endLongitude - startLongitude) * Math.PI) / 180;
  const startLatitudeRadians = (startLatitude * Math.PI) / 180;
  const endLatitudeRadians = (endLatitude * Math.PI) / 180;

  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(startLatitudeRadians) * Math.cos(endLatitudeRadians) * Math.sin(longitudeDelta / 2) ** 2;

  return earthRadiusMeters * (2 * Math.asin(Math.sqrt(haversine)));
}

export function formatDistanceMeters(distanceMeters: number) {
  if (distanceMeters < 1000) {
    return `${Math.round(distanceMeters)}m`;
  }

  return `${(distanceMeters / 1000).toFixed(1)}km`;
}

// 오늘 해당 장소를 방문했는지 확인 (하루 1회 스탐프 제한)
export function getTodayStampLog(stampLogs: StampLog[], placeId: string) {
  return stampLogs.find((stampLog) => stampLog.placeId === placeId && stampLog.isToday) ?? null;
}

// 해당 장소를 몇 번 방문했는지 카운트
export function getPlaceVisitCount(stampLogs: StampLog[], placeId: string) {
  return stampLogs.filter((stampLog) => stampLog.placeId === placeId).length;
}

// 가장 최근 방문 기록 조회 (visitLabel에서 "1시간 전" 등으로 표시)
export function getLatestPlaceStamp(stampLogs: StampLog[], placeId: string) {
  return stampLogs.find((stampLog) => stampLog.placeId === placeId) ?? null;
}

export function getTravelSessionCoverPlace(places: Place[], session: TravelSession) {
  if (!session.coverPlaceId) {
    return null;
  }

  return places.find((place) => place.id === session.coverPlaceId) ?? null;
}

export function formatTripWindowLabel(startedAt: string, endedAt: string) {
  const formatter = new Intl.DateTimeFormat('ko-KR', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: KOREA_TIME_ZONE,
  });

  const startDate = new Date(startedAt);
  const endDate = new Date(endedAt);
  return `${formatter.format(startDate)} - ${formatter.format(endDate)}`;
}
