import type { Category, FestivalItem, Place, RoutePreview } from '../../types';

export function filterPlacesByCategory(places: Place[], category: Category) {
  if (category === 'all') {
    return places;
  }

  return places.filter((place) => place.category === category);
}

export function getSelectedPlace(places: Place[], selectedPlaceId: string | null) {
  if (!selectedPlaceId) {
    return null;
  }

  return places.find((place) => place.id === selectedPlaceId) ?? null;
}

export function getRoutePreviewPlaces(places: Place[], selectedRoutePreview: RoutePreview | null) {
  if (!selectedRoutePreview) {
    return [];
  }

  return selectedRoutePreview.placeIds
    .map((placeId) => places.find((place) => place.id === placeId) ?? null)
    .filter(Boolean) as Place[];
}

export function getSelectedFestival(festivals: FestivalItem[], selectedFestivalId: string | null) {
  if (!selectedFestivalId) {
    return null;
  }

  return festivals.find((festival) => festival.id === selectedFestivalId) ?? null;
}

export function buildPlaceNameById(places: Place[]) {
  return Object.fromEntries(places.map((place) => [place.id, place.name]));
}
