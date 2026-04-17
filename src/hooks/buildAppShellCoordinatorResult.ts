import type { CoordinatorArgs } from './useAppShellCoordinator.types';
import type { useAppCoordinatorActions } from './useAppCoordinatorActions';
import type { useAppCoordinatorServices } from './useAppCoordinatorServices';

interface BuildCoordinatorResultParams extends CoordinatorArgs {
  services: ReturnType<typeof useAppCoordinatorServices>;
  actions: ReturnType<typeof useAppCoordinatorActions>;
}

export function buildAppShellCoordinatorResult({
  routeState,
  domainState,
  shellRuntimeState,
  pageRuntimeState,
  dataState,
  initialMapViewport,
  services,
  actions,
}: BuildCoordinatorResultParams) {
  return {
    ...services,
    ...actions,
    initialMapViewport,
    ...pageRuntimeState,
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
