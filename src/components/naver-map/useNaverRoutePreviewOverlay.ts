import { useEffect } from 'react';
import { NaverMarkerConfig } from '../../config/mapConfig';
import type { Place } from '../../types/core';
import { routeStepMarkerContent } from './markerContent';
import type { NaverMapInstance, NaverMapsApi, NaverMarkerInstance, NaverPolylineInstance } from './naverMapTypes';

type RoutePreviewOverlayArgs = {
  status: 'loading' | 'ready' | 'error';
  mapsApi: NaverMapsApi | undefined;
  mapRef: React.MutableRefObject<NaverMapInstance | null>;
  routeLineRef: React.MutableRefObject<NaverPolylineInstance | null>;
  routeStepMarkersRef: React.MutableRefObject<NaverMarkerInstance[]>;
  routePreviewPlaces: Place[];
  selectedPlaceId: string | null;
  selectedFestivalId: string | null;
};

export function useNaverRoutePreviewOverlay({
  status,
  mapsApi,
  mapRef,
  routeLineRef,
  routeStepMarkersRef,
  routePreviewPlaces,
  selectedPlaceId,
  selectedFestivalId,
}: RoutePreviewOverlayArgs) {
  useEffect(() => {
    if (status !== 'ready' || !mapsApi || !mapRef.current) {
      return;
    }

    if (routeLineRef.current) {
      routeLineRef.current.setMap(null);
      routeLineRef.current = null;
    }
    routeStepMarkersRef.current.forEach((marker) => marker.setMap(null));
    routeStepMarkersRef.current = [];

    if (!routePreviewPlaces || routePreviewPlaces.length === 0) {
      return;
    }

    const path = routePreviewPlaces.map((place) => new mapsApi.LatLng(place.latitude, place.longitude));
    routeLineRef.current = new mapsApi.Polyline({
      map: mapRef.current,
      path,
      strokeColor: '#ff6b9d',
      strokeOpacity: 0.82,
      strokeWeight: 4,
      strokeLineCap: 'round',
      strokeLineJoin: 'round',
      zIndex: NaverMarkerConfig.zIndex.routeLine,
    });

    routeStepMarkersRef.current = routePreviewPlaces.map(
      (place, index) =>
        new mapsApi.Marker({
          map: mapRef.current,
          position: new mapsApi.LatLng(place.latitude, place.longitude),
          title: '',
          zIndex: NaverMarkerConfig.zIndex.routeStep,
          icon: {
            content: routeStepMarkerContent(index + 1),
            anchor: new mapsApi.Point(NaverMarkerConfig.anchor.routeStep.x, NaverMarkerConfig.anchor.routeStep.y),
          },
        }),
    );

    if (routePreviewPlaces.length >= 2 && !selectedPlaceId && !selectedFestivalId) {
      const bounds = new mapsApi.LatLngBounds();
      routePreviewPlaces.forEach((place) => bounds.extend(new mapsApi.LatLng(place.latitude, place.longitude)));
      mapRef.current.fitBounds?.(bounds, NaverMarkerConfig.routeBoundsPadding);
    } else if (routePreviewPlaces.length === 1 && !selectedPlaceId && !selectedFestivalId) {
      mapRef.current.panTo?.(new mapsApi.LatLng(routePreviewPlaces[0].latitude, routePreviewPlaces[0].longitude));
    }
  }, [
    mapRef,
    mapsApi,
    routeLineRef,
    routePreviewPlaces,
    routeStepMarkersRef,
    selectedFestivalId,
    selectedPlaceId,
    status,
  ]);
}
