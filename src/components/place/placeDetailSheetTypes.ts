import type { ApiStatus, DrawerState, Place, ReviewMood } from '../../types/core';
import type { Review, StampLog } from '../../types/review';
import type { MapSheetState } from '../map-stage/mapSheetState';

export interface PlaceDetailSheetProps {
  place: Place | null;
  reviews: Review[];
  isOpen: boolean;
  drawerState: DrawerState;
  sheetState: MapSheetState;
  loggedIn: boolean;
  visitCount: number;
  latestStamp: StampLog | null;
  todayStamp: StampLog | null;
  hasCreatedReviewToday: boolean;
  stampActionStatus: ApiStatus;
  stampActionMessage: string;
  reviewProofMessage: string;
  reviewError: string | null;
  reviewSubmitting: boolean;
  canCreateReview: boolean;
  onOpenFeedReview: () => void;
  onClose: () => void;
  onExpand: () => void;
  onCollapse: () => void;
  onRequestLogin: () => void;
  onClaimStamp: (place: Place) => Promise<void>;
  onCreateReview: (payload: { stampId: string; body: string; mood: ReviewMood; file: File | null }) => Promise<void>;
}
