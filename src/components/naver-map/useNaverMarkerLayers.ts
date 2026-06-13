/*
 * File: useNaverMarkerLayers.ts
 * Purpose: Coordinate Naver map marker layer hooks for curated places, festivals, and KTO tourism items.
 * Primary Responsibility: Keep marker-layer composition local to the naver-map owner folder.
 * Design Intent: Let useNaverMapInteractions stay focused on high-level map orchestration.
 * Non-Goals: This hook does not fetch marker data or decide selected sheet state.
 * Dependencies: Naver marker hooks and typed app DTOs.
 */
import type { TourismPlaceItem } from '../../tourismTypes';
import type { FestivalItem, Place } from '../../types/core';
import { useNaverFestivalMarkers } from './useNaverFestivalMarkers';
import { useNaverPlaceMarkers } from './useNaverPlaceMarkers';
import { useNaverTourismMarkers } from './useNaverTourismMarkers';
import type { NaverMapInstance, NaverMapsApi } from './naverMapTypes';

type MarkerLayersArgs = {
  status: 'loading' | 'ready' | 'error';
  mapsApi: NaverMapsApi | undefined;
  mapRef: React.MutableRefObject<NaverMapInstance | null>;
  places: Place[];
  festivals: FestivalItem[];
  tourismPlaces: TourismPlaceItem[];
  selectedPlaceId: string | null;
  selectedFestivalId: string | null;
  selectedTourismPlaceId: string | null;
  onSelectPlace: (placeId: string) => void;
  onSelectFestival: (festivalId: string) => void;
  onSelectTourismPlace: (tourismPlaceId: string) => void;
};

export function useNaverMarkerLayers({
  status,
  mapsApi,
  mapRef,
  places,
  festivals,
  tourismPlaces,
  selectedPlaceId,
  selectedFestivalId,
  selectedTourismPlaceId,
  onSelectPlace,
  onSelectFestival,
  onSelectTourismPlace,
}: MarkerLayersArgs) {
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

  useNaverTourismMarkers({
    status,
    mapsApi,
    mapRef,
    tourismPlaces,
    selectedTourismPlaceId,
    onSelectTourismPlace,
  });
}
