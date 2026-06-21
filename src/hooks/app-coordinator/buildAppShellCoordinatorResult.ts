import type { CoordinatorArgs } from './useAppShellCoordinator.types';
import type { useAppCoordinatorActions } from './useAppCoordinatorActions';
import type { useAppCoordinatorServices } from './useAppCoordinatorServices';
import type { useAppPreferencesState } from '../useAppPreferencesState';

interface BuildCoordinatorResultParams extends CoordinatorArgs {
  services: ReturnType<typeof useAppCoordinatorServices>;
  actions: ReturnType<typeof useAppCoordinatorActions>;
  appPreferencesState: ReturnType<typeof useAppPreferencesState>;
}

export function buildAppShellCoordinatorResult({
  routeState,
  domainState,
  shellRuntimeState,
  pageRuntimeState,
  dataState,
  appPreferencesState,
  initialMapViewport,
  services,
  actions,
}: BuildCoordinatorResultParams) {
  return {
    ...services,
    ...actions,
    initialMapViewport,
    ...pageRuntimeState,
    ...appPreferencesState,
    ...domainState.auth,
    ...domainState.map,
    ...domainState.myPage,
    ...domainState.returnView,
    ...domainState.review,
    ...routeState,
    ...shellRuntimeState,
    ...dataState,
    ...services.navigationHelpers,
    ...services.paginationActions,
  };
}
