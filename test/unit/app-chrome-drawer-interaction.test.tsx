import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AppChrome } from '../../src/components/app-shell/AppChrome';
import type { NotificationDrawerContentProps } from '../../src/components/notifications/NotificationDrawerContent';

const notificationUtility: NotificationDrawerContentProps = {
  notifications: [
    {
      id: 'n-1',
      type: 'review-comment',
      title: '댓글 알림',
      body: '새 댓글이 있어요.',
      createdAt: '2026-06-13T00:00:00Z',
      isRead: false,
      reviewId: 'review-1',
      commentId: 'comment-1',
      routeId: null,
      actorName: null,
    },
  ],
  onDeleteNotification: vi.fn(async () => undefined),
  onMarkAllNotificationsRead: vi.fn(async () => undefined),
  onOpenNotification: vi.fn(async () => undefined),
  sessionUserName: 'code305',
  unreadCount: 1,
};

function renderChrome() {
  return render(
    <AppChrome
      activeTab="map"
      canNavigateBack
      center={<button type="button">전체</button>}
      globalUtility={{
        mapDisplayPreferences: {
          showCuratedWithTourism: true,
          onShowCuratedWithTourismChange: vi.fn(),
        },
      }}
      notificationUtility={notificationUtility}
      onNavigateBack={vi.fn()}
      sessionUser={null}
    />,
  );
}

describe('AppChrome drawer interaction contract', () => {
  it('toggles the left drawer from the capsule hamburger button', async () => {
    const user = userEvent.setup();
    renderChrome();

    const menuButton = screen.getByRole('button', { name: '보조 메뉴 열기' });
    await user.click(menuButton);
    expect(screen.getByRole('dialog', { name: '보조 메뉴' })).toBeInTheDocument();

    await user.click(menuButton);
    expect(screen.queryByRole('dialog', { name: '보조 메뉴' })).not.toBeInTheDocument();
  });

  it('toggles the right settings drawer and closes the opposite drawer', async () => {
    const user = userEvent.setup();
    renderChrome();

    const menuButton = screen.getByRole('button', { name: '보조 메뉴 열기' });
    const settingsButton = screen.getByRole('button', { name: '앱 설정 열기' });

    await user.click(menuButton);
    expect(screen.getByRole('dialog', { name: '보조 메뉴' })).toBeInTheDocument();

    await user.click(settingsButton);
    expect(screen.queryByRole('dialog', { name: '보조 메뉴' })).not.toBeInTheDocument();
    const settingsDrawer = screen.getByRole('dialog', { name: '앱 설정' });
    expect(within(settingsDrawer).getByText('지도 표시')).toBeInTheDocument();

    await user.click(settingsButton);
    expect(screen.queryByRole('dialog', { name: '앱 설정' })).not.toBeInTheDocument();
  });
});
