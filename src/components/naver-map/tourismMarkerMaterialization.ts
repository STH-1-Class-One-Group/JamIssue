import { NaverMarkerConfig } from '../../config/mapConfig';
import type { TourismPlaceItem } from '../../tourismTypes';
import { hasTourismCoordinates } from './markerContent';
import type { NaverLatLng, NaverMapInstance, NaverMapsApi } from './naverMapTypes';

export type TourismPlaceWithCoordinates = TourismPlaceItem & {
  latitude: number;
  longitude: number;
};

type TourismMarkerMaterializationArgs = {
  mapsApi: NaverMapsApi;
  map: NaverMapInstance;
  selectedTourismPlaceId: string | null;
  tourismPlaces: TourismPlaceItem[];
};

export function selectTourismPlacesForMarkerMaterialization({
  mapsApi,
  map,
  selectedTourismPlaceId,
  tourismPlaces,
}: TourismMarkerMaterializationArgs): TourismPlaceWithCoordinates[] {
  const markerEligiblePlaces = tourismPlaces
    .filter(hasTourismCoordinates)
    .filter((place) => !place.isCurated);

  const bounds = map.getBounds?.();
  if (!bounds?.hasLatLng) {
    return includeSelectedTourismPlace(
      markerEligiblePlaces.slice(0, NaverMarkerConfig.materialization.tourismFallbackMarkerLimit),
      markerEligiblePlaces,
      selectedTourismPlaceId,
    );
  }

  const inViewportPlaces = markerEligiblePlaces.filter((place) => {
    const position = new mapsApi.LatLng(place.latitude, place.longitude);
    return bounds.hasLatLng?.(position) === true;
  });

  return includeSelectedTourismPlace(
    sortTourismPlacesByDistanceToMapCenter(inViewportPlaces, map.getCenter())
      .slice(0, getTourismViewportMarkerLimit()),
    markerEligiblePlaces,
    selectedTourismPlaceId,
  );
}

/**
 * Returns the KTO marker cap for the current viewport class.
 *
 * Mobile uses a lower cap because Naver HTML marker insertion blocks the main
 * thread more noticeably on narrow devices. The default remains mobile-safe
 * when the viewport is unavailable in tests or non-browser contexts.
 */
export function getTourismViewportMarkerLimit(viewportWidth = globalThis.window?.innerWidth) {
  if (
    typeof viewportWidth === 'number'
    && Number.isFinite(viewportWidth)
    && viewportWidth > NaverMarkerConfig.materialization.tourismMobileViewportMaxWidth
  ) {
    return NaverMarkerConfig.materialization.tourismDesktopViewportMarkerLimit;
  }

  return NaverMarkerConfig.materialization.tourismMobileViewportMarkerLimit;
}

function includeSelectedTourismPlace(
  places: TourismPlaceWithCoordinates[],
  eligiblePlaces: TourismPlaceWithCoordinates[],
  selectedTourismPlaceId: string | null,
) {
  if (!selectedTourismPlaceId || places.some((place) => place.id === selectedTourismPlaceId)) {
    return places;
  }

  const selectedPlace = eligiblePlaces.find((place) => place.id === selectedTourismPlaceId);
  return selectedPlace ? [...places, selectedPlace] : places;
}

function sortTourismPlacesByDistanceToMapCenter(
  places: TourismPlaceWithCoordinates[],
  center: NaverLatLng,
) {
  const centerLatitude = center.lat();
  const centerLongitude = center.lng();
  return [...places].sort((left, right) => (
    getSquaredDistance(left, centerLatitude, centerLongitude) - getSquaredDistance(right, centerLatitude, centerLongitude)
  ));
}

function getSquaredDistance(
  place: TourismPlaceWithCoordinates,
  centerLatitude: number,
  centerLongitude: number,
) {
  const latitudeDelta = place.latitude - centerLatitude;
  const longitudeDelta = place.longitude - centerLongitude;
  return latitudeDelta * latitudeDelta + longitudeDelta * longitudeDelta;
}
