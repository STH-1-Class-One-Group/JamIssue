import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { NotificationPanel } from '../../src/components/notifications/NotificationPanel';
import type { NotificationItem, NotificationPanelActions } from '../../src/components/notifications/notificationTypes';

const labelRenderCounts = vi.hoisted(() => new Map<string, number>());

vi.mock('../../src/components/notifications/notificationTypes', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/components/notifications/notificationTypes')>();

  return {
    ...actual,
    getNotificationLabel: vi.fn((notification: NotificationItem) => {
      labelRenderCounts.set(notification.id, (labelRenderCounts.get(notification.id) ?? 0) + 1);
      return notification.type;
    }),
  };
});

function createNotification(id: string): NotificationItem {
  return {
    id,
    type: 'review-comment',
    title: `title-${id}`,
    body: `body-${id}`,
    createdAt: '2026-06-13T00:00:00Z',
    isRead: false,
    reviewId: `review-${id}`,
    commentId: `comment-${id}`,
    routeId: null,
    actorName: null,
  };
}

function createActions(busyId: string | null): NotificationPanelActions {
  return {
    busyAll: false,
    busyId,
    error: null,
    handleDelete: stableHandlers.handleDelete,
    handleMarkAll: stableHandlers.handleMarkAll,
    handleOpenNotification: stableHandlers.handleOpenNotification,
  };
}

const stableHandlers = {
  handleDelete: vi.fn(async () => undefined),
  handleMarkAll: vi.fn(async () => undefined),
  handleOpenNotification: vi.fn(async () => undefined),
};

describe('NotificationPanel item render stability', () => {
  it('does not re-render inactive notification items when another item becomes busy', () => {
    labelRenderCounts.clear();
    const notifications = [createNotification('n-1'), createNotification('n-2')];

    const { rerender } = render(
      <NotificationPanel
        sessionUserName="tester"
        notifications={notifications}
        unreadCount={2}
        actions={createActions(null)}
      />,
    );

    expect(labelRenderCounts.get('n-1')).toBe(1);
    expect(labelRenderCounts.get('n-2')).toBe(1);

    rerender(
      <NotificationPanel
        sessionUserName="tester"
        notifications={notifications}
        unreadCount={2}
        actions={createActions('n-1')}
      />,
    );

    expect(labelRenderCounts.get('n-1')).toBe(2);
    expect(labelRenderCounts.get('n-2')).toBe(1);
  });

  it('calls the mark-all action while unread notifications remain', () => {
    stableHandlers.handleMarkAll.mockClear();

    render(
      <NotificationPanel
        sessionUserName="tester"
        notifications={[createNotification('n-1')]}
        unreadCount={1}
        actions={createActions(null)}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '모두 읽음' }));

    expect(stableHandlers.handleMarkAll).toHaveBeenCalledTimes(1);
  });

  it('disables the mark-all action and shows completion feedback when there is no unread notification', () => {
    render(
      <NotificationPanel
        sessionUserName="tester"
        notifications={[{ ...createNotification('n-1'), isRead: true }]}
        unreadCount={0}
        actions={createActions(null)}
      />,
    );

    expect(screen.getByRole('button', { name: '모두 읽음' })).toBeDisabled();
    expect(screen.getByText('모든 알림을 읽었어요.')).toBeInTheDocument();
    expect(document.querySelector('.notification-item.is-unread')).toBeNull();
  });

  it('shows progress feedback while the mark-all action is busy', () => {
    render(
      <NotificationPanel
        sessionUserName="tester"
        notifications={[createNotification('n-1')]}
        unreadCount={1}
        actions={{ ...createActions(null), busyAll: true }}
      />,
    );

    expect(screen.getByRole('button', { name: '처리 중' })).toBeDisabled();
  });
});
