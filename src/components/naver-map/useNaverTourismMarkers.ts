/*
 * File: useNaverTourismMarkers.ts
 * Purpose: Render optional KTO tourism information markers on the Naver map.
 * Primary Responsibility: Synchronize tourism marker instances with the current tourism overlay items and selected marker id.
 * Design Intent: Keep Naver SDK mutation isolated inside the naver-map owner folder while the rest of the app uses typed tourism DTOs.
 * Non-Goals: This hook does not fetch tourism data or render the InfoSheet.
 * Dependencies: Naver Maps SDK local contracts, tourism marker HTML helpers, and React effects.
 */
import { useEffect, useRef } from 'react';
import type { MutableRefObject } from 'react';
import { NaverMarkerConfig } from '../../config/mapConfig';
import type { TourismPlaceItem } from '../../tourismTypes';
import { hasTourismCoordinates, tourismMarkerContent } from './markerContent';
import type { NaverMapInstance, NaverMapsApi, NaverMarkerInstance } from './naverMapTypes';

type TourismPlaceWithCoordinates = TourismPlaceItem & {
  latitude: number;
  longitude: number;
};

type TourismMarkersArgs = {
  status: 'loading' | 'ready' | 'error';
  mapsApi: NaverMapsApi | undefined;
  mapRef: MutableRefObject<NaverMapInstance | null>;
  tourismPlaces: TourismPlaceItem[];
  selectedTourismPlaceId: string | null;
  onSelectTourismPlace: (tourismPlaceId: string) => void;
};

export function useNaverTourismMarkers({
  status,
  mapsApi,
  mapRef,
  tourismPlaces,
  selectedTourismPlaceId,
  onSelectTourismPlace,
}: TourismMarkersArgs) {
  const tourismMarkersRef = useRef<Map<string, NaverMarkerInstance>>(new Map());

  useEffect(() => {
    if (status !== 'ready' || !mapsApi || !mapRef.current) {
      return;
    }

    const visiblePlaces: TourismPlaceWithCoordinates[] = tourismPlaces
      .filter(hasTourismCoordinates)
      .filter((place) => !place.isCurated);
    const nextIds = new Set(visiblePlaces.map((place) => place.id));
    const markerAnchor = new mapsApi.Point(NaverMarkerConfig.anchor.default.x, NaverMarkerConfig.anchor.default.y);

    for (const [placeId, marker] of tourismMarkersRef.current.entries()) {
      if (!nextIds.has(placeId)) {
        marker.setMap(null);
        tourismMarkersRef.current.delete(placeId);
      }
    }

    visiblePlaces.forEach((place) => {
      const existing = tourismMarkersRef.current.get(place.id);
      const position = new mapsApi.LatLng(place.latitude, place.longitude);
      if (existing) {
        existing.setPosition(position);
        existing.setIcon({
          content: tourismMarkerContent(place, place.id === selectedTourismPlaceId),
          anchor: markerAnchor,
        });
        existing.setZIndex(place.id === selectedTourismPlaceId ? NaverMarkerConfig.zIndex.festivalActive : NaverMarkerConfig.zIndex.festivalDefault);
        return;
      }

      const marker = new mapsApi.Marker({
        map: mapRef.current,
        position,
        title: '',
        zIndex: place.id === selectedTourismPlaceId ? NaverMarkerConfig.zIndex.festivalActive : NaverMarkerConfig.zIndex.festivalDefault,
        icon: {
          content: tourismMarkerContent(place, place.id === selectedTourismPlaceId),
          anchor: markerAnchor,
        },
      });
      mapsApi.Event.addListener(marker, 'click', () => onSelectTourismPlace(place.id));
      tourismMarkersRef.current.set(place.id, marker);
    });
  }, [mapRef, mapsApi, onSelectTourismPlace, selectedTourismPlaceId, status, tourismPlaces]);
}
