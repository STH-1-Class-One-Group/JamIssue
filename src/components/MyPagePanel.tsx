import { useMemo, useState } from 'react';
import { useAutoLoadMore } from '../hooks/useAutoLoadMore';
import { useScrollRestoration } from '../hooks/useScrollRestoration';
import { MyPageGuestState } from './my-page/MyPageGuestState';
import { MyPageHeader } from './my-page/MyPageHeader';
import { MyPageLoadError } from './my-page/MyPageLoadError';
import { MyPageOverviewSection } from './my-page/MyPageOverviewSection';
import { MyPageTabContent } from './my-page/MyPageTabContent';
import type { MyPagePanelProps } from './my-page/myPagePanelTypes';

export function MyPagePanel({
  sessionData,
  panelState,
  reviewActions,
  panelActions,
  adminData,
  adminActions,
}: MyPagePanelProps) {
  const { sessionUser, myPage, providers, myPageError } = sessionData;
  const {
    activeTab,
    routeSubmitting,
    routeError,
    commentsHasMore,
    commentsLoadingMore,
  } = panelState;
  const {
    onOpenPlace,
    onOpenComment,
    onOpenRoute,
    onOpenReview,
    onUpdateReview,
    onDeleteReview,
    onLoadMoreComments,
  } = reviewActions;
  const {
    onChangeTab,
    onLogin,
    onRetry,
    onPublishRoute,
  } = panelActions;
  const { adminSummary, adminBusyPlaceId, adminLoading } = adminData;
  const {
    onRefreshAdmin,
    onToggleAdminPlace,
    onToggleAdminManualOverride,
  } = adminActions;
  const [showVisitedDetail, setShowVisitedDetail] = useState(false);
  const scrollRef = useScrollRestoration<HTMLElement>('my');
  const commentsLoadMoreRef = useAutoLoadMore({
    enabled: activeTab === 'comments' && commentsHasMore,
    loading: commentsLoadingMore,
    onLoadMore: () => onLoadMoreComments(),
    rootRef: scrollRef,
  });

  const visitPct = useMemo(
    () => (myPage && myPage.stats.totalPlaceCount > 0
      ? Math.round((myPage.stats.uniquePlaceCount / myPage.stats.totalPlaceCount) * 100)
      : 0),
    [myPage],
  );

  if (!sessionUser) {
    return (
      <section ref={scrollRef} className="page-panel page-panel--scrollable" data-page-surface="my">
        <MyPageGuestState providers={providers} onLogin={onLogin} />
      </section>
    );
  }

  return (
    <section ref={scrollRef} className="page-panel page-panel--scrollable" data-page-surface="my">
      <MyPageHeader sessionUser={sessionUser} />

      {!myPage && myPageError && <MyPageLoadError myPageError={myPageError} onRetry={onRetry} />}

      {myPage && (
        <>
          <MyPageOverviewSection
            uniquePlaceCount={myPage.stats.uniquePlaceCount}
            totalPlaceCount={myPage.stats.totalPlaceCount}
            stampCount={myPage.stats.stampCount}
            visitPct={visitPct}
            visitedPlaces={myPage.visitedPlaces}
            unvisitedPlaces={myPage.unvisitedPlaces}
            showVisitedDetail={showVisitedDetail}
            onToggleVisitedDetail={() => setShowVisitedDetail((current) => !current)}
            onOpenPlace={onOpenPlace}
            travelSessions={myPage.travelSessions}
          />

          <MyPageTabContent
            activeTab={activeTab}
            sessionUser={sessionUser}
            myPage={myPage}
            commentsHasMore={commentsHasMore}
            commentsLoadingMore={commentsLoadingMore}
            commentsLoadMoreRef={commentsLoadMoreRef}
            routeSubmitting={routeSubmitting}
            routeError={routeError}
            adminSummary={adminSummary}
            adminBusyPlaceId={adminBusyPlaceId}
            adminLoading={adminLoading}
            onChangeTab={onChangeTab}
            onOpenPlace={onOpenPlace}
            onOpenComment={onOpenComment}
            onOpenRoute={onOpenRoute}
            onOpenReview={onOpenReview}
            onUpdateReview={onUpdateReview}
            onDeleteReview={onDeleteReview}
            onPublishRoute={onPublishRoute}
            onRefreshAdmin={onRefreshAdmin}
            onToggleAdminPlace={onToggleAdminPlace}
            onToggleAdminManualOverride={onToggleAdminManualOverride}
          />
        </>
      )}
    </section>
  );
}
