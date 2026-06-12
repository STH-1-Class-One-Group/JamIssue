import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MyPagePanel } from '../../src/components/MyPagePanel';
import type { MyPagePanelProps } from '../../src/components/my-page/myPagePanelTypes';
import type { SessionUser } from '../../src/types/auth';
import type { MyPageResponse } from '../../src/types/my-page';

const panelMocks = vi.hoisted(() => ({
  MyPageAccountSection: vi.fn((props: {
    showSettings: boolean;
    onToggleSettings: () => void;
    onLogout: () => void;
  }) => (
    <div data-testid="account-section" data-settings={String(props.showSettings)}>
      <button type="button" onClick={props.onToggleSettings}>toggle settings</button>
      <button type="button" onClick={props.onLogout}>logout</button>
    </div>
  )),
  MyPageGuestState: vi.fn((props: { onLogin: (provider: 'kakao') => void }) => (
    <button type="button" onClick={() => props.onLogin('kakao')}>login kakao</button>
  )),
  MyPageHeader: vi.fn((props: { sessionUser: SessionUser }) => (
    <div data-testid="my-header">{props.sessionUser.nickname}</div>
  )),
  MyPageLoadError: vi.fn((props: { myPageError: string; onRetry: () => void }) => (
    <button type="button" onClick={props.onRetry}>{props.myPageError}</button>
  )),
  MyPageOverviewSection: vi.fn((props: {
    visitPct: number;
    showVisitedDetail: boolean;
    onToggleVisitedDetail: () => void;
    onOpenPlace: (placeId: string) => void;
  }) => (
    <div data-testid="overview" data-visit-pct={String(props.visitPct)} data-detail={String(props.showVisitedDetail)}>
      <button type="button" onClick={props.onToggleVisitedDetail}>toggle detail</button>
      <button type="button" onClick={() => props.onOpenPlace('place-1')}>open place</button>
    </div>
  )),
  MyPageSettingsSection: vi.fn((props: {
    nickname: string;
    showSettings: boolean;
    onNicknameChange: (nickname: string) => void;
    onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
    onClose: () => void;
  }) => (
    <form data-testid="settings-section" data-visible={String(props.showSettings)} onSubmit={props.onSubmit}>
      <input aria-label="nickname" value={props.nickname} onChange={(event) => props.onNicknameChange(event.target.value)} />
      <button type="submit">save nickname</button>
      <button type="button" onClick={props.onClose}>close settings</button>
    </form>
  )),
  MyPageTabContent: vi.fn((props: {
    activeTab: string;
    onChangeTab: (tab: 'comments') => void;
    onPublishRoute: (payload: { travelSessionId: string; title: string; description: string; mood: string }) => void;
  }) => (
    <div data-testid="tab-content" data-active-tab={props.activeTab}>
      <button type="button" onClick={() => props.onChangeTab('comments')}>comments tab</button>
      <button
        type="button"
        onClick={() => props.onPublishRoute({
          travelSessionId: 'session-1',
          title: 'title',
          description: 'description',
          mood: 'walk',
        })}
      >
        publish route
      </button>
    </div>
  )),
  useAutoLoadMore: vi.fn(() => ({ current: null })),
  useScrollRestoration: vi.fn(() => ({ current: null })),
}));

vi.mock('../../src/hooks/useAutoLoadMore', () => ({
  useAutoLoadMore: panelMocks.useAutoLoadMore,
}));
vi.mock('../../src/hooks/useScrollRestoration', () => ({
  useScrollRestoration: panelMocks.useScrollRestoration,
}));
vi.mock('../../src/components/my-page/MyPageAccountSection', () => ({
  MyPageAccountSection: panelMocks.MyPageAccountSection,
}));
vi.mock('../../src/components/my-page/MyPageGuestState', () => ({
  MyPageGuestState: panelMocks.MyPageGuestState,
}));
vi.mock('../../src/components/my-page/MyPageHeader', () => ({
  MyPageHeader: panelMocks.MyPageHeader,
}));
vi.mock('../../src/components/my-page/MyPageLoadError', () => ({
  MyPageLoadError: panelMocks.MyPageLoadError,
}));
vi.mock('../../src/components/my-page/MyPageOverviewSection', () => ({
  MyPageOverviewSection: panelMocks.MyPageOverviewSection,
}));
vi.mock('../../src/components/my-page/MyPageSettingsSection', () => ({
  MyPageSettingsSection: panelMocks.MyPageSettingsSection,
}));
vi.mock('../../src/components/my-page/MyPageTabContent', () => ({
  MyPageTabContent: panelMocks.MyPageTabContent,
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
      uniquePlaceCount: 2,
      totalPlaceCount: 4,
      stampCount: 2,
      reviewCount: 1,
      commentCount: 1,
      routeCount: 1,
    },
    reviews: [],
    comments: [],
    notifications: [],
    unreadNotificationCount: 0,
    stampLogs: [],
    travelSessions: [],
    visitedPlaces: [],
    unvisitedPlaces: [],
    collectedPlaces: [],
    routes: [],
  } as MyPageResponse;
}

function panelProps(overrides: Partial<MyPagePanelProps> = {}): MyPagePanelProps {
  return {
    sessionData: {
      sessionUser: sessionUserFixture(),
      myPage: myPageFixture(),
      providers: [],
      myPageError: null,
    },
    panelState: {
      activeTab: 'stamps',
      isLoggingOut: false,
      profileSaving: false,
      profileError: null,
      routeSubmitting: false,
      routeError: null,
      commentsHasMore: true,
      commentsLoadingMore: false,
    },
    reviewActions: {
      onOpenPlace: vi.fn(),
      onOpenComment: vi.fn(),
      onOpenRoute: vi.fn().mockResolvedValue(undefined),
      onOpenReview: vi.fn(),
      onUpdateReview: vi.fn().mockResolvedValue(undefined),
      onDeleteReview: vi.fn().mockResolvedValue(undefined),
      onLoadMoreComments: vi.fn().mockResolvedValue(undefined),
    },
    panelActions: {
      onChangeTab: vi.fn(),
      onLogin: vi.fn(),
      onRetry: vi.fn().mockResolvedValue(undefined),
      onLogout: vi.fn().mockResolvedValue(undefined),
      onSaveNickname: vi.fn().mockResolvedValue(undefined),
      onPublishRoute: vi.fn().mockResolvedValue(undefined),
    },
    adminData: {
      adminSummary: null,
      adminBusyPlaceId: null,
      adminLoading: false,
    },
    adminActions: {
      onRefreshAdmin: vi.fn().mockResolvedValue(undefined),
      onToggleAdminPlace: vi.fn().mockResolvedValue(undefined),
      onToggleAdminManualOverride: vi.fn().mockResolvedValue(undefined),
    },
    ...overrides,
  };
}

describe('MyPagePanel composition', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the guest state when there is no active session', async () => {
    const user = userEvent.setup();
    const props = panelProps({
      sessionData: {
        sessionUser: null,
        myPage: null,
        providers: [],
        myPageError: null,
      },
    });

    render(<MyPagePanel {...props} />);
    await user.click(screen.getByRole('button', { name: 'login kakao' }));

    expect(props.panelActions.onLogin).toHaveBeenCalledWith('kakao');
    expect(panelMocks.MyPageHeader).not.toHaveBeenCalled();
  });

  it('opens settings for incomplete profiles and submits the trimmed nickname', async () => {
    const user = userEvent.setup();
    const props = panelProps({
      sessionData: {
        sessionUser: sessionUserFixture({ nickname: 'old', profileCompletedAt: null }),
        myPage: myPageFixture(),
        providers: [],
        myPageError: null,
      },
    });

    render(<MyPagePanel {...props} />);

    await waitFor(() => expect(screen.getByTestId('settings-section')).toHaveAttribute('data-visible', 'true'));
    await user.clear(screen.getByLabelText('nickname'));
    await user.type(screen.getByLabelText('nickname'), '  next nickname  ');
    await user.click(screen.getByRole('button', { name: 'save nickname' }));

    expect(props.panelActions.onSaveNickname).toHaveBeenCalledWith('next nickname');
    await waitFor(() => expect(screen.getByTestId('settings-section')).toHaveAttribute('data-visible', 'false'));
  });

  it('wires overview, tab content, auto-load, retry, and account actions', async () => {
    const user = userEvent.setup();
    const props = panelProps({
    });

    render(<MyPagePanel {...props} />);

    expect(panelMocks.useScrollRestoration).toHaveBeenCalledWith('my');
    expect(panelMocks.useAutoLoadMore).toHaveBeenCalledWith(expect.objectContaining({
      enabled: false,
      loading: false,
      onLoadMore: expect.any(Function),
    }));
    expect(screen.getByTestId('overview')).toHaveAttribute('data-visit-pct', '50');

    await user.click(screen.getByRole('button', { name: 'logout' }));
    await user.click(screen.getByRole('button', { name: 'open place' }));
    await user.click(screen.getByRole('button', { name: 'comments tab' }));
    await user.click(screen.getByRole('button', { name: 'publish route' }));

    expect(props.panelActions.onLogout).toHaveBeenCalledTimes(1);
    expect(props.reviewActions.onOpenPlace).toHaveBeenCalledWith('place-1');
    expect(props.panelActions.onChangeTab).toHaveBeenCalledWith('comments');
    expect(props.panelActions.onPublishRoute).toHaveBeenCalledWith({
      travelSessionId: 'session-1',
      title: 'title',
      description: 'description',
      mood: 'walk',
    });
  });

  it('enables comment auto-load and toggles local settings and visited detail state', async () => {
    const user = userEvent.setup();
    const props = panelProps({
      panelState: {
        ...panelProps().panelState,
        activeTab: 'comments',
        commentsHasMore: true,
        commentsLoadingMore: false,
      },
    });

    render(<MyPagePanel {...props} />);

    expect(panelMocks.useAutoLoadMore).toHaveBeenCalledWith(expect.objectContaining({
      enabled: true,
      loading: false,
      onLoadMore: expect.any(Function),
    }));
    const autoLoadOptions = panelMocks.useAutoLoadMore.mock.calls.at(-1)?.[0] as { onLoadMore: () => Promise<void> };
    await autoLoadOptions.onLoadMore();
    expect(props.reviewActions.onLoadMoreComments).toHaveBeenCalledTimes(1);

    expect(screen.getByTestId('overview')).toHaveAttribute('data-detail', 'false');
    await user.click(screen.getByRole('button', { name: 'toggle detail' }));
    expect(screen.getByTestId('overview')).toHaveAttribute('data-detail', 'true');

    await user.click(screen.getByRole('button', { name: 'toggle settings' }));
    expect(screen.getByTestId('settings-section')).toHaveAttribute('data-visible', 'true');
    await user.click(screen.getByRole('button', { name: 'close settings' }));
    expect(screen.getByTestId('settings-section')).toHaveAttribute('data-visible', 'false');
  });

  it('shows a retry boundary when my-page data fails to load', async () => {
    const user = userEvent.setup();
    const props = panelProps({
      sessionData: {
        sessionUser: sessionUserFixture(),
        myPage: null,
        providers: [],
        myPageError: 'load failed',
      },
    });

    render(<MyPagePanel {...props} />);

    await user.click(screen.getByRole('button', { name: 'load failed' }));

    expect(props.panelActions.onRetry).toHaveBeenCalledTimes(1);
    expect(panelMocks.MyPageOverviewSection).not.toHaveBeenCalled();
  });
});
