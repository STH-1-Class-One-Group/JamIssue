import type {
  getInitialMapViewport,
  useAppRouteState,
} from './useAppRouteState';
import type { useAuthDomainState } from './useAuthDomainState';
import type { useAppShellRuntimeState } from './useAppShellRuntimeState';
import type { useAppPageRuntimeState } from './useAppPageRuntimeState';
import type { useAppDataState } from './useAppDataState';
import type { useMapCategoryState } from './useMapCategoryState';
import type { useMyPageDomainState } from './useMyPageDomainState';
import type { useReturnViewDomainState } from './useReturnViewDomainState';
import type { useReviewFilterState } from './useReviewFilterState';
import type { useReviewHighlightState } from './useReviewHighlightState';
import type { useRoutePreviewState } from './useRoutePreviewState';

export type RouteState = ReturnType<typeof useAppRouteState>;
export type DomainState =
  & ReturnType<typeof useMyPageDomainState>
  & ReturnType<typeof useReviewFilterState>
  & ReturnType<typeof useReviewHighlightState>
  & ReturnType<typeof useMapCategoryState>
  & ReturnType<typeof useRoutePreviewState>
  & ReturnType<typeof useReturnViewDomainState>
  & ReturnType<typeof useAuthDomainState>;
export type ShellRuntimeState = ReturnType<typeof useAppShellRuntimeState>;
export type PageRuntimeState = ReturnType<typeof useAppPageRuntimeState>;
export type DataState = ReturnType<typeof useAppDataState>;

export type CoordinatorArgs = {
  routeState: RouteState;
  domainState: DomainState;
  shellRuntimeState: ShellRuntimeState;
  pageRuntimeState: PageRuntimeState;
  dataState: DataState;
  initialMapViewport: ReturnType<typeof getInitialMapViewport>;
};
