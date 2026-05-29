import type { ApiStatus, CommunityRouteSort, Course, FestivalItem, MyPageTabKey, ReviewMood, RoutePreview, Tab } from '../../types/core';
import type { AuthProvider, SessionUser } from '../../types/auth';
import type { Comment, Review, UserRoute } from '../../types/review';
import type { MyPageResponse } from '../../types/my-page';
import type { AdminSummaryResponse } from '../../types/admin';

export interface AppPageStageSharedData {
  sessionUser: SessionUser | null;
  placeNameById: Record<string, string>;
  festivals: FestivalItem[];
}

export interface AppPageStageFeedData {
  reviews: Review[];
  reviewLikeUpdatingId: string | null;
  feedPlaceFilterId: string | null;
  commentSubmittingReviewId: string | null;
  commentMutatingId: string | null;
  deletingReviewId: string | null;
  activeCommentReviewId: string | null;
  activeCommentReviewComments: Comment[];
  activeCommentReviewStatus: ApiStatus;
  highlightedCommentId: string | null;
  highlightedReviewId: string | null;
  feedHasMore: boolean;
  feedLoadingMore: boolean;
}

export interface AppPageStageCourseData {
  courses: Course[];
  communityRoutes: UserRoute[];
  communityRouteSort: CommunityRouteSort;
  routeLikeUpdatingId: string | null;
  highlightedRouteId: string | null;
}

export interface AppPageStageMyPageData {
  myPage: MyPageResponse | null;
  providers: AuthProvider[];
  myPageError: string | null;
  myPageTab: MyPageTabKey;
  isLoggingOut: boolean;
  profileSaving: boolean;
  profileError: string | null;
  routeSubmitting: boolean;
  routeError: string | null;
  adminSummary: AdminSummaryResponse | null;
  adminBusyPlaceId: string | null;
  adminLoading: boolean;
  commentsHasMore: boolean;
  commentsLoadingMore: boolean;
}

export interface AppPageStageSharedActions {
  onRequestLogin: () => void;
  onOpenPlace: (placeId: string) => void;
}

export interface AppPageStageFeedActions {
  onLoadMoreFeed: () => Promise<void>;
  onToggleReviewLike: (reviewId: string) => Promise<void>;
  onCreateComment: (reviewId: string, body: string, parentId?: string) => Promise<void>;
  onUpdateComment: (reviewId: string, commentId: string, body: string) => Promise<void>;
  onDeleteComment: (reviewId: string, commentId: string) => Promise<void>;
  onDeleteReview: (reviewId: string) => Promise<void>;
  onClearPlaceFilter: () => void;
  onOpenComments: (reviewId: string, commentId?: string | null) => void;
  onCloseComments: () => void;
}

export interface AppPageStageCourseActions {
  onChangeRouteSort: (sort: CommunityRouteSort) => void;
  onToggleRouteLike: (routeId: string) => Promise<void>;
  onOpenRoutePreview: (route: RoutePreview) => void;
}

export interface AppPageStageMyPageActions {
  onChangeMyPageTab: (tab: MyPageTabKey) => void;
  onLogin: (provider: AuthProvider) => void;
  onLinkProvider: (provider: AuthProvider) => void;
  onRetryMyPage: () => Promise<void>;
  onLogout: () => Promise<void>;
  onSaveNickname: (nickname: string) => Promise<void>;
  onPublishRoute: (payload: { travelSessionId: string; title: string; description: string; mood: string }) => Promise<void>;
  onOpenCommentFromMyPage: (reviewId: string, commentId: string) => void;
  onOpenRouteFromMyPage: (routeId: string) => Promise<void>;
  onOpenReview: (reviewId: string) => Promise<void>;
  onUpdateReview: (reviewId: string, payload: { body: string; mood: ReviewMood; file?: File | null; removeImage?: boolean }) => Promise<void>;
  onDeleteReview: (reviewId: string) => Promise<void>;
  onLoadMoreComments: (initial?: boolean) => Promise<void>;
  onRefreshAdmin: () => Promise<void>;
  onToggleAdminPlace: (placeId: string, nextValue: boolean) => Promise<void>;
  onToggleAdminManualOverride: (placeId: string, nextValue: boolean) => Promise<void>;
}

export interface AppPageStageProps {
  activeTab: Exclude<Tab, 'map'>;
  sharedData: AppPageStageSharedData;
  feedData: AppPageStageFeedData;
  courseData: AppPageStageCourseData;
  myPageData: AppPageStageMyPageData;
  sharedActions: AppPageStageSharedActions;
  feedActions: AppPageStageFeedActions;
  courseActions: AppPageStageCourseActions;
  myPageActions: AppPageStageMyPageActions;
}

export interface PageStageFeedViewProps {
  sharedData: Pick<AppPageStageSharedData, 'sessionUser' | 'placeNameById'>;
  feedData: AppPageStageFeedData;
  sharedActions: AppPageStageSharedActions;
  feedActions: AppPageStageFeedActions;
}

export interface PageStageCourseViewProps {
  sharedData: Pick<AppPageStageSharedData, 'sessionUser' | 'placeNameById'>;
  courseData: AppPageStageCourseData;
  sharedActions: AppPageStageSharedActions;
  courseActions: AppPageStageCourseActions;
}

export interface PageStageMyViewProps {
  sharedData: Pick<AppPageStageSharedData, 'sessionUser'>;
  myPageData: AppPageStageMyPageData;
  sharedActions: Pick<AppPageStageSharedActions, 'onOpenPlace'>;
  myPageActions: AppPageStageMyPageActions;
}
