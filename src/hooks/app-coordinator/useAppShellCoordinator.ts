import { useAppCoordinatorActions } from './useAppCoordinatorActions';
import { useAppCoordinatorEffects } from './useAppCoordinatorEffects';
import { useAppCoordinatorServices } from './useAppCoordinatorServices';
import { buildAppShellCoordinatorResult } from './buildAppShellCoordinatorResult';
import { useAppPreferencesState } from '../useAppPreferencesState';
import type { CoordinatorArgs } from './useAppShellCoordinator.types';

export function useAppShellCoordinator({
  routeState,
  domainState,
  shellRuntimeState,
  pageRuntimeState,
  dataState,
  initialMapViewport,
}: CoordinatorArgs) {
  const appPreferencesState = useAppPreferencesState();

  const services = useAppCoordinatorServices({
    routeState,
    domainState,
    shellRuntimeState,
    pageRuntimeState,
    dataState,
  });

  useAppCoordinatorEffects({
    routeState,
    domainState,
    shellRuntimeState,
    pageRuntimeState,
    dataState,
    services,
  });

  const actions = useAppCoordinatorActions({
    routeState,
    domainState,
    shellRuntimeState,
    dataState,
    services,
  });

  return buildAppShellCoordinatorResult({
    routeState,
    domainState,
    shellRuntimeState,
    pageRuntimeState,
    dataState,
    appPreferencesState,
    initialMapViewport,
    services,
    actions,
  });
}
