import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MyPagePanel } from '../../src/components/MyPagePanel';
import { myPageFixture, sessionUserFixture } from '../fixtures/app-fixtures';
import type { MyPageTabKey } from '../../src/types';

function createPanelProps(activeTab: MyPageTabKey) {
  return {
    sessionData: {
      sessionUser: sessionUserFixture,
      myPage: myPageFixture,
      providers: [],
      myPageError: null,
    },
    panelState: {
      activeTab,
      isLoggingOut: false,
      profileSaving: false,
      profileError: null,
      routeSubmitting: false,
      routeError: null,
      commentsHasMore: false,
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
      onLinkProvider: vi.fn(),
      onRetry: vi.fn().mockResolvedValue(undefined),
      onLogout: vi.fn().mockResolvedValue(undefined),
      onSaveNickname: vi.fn().mockResolvedValue(undefined),
      onUploadAvatar: vi.fn().mockResolvedValue(undefined),
      onDeleteAvatar: vi.fn().mockResolvedValue(undefined),
      onPublishRoute: vi.fn().mockResolvedValue(undefined),
    },
    notificationActions: {
      onMarkNotificationRead: vi.fn().mockResolvedValue(undefined),
      onMarkAllNotificationsRead: vi.fn().mockResolvedValue(undefined),
      onDeleteNotification: vi.fn().mockResolvedValue(undefined),
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
  } as const;
}

describe('MyPagePanel regression', () => {
  it('keeps My Page focused on activity dashboard content without account management controls', () => {
    const { container } = render(<MyPagePanel {...createPanelProps('stamps')} />);

    const stats = container.querySelector('.my-stats-grid');
    const tabs = container.querySelector('.my-page-primary-tabs');
    const account = container.querySelector('.account-action-card');

    expect(stats).not.toBeNull();
    expect(tabs).not.toBeNull();
    expect(account).toBeNull();
    expect(screen.queryByRole('region', { name: '프로필 사진 설정' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '로그아웃' })).not.toBeInTheDocument();
  });

  it('renders the extracted tab sections without losing their representative content', () => {
    const { rerender } = render(<MyPagePanel {...createPanelProps('stamps')} />);
    expect(screen.getByText('STAMP LOG')).toBeInTheDocument();

    rerender(<MyPagePanel {...createPanelProps('comments')} />);
    expect(screen.getByText('내 댓글 보기')).toBeInTheDocument();

    rerender(<MyPagePanel {...createPanelProps('routes')} />);
    expect(screen.getByText(myPageFixture.routes[0].title)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '코스 탭에서 보기' })).toBeInTheDocument();
  });
});
