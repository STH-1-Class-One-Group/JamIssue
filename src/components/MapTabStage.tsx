import { MapStageMapSurface } from './map-stage/MapStageMapSurface';
import { MapStageSheets } from './map-stage/MapStageSheets';
import type { MapTabStageProps } from './map-stage/mapTabStageTypes';

export function MapTabStage({
  floatingNav,
  mapData,
  routePreviewData,
  viewportData,
  placeSheet,
  festivalSheet,
  tourismSheet,
  tourismActions,
}: MapTabStageProps) {
  return (
    <div className="map-stage">
      <MapStageMapSurface
        mapData={mapData}
        routePreviewData={routePreviewData}
        viewportData={viewportData}
        placeSheet={placeSheet}
        festivalSheet={festivalSheet}
        tourismActions={tourismActions}
      />
      {floatingNav}
      <MapStageSheets placeSheet={placeSheet} festivalSheet={festivalSheet} tourismSheet={tourismSheet} />
    </div>
  );
}
