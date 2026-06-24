import { fireEvent, render } from '@testing-library/react';
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

const stableHandlers = {
  handleDelete: vi.fn(async () => undefined),
  handleMarkAll: vi.fn(async () => undefined),
  handleOpenNotification: vi.fn(async () => undefined),
};

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

function getMarkAllButton(container: HTMLElement) {
  const button = container.querySelector<HTMLButtonElement>('.notification-panel__mark-all');
  expect(button).not.toBeNull();
  return button;
}

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

    const { container } = render(
      <NotificationPanel
        sessionUserName="tester"
        notifications={[createNotification('n-1')]}
        unreadCount={1}
        actions={createActions(null)}
      />,
    );

    fireEvent.click(getMarkAllButton(container));

    expect(stableHandlers.handleMarkAll).toHaveBeenCalledTimes(1);
  });

  it('disables mark-all and removes unread emphasis when every notification is read', () => {
    const { container } = render(
      <NotificationPanel
        sessionUserName="tester"
        notifications={[{ ...createNotification('n-1'), isRead: true }]}
        unreadCount={0}
        actions={createActions(null)}
      />,
    );

    expect(getMarkAllButton(container)).toBeDisabled();
    expect(container.querySelector('.notification-panel__status')).toHaveClass('drawer-kit-card');
    expect(container.querySelector('.notification-item.is-unread')).toBeNull();
  });

  it('separates notification tag, meta, and delete hit target in the item DOM', () => {
    const { container } = render(
      <NotificationPanel
        sessionUserName="tester"
        notifications={[{ ...createNotification('n-1'), actorName: 'code305' }]}
        unreadCount={1}
        actions={createActions(null)}
      />,
    );

    const topRow = container.querySelector('.drawer-kit-list-item__top');

    expect(topRow).not.toBeNull();
    expect(topRow?.querySelector('.drawer-kit-list-item__tag')).toHaveTextContent('review-comment');
    expect(topRow?.querySelector('.drawer-kit-list-item__meta')).toHaveTextContent('code305');
    expect(topRow?.querySelector('.drawer-kit-list-item__meta')).toHaveTextContent('2026-06-13T00:00:00Z');
    expect(topRow?.querySelector('.notification-item__delete')).not.toBeNull();
  });

  it('disables mark-all while the action is busy', () => {
    const { container } = render(
      <NotificationPanel
        sessionUserName="tester"
        notifications={[createNotification('n-1')]}
        unreadCount={1}
        actions={{ ...createActions(null), busyAll: true }}
      />,
    );

    expect(getMarkAllButton(container)).toBeDisabled();
  });
});
