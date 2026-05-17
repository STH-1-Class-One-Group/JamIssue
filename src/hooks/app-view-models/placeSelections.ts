import type { Category, FestivalItem, Place, RoutePreview } from '../../types/core';

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

  const placeMap = new Map<string, Place>();
  for (const place of places) {
    if (!placeMap.has(place.id)) {
      placeMap.set(place.id, place);
    }
  }

  const routePlaces: Place[] = [];
  for (const placeId of selectedRoutePreview.placeIds) {
    const place = placeMap.get(placeId);
    if (place) {
      routePlaces.push(place);
    }
  }

  return routePlaces;
}

export function getSelectedFestival(festivals: FestivalItem[], selectedFestivalId: string | null) {
  if (!selectedFestivalId) {
    return null;
  }

  return festivals.find((festival) => festival.id === selectedFestivalId) ?? null;
}

export function buildPlaceNameById(places: Place[]) {
  // ⚡ Bolt optimization: Use a single for...of loop instead of Object.fromEntries(array.map(...))
  // to avoid O(N) memory allocation for intermediate tuple arrays.
  const placeNameById: Record<string, string> = {};
  for (const place of places) {
    placeNameById[place.id] = place.name;
  }
  return placeNameById;
}
