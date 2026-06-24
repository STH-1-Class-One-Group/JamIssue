import { DrawerCard, DrawerSection, DrawerStack } from '../app-shell/drawer-kit';
import { NotificationListItem } from './NotificationListItem';
import type { NotificationItem, NotificationPanelActions } from './notificationTypes';

interface NotificationPanelProps {
  sessionUserName: string | null;
  notifications: NotificationItem[];
  unreadCount: number;
  actions: NotificationPanelActions;
  embedded?: boolean;
}

export function NotificationPanel({
  sessionUserName,
  notifications,
  unreadCount,
  actions,
  embedded = false,
}: NotificationPanelProps) {
  const {
    busyAll,
    error,
    handleDelete,
    handleMarkAll,
    handleOpenNotification,
    busyId,
  } = actions;
  const hasNotifications = notifications.length > 0;
  const allRead = hasNotifications && unreadCount === 0;

  return (
    <section className={embedded ? 'global-notification-panel global-notification-panel--embedded' : 'global-notification-panel'}>
      <DrawerSection
        eyebrow="ALERT"
        title={sessionUserName ? `${sessionUserName}님의 새 알림` : '새 알림'}
        description="탭에 있던 내용을 닫지 않고 바로 확인하고 이동할 수 있어요."
      >
        <button
          type="button"
          className="secondary-button notification-panel__mark-all"
          onClick={() => void handleMarkAll()}
          disabled={busyAll || unreadCount === 0}
        >
          {busyAll ? '처리 중' : '모두 읽음'}
        </button>
      </DrawerSection>
      {allRead ? <DrawerCard as="p" className="notification-panel__status">모든 알림을 읽었어요.</DrawerCard> : null}
      {error ? <p className="form-error-copy">{error}</p> : null}
      <DrawerStack className="notification-list">
        {notifications.map((notification) => (
          <NotificationListItem
            key={notification.id}
            notification={notification}
            isBusy={busyId === notification.id}
            onOpenNotification={handleOpenNotification}
            onDelete={handleDelete}
          />
        ))}
        {notifications.length === 0 ? <p className="empty-copy">새로운 알림이 아직 없어요.</p> : null}
      </DrawerStack>
    </section>
  );
}
