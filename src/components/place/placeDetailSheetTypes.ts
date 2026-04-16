import type { ApiStatus, DrawerState, Place, Review, ReviewMood, StampLog } from '../../types';

export interface PlaceDetailSheetProps {
  place: Place | null;
  reviews: Review[];
  isOpen: boolean;
  drawerState: DrawerState;
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
