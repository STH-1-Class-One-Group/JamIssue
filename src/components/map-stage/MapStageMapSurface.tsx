import { NaverMap } from '../NaverMap';
import { MapStageDrawerTeaser } from './MapStageDrawerTeaser';
import { MapStageRoutePreviewCard } from './MapStageRoutePreviewCard';
import type { MapTabStageProps } from './mapTabStageTypes';

interface MapStageMapSurfaceProps {
  mapData: MapTabStageProps['mapData'];
  routePreviewData: MapTabStageProps['routePreviewData'];
  viewportData: MapTabStageProps['viewportData'];
  placeSheet: MapTabStageProps['placeSheet'];
  festivalSheet: MapTabStageProps['festivalSheet'];
  tourismActions: MapTabStageProps['tourismActions'];
}

export function MapStageMapSurface({
  mapData,
  routePreviewData,
  viewportData,
  placeSheet,
  festivalSheet,
  tourismActions,
}: MapStageMapSurfaceProps) {
  const showRoutePreview = !placeSheet.selectedPlace && !festivalSheet.selectedFestival;

  return (
    <>
      <NaverMap
        places={mapData.filteredPlaces}
        festivals={mapData.festivals}
        tourismPlaces={mapData.tourismPlaces}
        selectedPlaceId={placeSheet.selectedPlace?.id ?? null}
        selectedFestivalId={festivalSheet.selectedFestival?.id ?? null}
        selectedTourismPlaceId={tourismActions.selectedTourismPlaceId}
        selectedPlace={placeSheet.selectedPlace ?? null}
        selectedFestival={festivalSheet.selectedFestival ?? null}
        onSelectPlace={placeSheet.onOpenPlace}
        onSelectFestival={festivalSheet.onOpenFestival}
        onSelectTourismPlace={tourismActions.onOpenTourismPlace}
        currentPosition={mapData.currentPosition}
        focusCurrentLocationKey={mapData.mapLocationFocusKey}
        initialCenter={viewportData.initialMapCenter}
        initialZoom={viewportData.initialMapZoom}
        onViewportChange={viewportData.onMapViewportChange}
        routePreviewPlaces={mapData.routePreviewPlaces}
        height="100%"
      />

      {showRoutePreview && (
        <MapStageRoutePreviewCard
          routePreview={routePreviewData.routePreview}
          onClearRoutePreview={routePreviewData.onClearRoutePreview}
          onOpenRoutePreviewPlace={routePreviewData.onOpenRoutePreviewPlace}
        />
      )}

      {showRoutePreview && <MapStageDrawerTeaser />}
    </>
  );
}
