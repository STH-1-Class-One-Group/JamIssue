import { fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';
import { act } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { NotificationListItem } from '../../src/components/notifications/NotificationListItem';
import { NotificationPanel } from '../../src/components/notifications/NotificationPanel';
import { getNotificationLabel, type NotificationItem } from '../../src/components/notifications/notificationTypes';
import { useNotificationPanelActions } from '../../src/components/notifications/useNotificationPanelActions';

function notificationFixture(overrides: Partial<NotificationItem> = {}): NotificationItem {
  return {
    id: 'notification-1',
    type: 'review-comment',
    title: 'title',
    body: 'body',
    createdAt: '2026-05-14T00:00:00Z',
    isRead: false,
    reviewId: 'review-1',
    commentId: null,
    routeId: null,
    actorName: 'actor',
    ...overrides,
  };
}

describe('notification panel boundary', () => {
  it('labels every notification type and falls back for unknown types', () => {
    expect(getNotificationLabel(notificationFixture({ type: 'review-created' }))).not.toHaveLength(0);
    expect(getNotificationLabel(notificationFixture({ type: 'route-published' }))).not.toHaveLength(0);
    expect(getNotificationLabel(notificationFixture({ type: 'review-comment' }))).not.toHaveLength(0);
    expect(getNotificationLabel(notificationFixture({ type: 'comment-reply' }))).not.toHaveLength(0);
    expect(getNotificationLabel(notificationFixture({ type: 'unknown' as NotificationItem['type'] }))).not.toHaveLength(0);
  });

  it('renders embedded empty, error, and busy panel states without invoking item actions', () => {
    const actions = {
      busyAll: true,
      busyId: null,
      error: 'network',
      handleDelete: vi.fn(),
      handleMarkAll: vi.fn(),
      handleOpenNotification: vi.fn(),
    };

    render(
      <NotificationPanel
        sessionUserName={null}
        notifications={[]}
        unreadCount={0}
        actions={actions}
        embedded
      />,
    );

    expect(document.querySelector('.global-notification-panel--embedded')).toBeInTheDocument();
    expect(screen.getByText('network')).toBeInTheDocument();
    expect(document.querySelector('.empty-copy')).toBeInTheDocument();
    const markAllButton = document.querySelector<HTMLButtonElement>('.notification-panel__mark-all');
    expect(markAllButton).toBeDisabled();
    fireEvent.click(markAllButton!);
    expect(actions.handleMarkAll).not.toHaveBeenCalled();
  });

  it('wires list item open and delete actions with busy disabled state', async () => {
    const notification = notificationFixture({ actorName: null, isRead: true });
    const onOpenNotification = vi.fn().mockResolvedValue(undefined);
    const onDelete = vi.fn().mockResolvedValue(undefined);
    const { rerender } = render(
      <NotificationListItem
        notification={notification}
        busyId={null}
        onOpenNotification={onOpenNotification}
        onDelete={onDelete}
      />,
    );

    fireEvent.click(document.querySelector<HTMLButtonElement>('.notification-item__content')!);
    await waitFor(() => expect(onOpenNotification).toHaveBeenCalledWith(notification));

    const stopPropagation = vi.fn();
    fireEvent.click(document.querySelector<HTMLButtonElement>('.notification-item__delete')!, { stopPropagation });
    await waitFor(() => expect(onDelete).toHaveBeenCalledWith(expect.any(Object), 'notification-1'));

    rerender(
      <NotificationListItem
        notification={notification}
        busyId="notification-1"
        onOpenNotification={onOpenNotification}
        onDelete={onDelete}
      />,
    );
    expect(document.querySelector<HTMLButtonElement>('.notification-item__content')).toBeDisabled();
    expect(document.querySelector<HTMLButtonElement>('.notification-item__delete')).toBeDisabled();
  });

  it('tracks notification panel action busy state and maps async failures', async () => {
    const onOpenNotification = vi.fn().mockResolvedValue(undefined);
    const onMarkAllNotificationsRead = vi.fn().mockRejectedValueOnce(new Error('mark failed')).mockResolvedValue(undefined);
    const onDeleteNotification = vi.fn().mockRejectedValueOnce('delete failed').mockResolvedValue(undefined);
    const onClose = vi.fn();
    const { result } = renderHook(() => useNotificationPanelActions({
      onOpenNotification,
      onMarkAllNotificationsRead,
      onDeleteNotification,
      onClose,
    }));

    await act(async () => {
      await result.current.handleOpenNotification(notificationFixture());
    });
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(result.current.busyId).toBeNull();

    await act(async () => {
      await result.current.handleMarkAll();
    });
    expect(result.current.error).toBe('mark failed');
    expect(result.current.busyAll).toBe(false);

    await act(async () => {
      await result.current.handleDelete({ stopPropagation: vi.fn() } as unknown as React.MouseEvent<HTMLButtonElement>, 'notification-1');
    });
    expect(result.current.error).not.toBeNull();
    expect(result.current.busyId).toBeNull();

    await act(async () => {
      await result.current.handleMarkAll();
      await result.current.handleDelete({ stopPropagation: vi.fn() } as unknown as React.MouseEvent<HTMLButtonElement>, 'notification-2');
    });
    expect(onMarkAllNotificationsRead).toHaveBeenCalledTimes(2);
    expect(onDeleteNotification).toHaveBeenCalledWith('notification-2');
  });
});
