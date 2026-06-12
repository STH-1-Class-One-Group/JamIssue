/*
 * File: festivalMarkerController.ts
 * Purpose: Keep festival marker SDK mutations testable outside React effects.
 * Primary Responsibility: Create, remove, move, and restyle Naver festival markers.
 * Design Intent: Let the hook own lifecycle timing while this local controller owns marker behavior.
 * Non-Goals: This file does not read React state, own refs, or change public hook contracts.
 */

import { NaverMarkerConfig } from '../../config/mapConfig';
import type { FestivalItem } from '../../types/core';
import { festivalMarkerContent, hasFestivalCoordinates } from './markerContent';
import type { NaverMapInstance, NaverMapsApi, NaverMarkerInstance, NaverPoint } from './naverMapTypes';

export type FestivalMarkerStore = Map<string, NaverMarkerInstance>;

type SyncFestivalMarkerLifecycleArgs = {
  mapsApi: NaverMapsApi;
  map: NaverMapInstance;
  markers: FestivalMarkerStore;
  festivals: FestivalItem[];
  selectedFestivalId: string | null;
  onSelectFestival: (festivalId: string) => void;
};

type SyncFestivalMarkerSelectionArgs = {
  mapsApi: NaverMapsApi;
  markers: FestivalMarkerStore;
  festivals: FestivalItem[];
  previousFestivals: FestivalItem[];
  previousFestivalId: string | null;
  selectedFestivalId: string | null;
};

export function syncFestivalMarkerLifecycle({
  mapsApi,
  map,
  markers,
  festivals,
  selectedFestivalId,
  onSelectFestival,
}: SyncFestivalMarkerLifecycleArgs) {
  const nextIds = collectFestivalIdsWithCoordinates(festivals);
  const markerAnchor = createDefaultMarkerAnchor(mapsApi);

  removeStaleFestivalMarkers(markers, nextIds);

  for (const festival of festivals) {
    if (!hasFestivalCoordinates(festival)) {
      continue;
    }

    const existing = markers.get(festival.id);
    const position = new mapsApi.LatLng(festival.latitude, festival.longitude);
    if (existing) {
      existing.setPosition(position);
      continue;
    }

    const marker = new mapsApi.Marker({
      map,
      position,
      title: '',
      zIndex: getFestivalMarkerZIndex(festival.id === selectedFestivalId),
      icon: createFestivalMarkerIcon(festival, festival.id === selectedFestivalId, markerAnchor),
    });
    mapsApi.Event.addListener(marker, 'click', () => onSelectFestival(festival.id));
    markers.set(festival.id, marker);
  }
}

export function syncFestivalMarkerSelection({
  mapsApi,
  markers,
  festivals,
  previousFestivals,
  previousFestivalId,
  selectedFestivalId,
}: SyncFestivalMarkerSelectionArgs) {
  const markerAnchor = createDefaultMarkerAnchor(mapsApi);
  const canPatchSelectionOnly = festivals === previousFestivals && previousFestivalId !== selectedFestivalId;

  if (canPatchSelectionOnly) {
    updateFestivalMarkerStateById(markers, festivals, previousFestivalId, false, markerAnchor);
    updateFestivalMarkerStateById(markers, festivals, selectedFestivalId, true, markerAnchor);
    return;
  }

  for (const festival of festivals) {
    const marker = markers.get(festival.id);
    if (!marker) {
      continue;
    }
    updateFestivalMarkerState(marker, festival, festival.id === selectedFestivalId, markerAnchor);
  }
}

function collectFestivalIdsWithCoordinates(festivals: FestivalItem[]) {
  const nextIds = new Set<string>();
  for (const festival of festivals) {
    if (hasFestivalCoordinates(festival)) {
      nextIds.add(festival.id);
    }
  }
  return nextIds;
}

function removeStaleFestivalMarkers(markers: FestivalMarkerStore, nextIds: Set<string>) {
  for (const [festivalId, marker] of markers.entries()) {
    if (!nextIds.has(festivalId)) {
      marker.setMap(null);
      markers.delete(festivalId);
    }
  }
}

function updateFestivalMarkerStateById(
  markers: FestivalMarkerStore,
  festivals: FestivalItem[],
  festivalId: string | null,
  isActive: boolean,
  markerAnchor: NaverPoint,
) {
  if (!festivalId) {
    return;
  }

  const festival = festivals.find((item) => item.id === festivalId);
  const marker = markers.get(festivalId);
  if (!festival || !marker) {
    return;
  }

  updateFestivalMarkerState(marker, festival, isActive, markerAnchor);
}

function updateFestivalMarkerState(
  marker: NaverMarkerInstance,
  festival: FestivalItem,
  isActive: boolean,
  markerAnchor: NaverPoint,
) {
  marker.setIcon(createFestivalMarkerIcon(festival, isActive, markerAnchor));
  marker.setZIndex(getFestivalMarkerZIndex(isActive));
}

function createFestivalMarkerIcon(festival: FestivalItem, isActive: boolean, markerAnchor: NaverPoint) {
  return {
    content: festivalMarkerContent(festival, isActive),
    anchor: markerAnchor,
  };
}

function createDefaultMarkerAnchor(mapsApi: NaverMapsApi) {
  return new mapsApi.Point(NaverMarkerConfig.anchor.default.x, NaverMarkerConfig.anchor.default.y);
}

function getFestivalMarkerZIndex(isActive: boolean) {
  return isActive ? NaverMarkerConfig.zIndex.festivalActive : NaverMarkerConfig.zIndex.festivalDefault;
}
