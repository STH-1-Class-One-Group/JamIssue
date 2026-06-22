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
  const markerBatchFrameRef = useRef<number | null>(null);
  const markerBatchPendingRef = useRef(false);
  const previousSelectedTourismPlaceIdRef = useRef<string | null>(null);
  const previousVisibleSignatureRef = useRef('');

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

    // OPTIMIZATION: Reduce intermediate O(N) array allocations by populating
    // nextIds, signature parts, and placeById in a single pass instead of
    // multiple array.map() iterations over potentially large marker collections.
    const nextIds = new Set<string>();
    const signatureParts: string[] = [];
    const placeById = new Map<string, typeof visiblePlaces[number]>();

    for (const place of visiblePlaces) {
      nextIds.add(place.id);
      signatureParts.push(`${place.id}:${place.latitude}:${place.longitude}`);
      placeById.set(place.id, place);
    }

    const visibleSignature = signatureParts.join('|');
    const markerAnchor = new mapsApi.Point(NaverMarkerConfig.anchor.default.x, NaverMarkerConfig.anchor.default.y);
    let cancelled = false;

    if (markerBatchFrameRef.current !== null) {
      cancelAnimationFrame(markerBatchFrameRef.current);
      markerBatchFrameRef.current = null;
    }

    const updateMarkerVisual = (place: typeof visiblePlaces[number], marker: NaverMarkerInstance) => {
      const zIndex = place.id === selectedTourismPlaceId ? NaverMarkerConfig.zIndex.tourismActive : NaverMarkerConfig.zIndex.tourismDefault;
      marker.setIcon({
        content: tourismMarkerContent(place, place.id === selectedTourismPlaceId),
        anchor: markerAnchor,
      });
      marker.setZIndex(zIndex);
    };

    if (previousVisibleSignatureRef.current === visibleSignature && !markerBatchPendingRef.current) {
      const idsToRefresh = new Set([
        previousSelectedTourismPlaceIdRef.current,
        selectedTourismPlaceId,
      ].filter((placeId): placeId is string => Boolean(placeId)));

      for (const placeId of idsToRefresh) {
        const place = placeById.get(placeId);
        const marker = tourismMarkersRef.current.get(placeId);
        if (place && marker) {
          updateMarkerVisual(place, marker);
        }
      }

      previousSelectedTourismPlaceIdRef.current = selectedTourismPlaceId;
      return;
    }

    const createMarker = (place: typeof visiblePlaces[number]) => {
      if (!mapRef.current) {
        return;
      }

      if (tourismMarkersRef.current.has(place.id)) {
        return;
      }

      const position = new mapsApi.LatLng(place.latitude, place.longitude);
      const zIndex = place.id === selectedTourismPlaceId ? NaverMarkerConfig.zIndex.tourismActive : NaverMarkerConfig.zIndex.tourismDefault;
      const icon = {
        content: tourismMarkerContent(place, place.id === selectedTourismPlaceId),
        anchor: markerAnchor,
      };

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

    const idsToRefresh = new Set([
      previousSelectedTourismPlaceIdRef.current,
      selectedTourismPlaceId,
    ].filter((placeId): placeId is string => Boolean(placeId)));

    // OPTIMIZATION: Construct operations array using sequential for-loops
    // to prevent intermediate array allocations and chained .filter().map()
    // passes. This avoids spread operator allocations for large arrays.
    const operations: Array<() => void> = [];

    for (const placeId of tourismMarkersRef.current.keys()) {
      if (!nextIds.has(placeId)) {
        operations.push(() => {
          const marker = tourismMarkersRef.current.get(placeId);
          marker?.setMap(null);
          tourismMarkersRef.current.delete(placeId);
        });
      }
    }

    for (const place of visiblePlaces) {
      if (!tourismMarkersRef.current.has(place.id)) {
        operations.push(() => createMarker(place));
      }
    }

    for (const placeId of idsToRefresh) {
      operations.push(() => {
        const place = placeById.get(placeId);
        const marker = tourismMarkersRef.current.get(placeId);
        if (place && marker) {
          updateMarkerVisual(place, marker);
        }
      });
    }

    let nextOperationIndex = 0;
    markerBatchPendingRef.current = operations.length > 0;

    const runNextBatch = () => {
      if (cancelled) {
        return;
      }

      const nextBatchEnd = Math.min(nextOperationIndex + NaverMarkerConfig.materialization.tourismMarkerBatchSize, operations.length);
      for (; nextOperationIndex < nextBatchEnd; nextOperationIndex += 1) {
        operations[nextOperationIndex]();
      }

      if (nextOperationIndex < operations.length) {
        markerBatchFrameRef.current = requestAnimationFrame(runNextBatch);
        return;
      }

      markerBatchPendingRef.current = false;
    };

    runNextBatch();
    previousVisibleSignatureRef.current = visibleSignature;
    previousSelectedTourismPlaceIdRef.current = selectedTourismPlaceId;

    return () => {
      cancelled = true;
      if (markerBatchFrameRef.current !== null) {
        cancelAnimationFrame(markerBatchFrameRef.current);
        markerBatchFrameRef.current = null;
      }
    };
  }, [mapRef, mapsApi, onSelectTourismPlace, selectedTourismPlaceId, status, tourismPlaces, viewportVersion]);
}
