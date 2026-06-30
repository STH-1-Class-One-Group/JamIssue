import { Suspense, lazy, useState, type RefObject } from 'react';
import type { MyPageTabKey, ReviewMood } from '../../types/core';
import type { SessionUser } from '../../types/auth';
import type { MyPageResponse } from '../../types/my-page';
import type { AdminSummaryResponse } from '../../types/admin';
import { MyCommentsTabSection } from './MyCommentsTabSection';
import { MyFeedTabSection } from './MyFeedTabSection';
import { MyPagePrimaryTabs } from './MyPagePrimaryTabs';
import { MyRoutesTabSection } from './MyRoutesTabSection';
import { MyStampTabSection } from './MyStampTabSection';

const AdminPanel = lazy(() => import('../AdminPanel').then((module) => ({ default: module.AdminPanel })));

type ActivityTabKey = Exclude<MyPageTabKey, 'admin'>;
type ActivityViewModes = Record<ActivityTabKey, 'list' | 'calendar'>;

const defaultActivityViewModes: ActivityViewModes = {
  stamps: 'list',
  feeds: 'list',
  comments: 'list',
  routes: 'list',
};

type MyPageTabContentProps = {
  activeTab: MyPageTabKey;
  sessionUser: SessionUser;
  myPage: MyPageResponse;
  commentsHasMore: boolean;
  commentsLoadingMore: boolean;
  commentsLoadMoreRef: RefObject<HTMLDivElement | null>;
  routeSubmitting: boolean;
  routeError: string | null;
  adminSummary: AdminSummaryResponse | null;
  adminBusyPlaceId: string | null;
  adminLoading: boolean;
  onChangeTab: (nextTab: MyPageTabKey) => void;
  onOpenPlace: (placeId: string) => void;
  onOpenComment: (reviewId: string, commentId: string) => void;
  onOpenRoute: (routeId: string) => Promise<void>;
  onOpenReview: (reviewId: string) => void;
  onUpdateReview: (reviewId: string, payload: { body: string; mood: ReviewMood; file?: File | null; removeImage?: boolean }) => Promise<void>;
  onDeleteReview: (reviewId: string) => Promise<void>;
  onPublishRoute: (payload: { travelSessionId: string; title: string; description: string; mood: string }) => Promise<void>;
  onRefreshAdmin: () => Promise<void>;
  onToggleAdminPlace: (placeId: string, nextValue: boolean) => Promise<void>;
  onToggleAdminManualOverride: (placeId: string, nextValue: boolean) => Promise<void>;
};

export function MyPageTabContent({
  activeTab,
  sessionUser,
  myPage,
  commentsHasMore,
  commentsLoadingMore,
  commentsLoadMoreRef,
  routeSubmitting,
  routeError,
  adminSummary,
  adminBusyPlaceId,
  adminLoading,
  onChangeTab,
  onOpenPlace,
  onOpenComment,
  onOpenRoute,
  onOpenReview,
  onUpdateReview,
  onDeleteReview,
  onPublishRoute,
  onRefreshAdmin,
  onToggleAdminPlace,
  onToggleAdminManualOverride,
}: MyPageTabContentProps) {
  const [activityViewModes, setActivityViewModes] = useState<ActivityViewModes>(defaultActivityViewModes);
  const updateActivityViewMode = (tab: ActivityTabKey, mode: ActivityViewModes[ActivityTabKey]) => {
    setActivityViewModes((current) => ({ ...current, [tab]: mode }));
  };

  return (
    <section className="my-page-activity-panel">
      <MyPagePrimaryTabs activeTab={activeTab} isAdmin={sessionUser.isAdmin} onChangeTab={onChangeTab} />

      {activeTab === 'stamps' && (
        <MyStampTabSection
          stampLogs={myPage.stampLogs}
          travelSessions={myPage.travelSessions}
          viewMode={activityViewModes.stamps}
          onOpenPlace={onOpenPlace}
          onOpenRoutes={() => onChangeTab('routes')}
          onViewModeChange={(mode) => updateActivityViewMode('stamps', mode)}
        />
      )}

      {activeTab === 'feeds' && (
        <MyFeedTabSection
          reviews={myPage.reviews}
          viewMode={activityViewModes.feeds}
          onOpenPlace={onOpenPlace}
          onOpenReview={onOpenReview}
          onUpdateReview={onUpdateReview}
          onDeleteReview={onDeleteReview}
          onViewModeChange={(mode) => updateActivityViewMode('feeds', mode)}
        />
      )}

      {activeTab === 'comments' && (
        <MyCommentsTabSection
          comments={myPage.comments}
          commentsHasMore={commentsHasMore}
          commentsLoadingMore={commentsLoadingMore}
          commentsLoadMoreRef={commentsLoadMoreRef}
          viewMode={activityViewModes.comments}
          onOpenPlace={onOpenPlace}
          onOpenComment={onOpenComment}
          onViewModeChange={(mode) => updateActivityViewMode('comments', mode)}
        />
      )}

      {activeTab === 'routes' && (
        <MyRoutesTabSection
          travelSessions={myPage.travelSessions}
          routes={myPage.routes}
          routeSubmitting={routeSubmitting}
          routeError={routeError}
          viewMode={activityViewModes.routes}
          onOpenPlace={onOpenPlace}
          onOpenRoute={onOpenRoute}
          onPublishRoute={onPublishRoute}
          onViewModeChange={(mode) => updateActivityViewMode('routes', mode)}
        />
      )}

      {activeTab === 'admin' && sessionUser.isAdmin && (
        <Suspense fallback={null}>
          <AdminPanel
            summary={adminSummary}
            busyPlaceId={adminBusyPlaceId}
            isImporting={adminLoading}
            onRefreshImport={onRefreshAdmin}
            onTogglePlace={onToggleAdminPlace}
            onToggleManualOverride={onToggleAdminManualOverride}
          />
        </Suspense>
      )}
    </section>
  );
}
