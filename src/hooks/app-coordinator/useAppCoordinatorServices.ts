import { useAppCoordinatorAuthLoaders } from './useAppCoordinatorAuthLoaders';
import { useAppCoordinatorNavigationNotifications } from './useAppCoordinatorNavigationNotifications';
import { useAppCoordinatorViewState } from './useAppCoordinatorViewState';
import type { CoordinatorServicesArgs } from './useAppCoordinatorServices.types';

export function useAppCoordinatorServices({
  routeState,
  domainState,
  shellRuntimeState,
  pageRuntimeState,
  dataState,
}: CoordinatorServicesArgs) {
  const authLoaders = useAppCoordinatorAuthLoaders({
    routeState,
    domainState,
    shellRuntimeState,
    pageRuntimeState,
    dataState,
  });

  const navigationNotifications = useAppCoordinatorNavigationNotifications({
    routeState,
    domainState,
    shellRuntimeState,
    pageRuntimeState,
    dataState,
  }, authLoaders);

  const viewState = useAppCoordinatorViewState({
    routeState,
    domainState,
    shellRuntimeState,
    pageRuntimeState,
    dataState,
  }, authLoaders, navigationNotifications);

  return {
    ...authLoaders,
    ...navigationNotifications,
    ...viewState,
    pageRuntimeState,
  };
}
