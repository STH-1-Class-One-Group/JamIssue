import { useMapCategoryState } from './useMapCategoryState';
import { useRoutePreviewState } from './useRoutePreviewState';
import { useTourismMapState } from './useTourismMapState';

export function useMapDomainState() {
  return {
    ...useMapCategoryState(),
    ...useRoutePreviewState(),
    ...useTourismMapState(),
  };
}
