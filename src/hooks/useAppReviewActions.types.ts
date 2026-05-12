import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import type { RouteStateCommitOptions } from './app-route/useAppRouteState';
import type { DrawerState, Place, Tab } from '../types/core';
import type { SessionUser } from '../types/auth';
import type { Comment, Review } from '../types/review';
import type { MyPageResponse } from '../types/my-page';

type SetState<T> = Dispatch<SetStateAction<T>>;
export type HistoryMode = 'push' | 'replace';

export interface UseAppReviewActionsParams {
  activeTab: Tab;
  sessionUser: SessionUser | null;
  selectedPlace: Place | null;
  reviews: Review[];
  selectedPlaceReviews: Review[];
  myPage: MyPageResponse | null;
  activeCommentReviewId: string | null;
  highlightedReviewId: string | null;
  setSelectedPlaceReviews: SetState<Review[]>;
  setReviews: SetState<Review[]>;
  setMyPage: SetState<MyPageResponse | null>;
  setNotice: (notice: string | null) => void;
  goToTab: (nextTab: Tab, historyMode?: HistoryMode) => void;
  commitRouteState: (
    nextState: { tab: Tab; placeId: string | null; festivalId: string | null; drawerState: DrawerState },
    historyMode?: HistoryMode,
    options?: RouteStateCommitOptions,
  ) => void;
  refreshMyPageForUser: (user: SessionUser | null, force?: boolean) => Promise<MyPageResponse | null>;
  patchReviewCollections: (reviewId: string, updater: (review: Review) => Review) => void;
  upsertReviewCollections: (review: Review) => void;
  placeReviewsCacheRef: MutableRefObject<Record<string, Review[]>>;
  handleCloseReviewComments: () => void;
  syncReviewComments: (reviewId: string, comments: Comment[]) => void;
  clearReviewComments: (reviewId: string) => void;
  formatErrorMessage: (error: unknown) => string;
}
