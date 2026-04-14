import { Suspense, lazy, type RefObject } from 'react';
import type { AdminSummaryResponse, MyPageResponse, MyPageTabKey, ReviewMood, SessionUser } from '../../types';
import { MyCommentsTabSection } from './MyCommentsTabSection';
import { MyFeedTabSection } from './MyFeedTabSection';
import { MyPagePrimaryTabs } from './MyPagePrimaryTabs';
import { MyRoutesTabSection } from './MyRoutesTabSection';
import { MyStampTabSection } from './MyStampTabSection';

const AdminPanel = lazy(() => import('../AdminPanel').then((module) => ({ default: module.AdminPanel })));

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
  return (
    <section className="sheet-card stack-gap">
      <MyPagePrimaryTabs activeTab={activeTab} isAdmin={sessionUser.isAdmin} onChangeTab={onChangeTab} />

      {activeTab === 'stamps' && (
        <MyStampTabSection
          stampLogs={myPage.stampLogs}
          travelSessions={myPage.travelSessions}
          onOpenPlace={onOpenPlace}
          onOpenRoutes={() => onChangeTab('routes')}
        />
      )}

      {activeTab === 'feeds' && (
        <MyFeedTabSection
          reviews={myPage.reviews}
          onOpenPlace={onOpenPlace}
          onOpenReview={onOpenReview}
          onUpdateReview={onUpdateReview}
          onDeleteReview={onDeleteReview}
        />
      )}

      {activeTab === 'comments' && (
        <MyCommentsTabSection
          comments={myPage.comments}
          commentsHasMore={commentsHasMore}
          commentsLoadingMore={commentsLoadingMore}
          commentsLoadMoreRef={commentsLoadMoreRef}
          onOpenPlace={onOpenPlace}
          onOpenComment={onOpenComment}
        />
      )}

      {activeTab === 'routes' && (
        <MyRoutesTabSection
          travelSessions={myPage.travelSessions}
          routes={myPage.routes}
          routeSubmitting={routeSubmitting}
          routeError={routeError}
          onOpenPlace={onOpenPlace}
          onOpenRoute={onOpenRoute}
          onPublishRoute={onPublishRoute}
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
