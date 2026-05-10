import { useEffect, useRef } from 'react';
import type { MutableRefObject } from 'react';
import { NaverMarkerConfig } from '../../config/mapConfig';
import { currentLocationMarkerContent } from './markerContent';

type MapsApi = typeof window.naver.maps;

type CurrentLocationMarkerArgs = {
  status: 'loading' | 'ready' | 'error';
  mapsApi: MapsApi | undefined;
  mapRef: MutableRefObject<any>;
  currentPosition: { latitude: number; longitude: number } | null;
};

export function useNaverCurrentLocationMarker({
  status,
  mapsApi,
  mapRef,
  currentPosition,
}: CurrentLocationMarkerArgs) {
  const currentMarkerRef = useRef<any | null>(null);

  useEffect(() => {
    if (status !== 'ready' || !mapsApi || !mapRef.current) {
      return;
    }

    if (!currentPosition) {
      if (currentMarkerRef.current) {
        currentMarkerRef.current.setMap(null);
        currentMarkerRef.current = null;
      }
      return;
    }

    const position = new mapsApi.LatLng(currentPosition.latitude, currentPosition.longitude);
    if (!currentMarkerRef.current) {
      currentMarkerRef.current = new mapsApi.Marker({
        map: mapRef.current,
        position,
        title: '',
        zIndex: NaverMarkerConfig.zIndex.currentLocation,
        icon: {
          content: currentLocationMarkerContent(),
          anchor: new mapsApi.Point(NaverMarkerConfig.anchor.default.x, NaverMarkerConfig.anchor.default.y),
        },
      });
      return;
    }

    currentMarkerRef.current.setPosition(position);
    currentMarkerRef.current.setMap(mapRef.current);
  }, [currentPosition, mapRef, mapsApi, status]);
}
