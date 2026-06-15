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
import { tourismMarkerContent } from './markerContent';
import type { NaverMapInstance, NaverMapsApi, NaverMarkerInstance } from './naverMapTypes';
import { selectTourismPlacesForMarkerMaterialization } from './tourismMarkerMaterialization';

type TourismMarkersArgs = {
  status: 'loading' | 'ready' | 'error';
  mapsApi: NaverMapsApi | undefined;
  mapRef: MutableRefObject<NaverMapInstance | null>;
  viewportVersion: number;
  tourismPlaces: TourismPlaceItem[];
  selectedTourismPlaceId: string | null;
  onSelectTourismPlace: (tourismPlaceId: string) => void;
};

export function useNaverTourismMarkers({
  status,
  mapsApi,
  mapRef,
  viewportVersion,
  tourismPlaces,
  selectedTourismPlaceId,
  onSelectTourismPlace,
}: TourismMarkersArgs) {
  const tourismMarkersRef = useRef<Map<string, NaverMarkerInstance>>(new Map());
  const markerBatchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (status !== 'ready' || !mapsApi || !mapRef.current) {
      return;
    }

    const visiblePlaces = selectTourismPlacesForMarkerMaterialization({
      mapsApi,
      map: mapRef.current,
      selectedTourismPlaceId,
      tourismPlaces,
    });
    const nextIds = new Set(visiblePlaces.map((place) => place.id));
    const markerAnchor = new mapsApi.Point(NaverMarkerConfig.anchor.default.x, NaverMarkerConfig.anchor.default.y);
    let cancelled = false;
    let nextPlaceIndex = 0;

    if (markerBatchTimerRef.current !== null) {
      clearTimeout(markerBatchTimerRef.current);
      markerBatchTimerRef.current = null;
    }
    for (const [placeId, marker] of tourismMarkersRef.current.entries()) {
      if (!nextIds.has(placeId)) {
        marker.setMap(null);
        tourismMarkersRef.current.delete(placeId);
      }
    }

    const syncMarker = (place: typeof visiblePlaces[number]) => {
      if (!mapRef.current) {
        return;
      }

      const existing = tourismMarkersRef.current.get(place.id);
      const position = new mapsApi.LatLng(place.latitude, place.longitude);
      const zIndex = place.id === selectedTourismPlaceId ? NaverMarkerConfig.zIndex.tourismActive : NaverMarkerConfig.zIndex.tourismDefault;
      const icon = {
        content: tourismMarkerContent(place, place.id === selectedTourismPlaceId),
        anchor: markerAnchor,
      };

      if (existing) {
        existing.setPosition(position);
        existing.setIcon(icon);
        existing.setZIndex(zIndex);
        return;
      }

      const marker = new mapsApi.Marker({
        map: mapRef.current,
        position,
        title: '',
        zIndex,
        icon,
      });
      mapsApi.Event.addListener(marker, 'click', () => onSelectTourismPlace(place.id));
      tourismMarkersRef.current.set(place.id, marker);
    };

    const syncNextBatch = () => {
      if (cancelled) {
        return;
      }

      const nextBatchEnd = Math.min(nextPlaceIndex + NaverMarkerConfig.materialization.tourismMarkerBatchSize, visiblePlaces.length);
      for (; nextPlaceIndex < nextBatchEnd; nextPlaceIndex += 1) {
        syncMarker(visiblePlaces[nextPlaceIndex]);
      }

      if (nextPlaceIndex < visiblePlaces.length) {
        markerBatchTimerRef.current = setTimeout(syncNextBatch, NaverMarkerConfig.materialization.tourismMarkerBatchDelayMs);
      }
    };

    syncNextBatch();

    return () => {
      cancelled = true;
      if (markerBatchTimerRef.current !== null) {
        clearTimeout(markerBatchTimerRef.current);
        markerBatchTimerRef.current = null;
      }
    };
  }, [mapRef, mapsApi, onSelectTourismPlace, selectedTourismPlaceId, status, tourismPlaces, viewportVersion]);
}
