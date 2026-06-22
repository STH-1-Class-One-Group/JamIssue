import { NotificationPanel } from './NotificationPanel';
import { useNotificationPanelActions } from './useNotificationPanelActions';
import type { NotificationItem } from './notificationTypes';

export interface NotificationDrawerContentProps {
  notifications: NotificationItem[];
  onClose?: () => void;
  onDeleteNotification: (notificationId: string) => Promise<void>;
  onMarkAllNotificationsRead: () => Promise<void>;
  onOpenNotification: (notification: NotificationItem) => Promise<void>;
  sessionUserName: string | null;
  unreadCount: number;
}

export function NotificationDrawerContent({
  notifications,
  onClose,
  onDeleteNotification,
  onMarkAllNotificationsRead,
  onOpenNotification,
  sessionUserName,
  unreadCount,
}: NotificationDrawerContentProps) {
  const actions = useNotificationPanelActions({
    onOpenNotification,
    onMarkAllNotificationsRead,
    onDeleteNotification,
    onClose: onClose ?? (() => undefined),
  });

  return (
    <section className="side-drawer__notification-content" aria-label="알림">
      <NotificationPanel
        embedded
        sessionUserName={sessionUserName}
        notifications={notifications}
        unreadCount={unreadCount}
        actions={actions}
      />
    </section>
  );
}
