import { useRef } from 'react';
import type { FestivalItem, Place } from '../../types/core';
import { useNaverCurrentLocationMarker } from './useNaverCurrentLocationMarker';
import { useNaverCurrentLocationFocus } from './useNaverCurrentLocationFocus';
import { useNaverFestivalMarkers } from './useNaverFestivalMarkers';
import { useNaverPlaceMarkers } from './useNaverPlaceMarkers';
import { useNaverRoutePreviewOverlay } from './useNaverRoutePreviewOverlay';
import { useNaverSelectionSync } from './useNaverSelectionSync';
import type { NaverMapInstance, NaverMapsApi, NaverMarkerInstance, NaverPolylineInstance } from './naverMapTypes';

type MapInteractionsArgs = {
  status: 'loading' | 'ready' | 'error';
  mapsApi: NaverMapsApi | undefined;
  mapRef: React.MutableRefObject<NaverMapInstance | null>;
  mapElementRef: React.MutableRefObject<HTMLDivElement | null>;
  places: Place[];
  festivals: FestivalItem[];
  selectedPlaceId: string | null;
  selectedFestivalId: string | null;
  onSelectPlace: (placeId: string) => void;
  onSelectFestival: (festivalId: string) => void;
  currentPosition: { latitude: number; longitude: number } | null;
  focusCurrentLocationKey: number;
  routePreviewPlaces: Place[];
};

export function useNaverMapInteractions({
  status,
  mapsApi,
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
}: MapInteractionsArgs) {
  const routeLineRef = useRef<NaverPolylineInstance | null>(null);
  const routeStepMarkersRef = useRef<NaverMarkerInstance[]>([]);
  const lastHandledCurrentLocationFocusKeyRef = useRef(0);

  useNaverPlaceMarkers({
    status,
    mapsApi,
    mapRef,
    places,
    selectedPlaceId,
    onSelectPlace,
  });

  useNaverFestivalMarkers({
    status,
    mapsApi,
    mapRef,
    festivals,
    selectedFestivalId,
    onSelectFestival,
  });

  useNaverCurrentLocationMarker({
    status,
    mapsApi,
    mapRef,
    currentPosition,
  });

  useNaverSelectionSync({
    status,
    mapsApi,
    mapRef,
    mapElementRef,
    places,
    festivals,
    selectedPlaceId,
    selectedFestivalId,
  });

  useNaverCurrentLocationFocus({
    status,
    mapsApi,
    mapRef,
    currentPosition,
    focusCurrentLocationKey,
    selectedPlaceId,
    selectedFestivalId,
    lastHandledCurrentLocationFocusKeyRef,
  });

  useNaverRoutePreviewOverlay({
    status,
    mapsApi,
    mapRef,
    routeLineRef,
    routeStepMarkersRef,
    routePreviewPlaces,
    selectedPlaceId,
    selectedFestivalId,
  });
}
