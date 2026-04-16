import type { DrawerState, MyPageTabKey, RoutePreview, SessionUser, Tab } from '../types';
import type { ReturnViewState } from '../store/app-ui-store';
import type { RouteStateCommitOptions } from './useAppRouteState';
import { createNavigateBackHandler } from './app-navigation/shellBackNavigation';
import { createBottomNavChangeHandler } from './app-navigation/shellBottomNav';

interface UseAppShellNavigationParams {
  sessionUser: SessionUser | null;
  returnView: ReturnViewState | null;
  activeCommentReviewId: string | null;
  activeTab: Tab;
  selectedPlaceId: string | null;
  selectedFestivalId: string | null;
  drawerState: DrawerState;
  selectedRoutePreview: RoutePreview | null;
  setMyPageTab: (value: MyPageTabKey) => void;
  setActiveCommentReviewId: (value: string | null) => void;
  setHighlightedCommentId: (value: string | null) => void;
  setHighlightedReviewId: (value: string | null) => void;
  setFeedPlaceFilterId: (value: string | null) => void;
  setSelectedRoutePreview: (value: RoutePreview | null) => void;
  setReturnView: (value: ReturnViewState | null) => void;
  handleCloseReviewComments: () => void;
  goToTab: (tab: Tab, historyMode?: 'push' | 'replace') => void;
  commitRouteState: (
    nextState: { tab: Tab; placeId: string | null; festivalId: string | null; drawerState: DrawerState },
    historyMode?: 'push' | 'replace',
    options?: RouteStateCommitOptions,
  ) => void;
}

export function useAppShellNavigation({
  sessionUser,
  returnView,
  activeCommentReviewId,
  activeTab,
  selectedPlaceId,
  selectedFestivalId,
  drawerState,
  selectedRoutePreview,
  setMyPageTab,
  setActiveCommentReviewId,
  setHighlightedCommentId,
  setHighlightedReviewId,
  setFeedPlaceFilterId,
  setSelectedRoutePreview,
  setReturnView,
  handleCloseReviewComments,
  goToTab,
  commitRouteState,
}: UseAppShellNavigationParams) {
  const canNavigateBack =
    returnView !== null ||
    activeCommentReviewId !== null ||
    activeTab !== 'map' ||
    selectedPlaceId !== null ||
    selectedFestivalId !== null ||
    drawerState !== 'closed' ||
    selectedRoutePreview !== null ||
    (typeof window !== 'undefined' && window.history.length > 1);

  const handleNavigateBack = createNavigateBackHandler({
    sessionUser,
    returnView,
    activeCommentReviewId,
    activeTab,
    selectedPlaceId,
    selectedFestivalId,
    drawerState,
    selectedRoutePreview,
    setMyPageTab,
    setActiveCommentReviewId,
    setHighlightedCommentId,
    setHighlightedReviewId,
    setFeedPlaceFilterId,
    setSelectedRoutePreview,
    setReturnView,
    handleCloseReviewComments,
    goToTab,
    commitRouteState,
  });

  const handleBottomNavChange = createBottomNavChangeHandler({
    selectedPlaceId,
    selectedFestivalId,
    drawerState,
    setSelectedRoutePreview,
    handleCloseReviewComments,
    setFeedPlaceFilterId,
    setHighlightedReviewId,
    commitRouteState,
  });

  return {
    canNavigateBack,
    handleNavigateBack,
    handleBottomNavChange,
  };
}
