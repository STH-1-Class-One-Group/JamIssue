import { useRef } from 'react';
import type { TourismPlaceItem } from '../../tourismTypes';
import type { FestivalItem, Place } from '../../types/core';
import { useNaverCurrentLocationMarker } from './useNaverCurrentLocationMarker';
import { useNaverCurrentLocationFocus } from './useNaverCurrentLocationFocus';
import { useNaverMarkerLayers } from './useNaverMarkerLayers';
import { useNaverRoutePreviewOverlay } from './useNaverRoutePreviewOverlay';
import { useNaverSelectionSync } from './useNaverSelectionSync';
import type { NaverMapInstance, NaverMapsApi, NaverMarkerInstance, NaverPolylineInstance } from './naverMapTypes';

type MapInteractionsArgs = {
  status: 'loading' | 'ready' | 'error';
  mapsApi: NaverMapsApi | undefined;
  mapRef: React.MutableRefObject<NaverMapInstance | null>;
  mapElementRef: React.MutableRefObject<HTMLDivElement | null>;
  viewportVersion: number;
  places: Place[];
  festivals: FestivalItem[];
  tourismPlaces: TourismPlaceItem[];
  selectedPlaceId: string | null;
  selectedFestivalId: string | null;
  selectedTourismPlaceId: string | null;
  selectedPlace?: Place | null;
  selectedFestival?: FestivalItem | null;
  onSelectPlace: (placeId: string) => void;
  onSelectFestival: (festivalId: string) => void;
  onSelectTourismPlace: (tourismPlaceId: string) => void;
  currentPosition: { latitude: number; longitude: number } | null;
  focusCurrentLocationKey: number;
  routePreviewPlaces: Place[];
};

export function useNaverMapInteractions({
  status,
  mapsApi,
  mapRef,
  mapElementRef,
  viewportVersion,
  places,
  festivals,
  tourismPlaces,
  selectedPlaceId,
  selectedFestivalId,
  selectedTourismPlaceId,
  selectedPlace,
  selectedFestival,
  onSelectPlace,
  onSelectFestival,
  onSelectTourismPlace,
  currentPosition,
  focusCurrentLocationKey,
  routePreviewPlaces,
}: MapInteractionsArgs) {
  const routeLineRef = useRef<NaverPolylineInstance | null>(null);
  const routeStepMarkersRef = useRef<NaverMarkerInstance[]>([]);
  const lastHandledCurrentLocationFocusKeyRef = useRef(0);

  useNaverMarkerLayers({
    status,
    mapsApi,
    mapRef,
    viewportVersion,
    places,
    festivals,
    tourismPlaces,
    selectedPlaceId,
    selectedFestivalId,
    selectedTourismPlaceId,
    onSelectPlace,
    onSelectFestival,
    onSelectTourismPlace,
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
    selectedPlace,
    selectedFestival,
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
