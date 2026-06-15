import { NaverMarkerConfig } from '../../config/mapConfig';
import type { TourismPlaceItem } from '../../tourismTypes';
import { hasTourismCoordinates } from './markerContent';
import type { NaverMapInstance, NaverMapsApi } from './naverMapTypes';

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

  return includeSelectedTourismPlace(inViewportPlaces, markerEligiblePlaces, selectedTourismPlaceId);
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
