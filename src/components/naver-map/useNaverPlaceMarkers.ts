import { useEffect, useRef } from 'react';
import type { MutableRefObject } from 'react';
import { NaverMarkerConfig } from '../../config/mapConfig';
import type { Place } from '../../types/core';
import { placeMarkerContent } from './markerContent';
import type { NaverMapInstance, NaverMapsApi, NaverMarkerInstance } from './naverMapTypes';

type PlaceMarkersArgs = {
  status: 'loading' | 'ready' | 'error';
  mapsApi: NaverMapsApi | undefined;
  mapRef: MutableRefObject<NaverMapInstance | null>;
  places: Place[];
  selectedPlaceId: string | null;
  onSelectPlace: (placeId: string) => void;
};

export function useNaverPlaceMarkers({
  status,
  mapsApi,
  mapRef,
  places,
  selectedPlaceId,
  onSelectPlace,
}: PlaceMarkersArgs) {
  const placeMarkersRef = useRef<Map<string, NaverMarkerInstance>>(new Map());

  useEffect(() => {
    if (status !== 'ready' || !mapsApi || !mapRef.current) {
      return;
    }

    const nextIds = new Set<string>();
    for (const place of places) {
      nextIds.add(place.id);
    }
    const markerAnchor = new mapsApi.Point(NaverMarkerConfig.anchor.default.x, NaverMarkerConfig.anchor.default.y);

    for (const [placeId, marker] of placeMarkersRef.current.entries()) {
      if (!nextIds.has(placeId)) {
        marker.setMap(null);
        placeMarkersRef.current.delete(placeId);
      }
    }

    places.forEach((place) => {
      const existing = placeMarkersRef.current.get(place.id);
      const position = new mapsApi.LatLng(place.latitude, place.longitude);
      if (existing) {
        existing.setPosition(position);
        return;
      }

      const marker = new mapsApi.Marker({
        map: mapRef.current,
        position,
        title: '',
        icon: {
          content: placeMarkerContent(place, place.id === selectedPlaceId),
          anchor: markerAnchor,
        },
      });
      mapsApi.Event.addListener(marker, 'click', () => onSelectPlace(place.id));
      placeMarkersRef.current.set(place.id, marker);
    });
  }, [mapRef, mapsApi, onSelectPlace, places, status]);

  const prevSelectedPlaceIdRef = useRef<string | null>(selectedPlaceId);
  const prevPlacesRef = useRef<Place[]>(places);

  useEffect(() => {
    if (status !== 'ready' || !mapsApi || !mapRef.current) {
      return;
    }

    const isPlacesSame = places === prevPlacesRef.current;
    const prevSelectedId = prevSelectedPlaceIdRef.current;
    const markerAnchor = new mapsApi.Point(NaverMarkerConfig.anchor.default.x, NaverMarkerConfig.anchor.default.y);

    if (isPlacesSame && prevSelectedId !== selectedPlaceId) {
      if (prevSelectedId) {
        const prevPlace = places.find((p) => p.id === prevSelectedId);
        const prevMarker = placeMarkersRef.current.get(prevSelectedId);
        if (prevPlace && prevMarker) {
          prevMarker.setIcon({
            content: placeMarkerContent(prevPlace, false),
            anchor: markerAnchor,
          });
          prevMarker.setZIndex(NaverMarkerConfig.zIndex.placeDefault);
        }
      }

      if (selectedPlaceId) {
        const nextPlace = places.find((p) => p.id === selectedPlaceId);
        const nextMarker = placeMarkersRef.current.get(selectedPlaceId);
        if (nextPlace && nextMarker) {
          nextMarker.setIcon({
            content: placeMarkerContent(nextPlace, true),
            anchor: markerAnchor,
          });
          nextMarker.setZIndex(NaverMarkerConfig.zIndex.placeActive);
        }
      }
    } else {
      places.forEach((place) => {
        const marker = placeMarkersRef.current.get(place.id);
        if (!marker) {
          return;
        }
        marker.setIcon({
          content: placeMarkerContent(place, place.id === selectedPlaceId),
          anchor: markerAnchor,
        });
        marker.setZIndex(place.id === selectedPlaceId ? NaverMarkerConfig.zIndex.placeActive : NaverMarkerConfig.zIndex.placeDefault);
      });
    }

    prevSelectedPlaceIdRef.current = selectedPlaceId;
    prevPlacesRef.current = places;
  }, [mapRef, mapsApi, places, selectedPlaceId, status]);
}
