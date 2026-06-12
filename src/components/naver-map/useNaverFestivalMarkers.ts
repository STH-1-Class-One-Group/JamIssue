import { useEffect, useRef } from 'react';
import type { MutableRefObject } from 'react';
import type { FestivalItem } from '../../types/core';
import { syncFestivalMarkerLifecycle, syncFestivalMarkerSelection } from './festivalMarkerController';
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

    syncFestivalMarkerLifecycle({
      mapsApi,
      map: mapRef.current,
      markers: festivalMarkersRef.current,
      festivals,
      selectedFestivalId,
      onSelectFestival,
    });
  }, [festivals, mapRef, mapsApi, onSelectFestival, status]);

  const prevSelectedFestivalIdRef = useRef<string | null>(selectedFestivalId);
  const prevFestivalsRef = useRef<FestivalItem[]>(festivals);

  useEffect(() => {
    if (status !== 'ready' || !mapsApi || !mapRef.current) {
      return;
    }

    syncFestivalMarkerSelection({
      mapsApi,
      markers: festivalMarkersRef.current,
      festivals,
      previousFestivals: prevFestivalsRef.current,
      previousFestivalId: prevSelectedFestivalIdRef.current,
      selectedFestivalId,
    });

    prevSelectedFestivalIdRef.current = selectedFestivalId;
    prevFestivalsRef.current = festivals;
  }, [festivals, mapRef, mapsApi, selectedFestivalId, status]);
}
