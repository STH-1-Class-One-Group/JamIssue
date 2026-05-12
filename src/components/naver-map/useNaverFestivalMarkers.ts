import { useEffect, useRef } from 'react';
import type { MutableRefObject } from 'react';
import { NaverMarkerConfig } from '../../config/mapConfig';
import type { FestivalItem } from '../../types/core';
import { festivalMarkerContent, hasFestivalCoordinates } from './markerContent';
import type { NaverMapInstance, NaverMapsApi, NaverMarkerInstance } from './naverMapTypes';

type FestivalMarkersArgs = {
  status: 'loading' | 'ready' | 'error';
  mapsApi: NaverMapsApi | undefined;
  mapRef: MutableRefObject<NaverMapInstance | null>;
  festivals: FestivalItem[];
  selectedFestivalId: string | null;
  onSelectFestival: (festivalId: string) => void;
};

export function useNaverFestivalMarkers({
  status,
  mapsApi,
  mapRef,
  festivals,
  selectedFestivalId,
  onSelectFestival,
}: FestivalMarkersArgs) {
  const festivalMarkersRef = useRef<Map<string, NaverMarkerInstance>>(new Map());

  useEffect(() => {
    if (status !== 'ready' || !mapsApi || !mapRef.current) {
      return;
    }

    const nextIds = new Set(festivals.filter(hasFestivalCoordinates).map((festival) => festival.id));
    const markerAnchor = new mapsApi.Point(NaverMarkerConfig.anchor.default.x, NaverMarkerConfig.anchor.default.y);

    for (const [festivalId, marker] of festivalMarkersRef.current.entries()) {
      if (!nextIds.has(festivalId)) {
        marker.setMap(null);
        festivalMarkersRef.current.delete(festivalId);
      }
    }

    festivals.forEach((festival) => {
      if (!hasFestivalCoordinates(festival)) {
        return;
      }
      const existing = festivalMarkersRef.current.get(festival.id);
      const position = new mapsApi.LatLng(festival.latitude, festival.longitude);
      if (existing) {
        existing.setPosition(position);
        return;
      }

      const marker = new mapsApi.Marker({
        map: mapRef.current,
        position,
        title: '',
        zIndex: festival.id === selectedFestivalId ? NaverMarkerConfig.zIndex.festivalActive : NaverMarkerConfig.zIndex.festivalDefault,
        icon: {
          content: festivalMarkerContent(festival, festival.id === selectedFestivalId),
          anchor: markerAnchor,
        },
      });
      mapsApi.Event.addListener(marker, 'click', () => onSelectFestival(festival.id));
      festivalMarkersRef.current.set(festival.id, marker);
    });
  }, [festivals, mapRef, mapsApi, onSelectFestival, status]);

  const prevSelectedFestivalIdRef = useRef<string | null>(selectedFestivalId);
  const prevFestivalsRef = useRef<FestivalItem[]>(festivals);

  useEffect(() => {
    if (status !== 'ready' || !mapsApi || !mapRef.current) {
      return;
    }

    const isFestivalsSame = festivals === prevFestivalsRef.current;
    const prevSelectedId = prevSelectedFestivalIdRef.current;
    const markerAnchor = new mapsApi.Point(NaverMarkerConfig.anchor.default.x, NaverMarkerConfig.anchor.default.y);

    if (isFestivalsSame && prevSelectedId !== selectedFestivalId) {
      if (prevSelectedId) {
        const prevFestival = festivals.find((f) => f.id === prevSelectedId);
        const prevMarker = festivalMarkersRef.current.get(prevSelectedId);
        if (prevFestival && prevMarker) {
          prevMarker.setIcon({
            content: festivalMarkerContent(prevFestival, false),
            anchor: markerAnchor,
          });
          prevMarker.setZIndex(NaverMarkerConfig.zIndex.festivalDefault);
        }
      }

      if (selectedFestivalId) {
        const nextFestival = festivals.find((f) => f.id === selectedFestivalId);
        const nextMarker = festivalMarkersRef.current.get(selectedFestivalId);
        if (nextFestival && nextMarker) {
          nextMarker.setIcon({
            content: festivalMarkerContent(nextFestival, true),
            anchor: markerAnchor,
          });
          nextMarker.setZIndex(NaverMarkerConfig.zIndex.festivalActive);
        }
      }
    } else {
      festivals.forEach((festival) => {
        const marker = festivalMarkersRef.current.get(festival.id);
        if (!marker) {
          return;
        }
        marker.setIcon({
          content: festivalMarkerContent(festival, festival.id === selectedFestivalId),
          anchor: markerAnchor,
        });
        marker.setZIndex(
          festival.id === selectedFestivalId ? NaverMarkerConfig.zIndex.festivalActive : NaverMarkerConfig.zIndex.festivalDefault,
        );
      });
    }

    prevSelectedFestivalIdRef.current = selectedFestivalId;
    prevFestivalsRef.current = festivals;
  }, [festivals, mapRef, mapsApi, selectedFestivalId, status]);
}
