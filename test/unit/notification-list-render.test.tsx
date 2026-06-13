import { render } from '@testing-library/react';
import { memo } from 'react';
import { NotificationPanel } from '../../src/components/notifications/NotificationPanel';
import type { NotificationItem } from '../../src/components/notifications/notificationTypes';
import { describe, expect, it, vi } from 'vitest';

let renderCount1 = 0;
let renderCount2 = 0;

vi.mock('../../src/components/notifications/NotificationListItem', () => ({
  NotificationListItem: memo(({ notification, isBusy }: { notification: NotificationItem, isBusy: boolean }) => {
    if (notification.id === '1') renderCount1++;
    if (notification.id === '2') renderCount2++;
    return <div data-testid={`item-${notification.id}`} data-busy={isBusy} />;
  })
}));

describe('NotificationPanel Render Optimization', () => {
  it('does not re-render inactive notification items when busyId changes', () => {
    renderCount1 = 0;
    renderCount2 = 0;

    const mockNotifications: NotificationItem[] = [
      { id: '1', title: 'Test 1', body: 'Body 1', createdAt: '2024', isRead: false, type: 'app_notice' },
      { id: '2', title: 'Test 2', body: 'Body 2', createdAt: '2024', isRead: false, type: 'app_notice' },
    ];

    const actions = {
      busyId: null,
      busyAll: false,
      error: null,
      handleDelete: vi.fn(),
      handleMarkAll: vi.fn(),
      handleOpenNotification: vi.fn(),
    };

    const { rerender } = render(
      <NotificationPanel
        sessionUserName="Test"
        notifications={mockNotifications}
        unreadCount={2}
        actions={actions}
      />
    );

    expect(renderCount1).toBe(1);
    expect(renderCount2).toBe(1);

    // busyId becomes '1', so item 1 should re-render. item 2 should not.
    rerender(
      <NotificationPanel
        sessionUserName="Test"
        notifications={mockNotifications}
        unreadCount={2}
        actions={{ ...actions, busyId: '1' }}
      />
    );

    expect(renderCount1).toBe(2);
    expect(renderCount2).toBe(1); // Item 2 is NOT re-rendered because its props did not change!
  });
});
