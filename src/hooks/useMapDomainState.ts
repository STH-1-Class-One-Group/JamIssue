import { useMapCategoryState } from './useMapCategoryState';
import { useRoutePreviewState } from './useRoutePreviewState';
import { useTourismMapState } from './map/useTourismMapState';

export function useMapDomainState() {
  return {
    ...useMapCategoryState(),
    ...useRoutePreviewState(),
    ...useTourismMapState(),
  };
}
