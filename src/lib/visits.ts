import { GeoDistanceConfig } from '../config/mapConfig';
import type { StampLog } from '../types';

export function calculateDistanceMeters(
  startLatitude: number,
  startLongitude: number,
  endLatitude: number,
  endLongitude: number,
) {
  const latitudeDelta = ((endLatitude - startLatitude) * Math.PI) / GeoDistanceConfig.degreesPerHalfCircle;
  const longitudeDelta = ((endLongitude - startLongitude) * Math.PI) / GeoDistanceConfig.degreesPerHalfCircle;
  const startLatitudeRadians = (startLatitude * Math.PI) / GeoDistanceConfig.degreesPerHalfCircle;
  const endLatitudeRadians = (endLatitude * Math.PI) / GeoDistanceConfig.degreesPerHalfCircle;

  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(startLatitudeRadians) * Math.cos(endLatitudeRadians) * Math.sin(longitudeDelta / 2) ** 2;

  return GeoDistanceConfig.earthRadiusMeters * (GeoDistanceConfig.haversineMultiplier * Math.asin(Math.sqrt(haversine)));
}

export function formatDistanceMeters(distanceMeters: number) {
  if (distanceMeters < GeoDistanceConfig.kilometerThresholdMeters) {
    return `${Math.round(distanceMeters)}m`;
  }

  return `${(distanceMeters / GeoDistanceConfig.kilometerThresholdMeters).toFixed(GeoDistanceConfig.kilometerFractionDigits)}km`;
}

export function getTodayStampLog(stampLogs: StampLog[], placeId: string) {
  return stampLogs.find((stampLog) => stampLog.placeId === placeId && stampLog.isToday) ?? null;
}

export function getPlaceVisitCount(stampLogs: StampLog[], placeId: string) {
  // Count stamp logs without creating an intermediate array to reduce memory pressure
  let count = 0;
  for (const stampLog of stampLogs) {
    if (stampLog.placeId === placeId) {
      count++;
    }
  }
  return count;
}

export function getLatestPlaceStamp(stampLogs: StampLog[], placeId: string) {
  return stampLogs.find((stampLog) => stampLog.placeId === placeId) ?? null;
}

export function formatReviewVisitedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}
