import type { DrawerState, RoutePreview, Tab } from '../../types';
import type { RouteStateCommitOptions } from '../useAppRouteState';

interface CreateBottomNavChangeHandlerParams {
  selectedPlaceId: string | null;
  selectedFestivalId: string | null;
  drawerState: DrawerState;
  setSelectedRoutePreview: (value: RoutePreview | null) => void;
  handleCloseReviewComments: () => void;
  setFeedPlaceFilterId: (value: string | null) => void;
  setHighlightedReviewId: (value: string | null) => void;
  commitRouteState: (
    nextState: { tab: Tab; placeId: string | null; festivalId: string | null; drawerState: DrawerState },
    historyMode?: 'push' | 'replace',
    options?: RouteStateCommitOptions,
  ) => void;
}

export function createBottomNavChangeHandler({
  selectedPlaceId,
  selectedFestivalId,
  drawerState,
  setSelectedRoutePreview,
  handleCloseReviewComments,
  setFeedPlaceFilterId,
  setHighlightedReviewId,
  commitRouteState,
}: CreateBottomNavChangeHandlerParams) {
  return function handleBottomNavChange(nextTab: Tab) {
    setSelectedRoutePreview(null);
    handleCloseReviewComments();

    if (nextTab !== 'feed') {
      setFeedPlaceFilterId(null);
      setHighlightedReviewId(null);
    }

    if (nextTab === 'map') {
      commitRouteState(
        {
          tab: 'map',
          placeId: selectedPlaceId,
          festivalId: selectedFestivalId,
          drawerState,
        },
        'replace',
        { routePreview: null },
      );
      return;
    }

    commitRouteState(
      {
        tab: nextTab,
        placeId: null,
        festivalId: null,
        drawerState: 'closed',
      },
      'push',
    );
  };
}
