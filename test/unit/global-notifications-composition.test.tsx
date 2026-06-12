import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useGlobalNotifications } from '../../src/hooks/useGlobalNotifications';
import type { SessionUser } from '../../src/types/auth';
import type { MyPageResponse } from '../../src/types/my-page';

const notificationMocks = vi.hoisted(() => {
  const storeState = {
    notifications: [
      {
        id: 'notification-1',
        type: 'comment-reply',
        title: 'reply',
        body: 'body',
        createdAt: '04. 07. 10:15',
        isRead: false,
        reviewId: 'review-1',
        commentId: 'comment-1',
        routeId: null,
        actorName: 'tester',
      },
    ],
    unreadCount: 1,
    fetchNotifications: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
    hydrate: vi.fn(),
    markRead: vi.fn(),
    markAllRead: vi.fn(),
    deleteNotification: vi.fn(),
  };
  return {
    actions: {
      handleDeleteNotification: vi.fn(),
      handleMarkAllNotificationsRead: vi.fn(),
      handleMarkNotificationRead: vi.fn(),
      handleOpenGlobalNotification: vi.fn(),
    },
    storeState,
    useNotificationActions: vi.fn(() => notificationMocks.actions),
    useNotificationLifecycle: vi.fn(),
    useNotificationStore: vi.fn((selector: (state: typeof storeState) => unknown) => selector(storeState)),
  };
});

vi.mock('../../src/store/notification-store', () => ({
  useNotificationStore: notificationMocks.useNotificationStore,
}));
vi.mock('../../src/hooks/useNotificationLifecycle', () => ({
  useNotificationLifecycle: notificationMocks.useNotificationLifecycle,
}));
vi.mock('../../src/hooks/useNotificationActions', () => ({
  useNotificationActions: notificationMocks.useNotificationActions,
}));

function sessionUserFixture(): SessionUser {
  return {
    id: 'user-1',
    nickname: 'tester',
    email: null,
    provider: 'kakao',
    profileImage: null,
    isAdmin: false,
    profileCompletedAt: null,
  };
}

describe('useGlobalNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('wires notification store state, lifecycle, and actions into a global notification facade', () => {
    const sessionUser = sessionUserFixture();
    const myPage = { notifications: [], unreadNotificationCount: 0 } as MyPageResponse;
    const goToTab = vi.fn();
    const setMyPageTab = vi.fn();
    const handleOpenCommentWithReturn = vi.fn();
    const handleOpenReviewWithReturn = vi.fn();

    const { result } = renderHook(() => useGlobalNotifications({
      sessionUser,
      myPage,
      goToTab,
      setMyPageTab,
      handleOpenCommentWithReturn,
      handleOpenReviewWithReturn,
    }));

    expect(notificationMocks.useNotificationLifecycle).toHaveBeenCalledWith({
      sessionUser,
      myPage,
      fetchNotifications: notificationMocks.storeState.fetchNotifications,
      connectNotifications: notificationMocks.storeState.connect,
      disconnectNotifications: notificationMocks.storeState.disconnect,
      hydrateNotifications: notificationMocks.storeState.hydrate,
    });
    expect(notificationMocks.useNotificationActions).toHaveBeenCalledWith({
      markNotificationReadInStore: notificationMocks.storeState.markRead,
      markAllNotificationsReadInStore: notificationMocks.storeState.markAllRead,
      deleteNotificationInStore: notificationMocks.storeState.deleteNotification,
      handleOpenCommentWithReturn,
      handleOpenReviewWithReturn,
      goToTab,
      setMyPageTab,
    });
    expect(result.current).toEqual({
      notifications: notificationMocks.storeState.notifications,
      unreadNotificationCount: 1,
      ...notificationMocks.actions,
    });
  });
});
