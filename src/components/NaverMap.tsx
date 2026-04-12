import { useRef } from 'react';
import { getClientConfig } from '../config';
import type { ApiStatus, FestivalItem, Place } from '../types';
import { NaverMapStatus } from './naver-map/NaverMapStatus';
import { useNaverMapInstance } from './naver-map/useNaverMapInstance';
import { useNaverMapInteractions } from './naver-map/useNaverMapInteractions';
import { useNaverViewportChangeRef } from './naver-map/useNaverViewportChangeRef';
import { useNaverViewportSync } from './naver-map/useNaverViewportSync';

interface NaverMapProps {
  places: Place[];
  festivals: FestivalItem[];
  selectedPlaceId: string | null;
  selectedFestivalId: string | null;
  onSelectPlace: (placeId: string) => void;
  onSelectFestival: (festivalId: string) => void;
  currentPosition: { latitude: number; longitude: number } | null;
  currentLocationStatus: ApiStatus;
  currentLocationMessage: string | null;
  focusCurrentLocationKey: number;
  onLocateCurrentPosition: () => void;
  initialCenter?: { lat: number; lng: number };
  initialZoom?: number;
  onViewportChange?: (lat: number, lng: number, zoom: number) => void;
  routePreviewPlaces?: Place[];
  height?: string;
}

export function NaverMap({
  places,
  festivals,
  selectedPlaceId,
  selectedFestivalId,
  onSelectPlace,
  onSelectFestival,
  currentPosition,
  currentLocationStatus,
  currentLocationMessage,
  focusCurrentLocationKey,
  onLocateCurrentPosition,
  initialCenter,
  initialZoom,
  onViewportChange,
  routePreviewPlaces = [],
  height = '100%',
}: NaverMapProps) {
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const onViewportChangeRef = useNaverViewportChangeRef(onViewportChange);
  const clientId = getClientConfig().naverMapClientId;

  const { mapRef, status, errorMessage } = useNaverMapInstance({
    clientId,
    mapElementRef,
    initialCenter,
    initialZoom,
  });

  useNaverViewportSync({
    status,
    mapsApi: window.naver?.maps,
    mapRef,
    onViewportChangeRef,
  });

  useNaverMapInteractions({
    status,
    mapsApi: window.naver?.maps,
    mapRef,
    mapElementRef,
    places,
    festivals,
    selectedPlaceId,
    selectedFestivalId,
    onSelectPlace,
    onSelectFestival,
    currentPosition,
    focusCurrentLocationKey,
    routePreviewPlaces,
  });

  return (
    <div className="map-surface-frame">
      <NaverMapStatus
        clientId={clientId}
        status={status}
        errorMessage={errorMessage}
        currentLocationStatus={currentLocationStatus}
        currentLocationMessage={currentLocationMessage}
        currentPosition={currentPosition}
        onLocateCurrentPosition={onLocateCurrentPosition}
      />
      <div ref={mapElementRef} style={{ width: '100%', height }} />
    </div>
  );
}
