import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MyPageTabContent } from '../../src/components/my-page/MyPageTabContent';
import type { SessionUser } from '../../src/types/auth';
import type { MyPageResponse } from '../../src/types/my-page';

const tabContentMocks = vi.hoisted(() => ({
  AdminPanel: vi.fn(() => <div data-testid="admin-panel" />),
  MyCommentsTabSection: vi.fn(() => <div data-testid="comments-section" />),
  MyFeedTabSection: vi.fn(() => <div data-testid="feed-section" />),
  MyRoutesTabSection: vi.fn(() => <div data-testid="routes-section" />),
  MyStampTabSection: vi.fn(() => <div data-testid="stamps-section" />),
}));

vi.mock('../../src/components/AdminPanel', () => ({
  AdminPanel: tabContentMocks.AdminPanel,
}));
vi.mock('../../src/components/my-page/MyCommentsTabSection', () => ({
  MyCommentsTabSection: tabContentMocks.MyCommentsTabSection,
}));
vi.mock('../../src/components/my-page/MyFeedTabSection', () => ({
  MyFeedTabSection: tabContentMocks.MyFeedTabSection,
}));
vi.mock('../../src/components/my-page/MyRoutesTabSection', () => ({
  MyRoutesTabSection: tabContentMocks.MyRoutesTabSection,
}));
vi.mock('../../src/components/my-page/MyStampTabSection', () => ({
  MyStampTabSection: tabContentMocks.MyStampTabSection,
}));

function sessionUserFixture(overrides: Partial<SessionUser> = {}): SessionUser {
  return {
    id: 'user-1',
    nickname: 'tester',
    email: null,
    provider: 'kakao',
    profileImage: null,
    isAdmin: false,
    profileCompletedAt: '2026-05-14T00:00:00Z',
    ...overrides,
  };
}

function myPageFixture(): MyPageResponse {
  return {
    user: sessionUserFixture(),
    stats: {
      uniquePlaceCount: 1,
      totalPlaceCount: 2,
      stampCount: 1,
      reviewCount: 1,
      commentCount: 1,
      routeCount: 1,
    },
    reviews: [{ id: 'review-1' }],
    comments: [{ id: 'comment-1' }],
    notifications: [],
    unreadNotificationCount: 0,
    stampLogs: [{ id: 'stamp-1' }],
    travelSessions: [{ id: 'session-1' }],
    visitedPlaces: [],
    unvisitedPlaces: [],
    collectedPlaces: [],
    routes: [{ id: 'route-1' }],
  } as MyPageResponse;
}

function renderTabContent(activeTab: Parameters<typeof MyPageTabContent>[0]['activeTab'], sessionUser = sessionUserFixture()) {
  const props = {
    activeTab,
    sessionUser,
    myPage: myPageFixture(),
    commentsHasMore: true,
    commentsLoadingMore: false,
    commentsLoadMoreRef: { current: null },
    routeSubmitting: false,
    routeError: null,
    adminSummary: { places: [] },
    adminBusyPlaceId: null,
    adminLoading: false,
    onChangeTab: vi.fn(),
    onOpenPlace: vi.fn(),
    onOpenComment: vi.fn(),
    onOpenRoute: vi.fn().mockResolvedValue(undefined),
    onOpenReview: vi.fn(),
    onUpdateReview: vi.fn().mockResolvedValue(undefined),
    onDeleteReview: vi.fn().mockResolvedValue(undefined),
    onPublishRoute: vi.fn().mockResolvedValue(undefined),
    onRefreshAdmin: vi.fn().mockResolvedValue(undefined),
    onToggleAdminPlace: vi.fn().mockResolvedValue(undefined),
    onToggleAdminManualOverride: vi.fn().mockResolvedValue(undefined),
  };

  return {
    props,
    view: render(<MyPageTabContent {...props} />),
  };
}

describe('MyPageTabContent composition', () => {
  it('renders the stamps, feeds, comments, and routes sections for their active tabs', () => {
    const { view, props } = renderTabContent('stamps');
    expect(screen.getByTestId('stamps-section')).toBeInTheDocument();
    expect(tabContentMocks.MyStampTabSection.mock.calls.at(-1)?.[0]).toMatchObject({
      stampLogs: props.myPage.stampLogs,
      travelSessions: props.myPage.travelSessions,
      onOpenPlace: props.onOpenPlace,
    });

    view.rerender(<MyPageTabContent {...props} activeTab="feeds" />);
    expect(screen.getByTestId('feed-section')).toBeInTheDocument();
    expect(tabContentMocks.MyFeedTabSection.mock.calls.at(-1)?.[0]).toMatchObject({
      reviews: props.myPage.reviews,
      onOpenReview: props.onOpenReview,
      onDeleteReview: props.onDeleteReview,
    });

    view.rerender(<MyPageTabContent {...props} activeTab="comments" />);
    expect(screen.getByTestId('comments-section')).toBeInTheDocument();
    expect(tabContentMocks.MyCommentsTabSection.mock.calls.at(-1)?.[0]).toMatchObject({
      comments: props.myPage.comments,
      commentsHasMore: true,
      onOpenComment: props.onOpenComment,
    });

    view.rerender(<MyPageTabContent {...props} activeTab="routes" />);
    expect(screen.getByTestId('routes-section')).toBeInTheDocument();
    expect(tabContentMocks.MyRoutesTabSection.mock.calls.at(-1)?.[0]).toMatchObject({
      travelSessions: props.myPage.travelSessions,
      routes: props.myPage.routes,
      onPublishRoute: props.onPublishRoute,
    });
  });

  it('renders admin content only for admin users', async () => {
    const { view, props } = renderTabContent('admin', sessionUserFixture({ isAdmin: false }));
    expect(screen.queryByTestId('admin-panel')).toBeNull();

    view.rerender(<MyPageTabContent {...props} activeTab="admin" sessionUser={sessionUserFixture({ isAdmin: true })} />);

    expect(await screen.findByTestId('admin-panel')).toBeInTheDocument();
    expect(tabContentMocks.AdminPanel.mock.calls.at(-1)?.[0]).toMatchObject({
      summary: props.adminSummary,
      busyPlaceId: null,
      isImporting: false,
      onRefreshImport: props.onRefreshAdmin,
    });
  });
});
