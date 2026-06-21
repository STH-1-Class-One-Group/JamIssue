import { NotificationPanel } from './NotificationPanel';
import { useNotificationPanelActions } from './useNotificationPanelActions';
import type { NotificationItem } from './notificationTypes';

export interface NotificationDrawerProps {
  isOpen: boolean;
  notifications: NotificationItem[];
  onClose: () => void;
  onDeleteNotification: (notificationId: string) => Promise<void>;
  onMarkAllNotificationsRead: () => Promise<void>;
  onOpenNotification: (notification: NotificationItem) => Promise<void>;
  sessionUserName: string | null;
  unreadCount: number;
}

export type NotificationDrawerContentProps = Omit<NotificationDrawerProps, 'isOpen' | 'onClose'>;

export function NotificationDrawer({
  isOpen,
  notifications,
  onClose,
  onDeleteNotification,
  onMarkAllNotificationsRead,
  onOpenNotification,
  sessionUserName,
  unreadCount,
}: NotificationDrawerProps) {
  const actions = useNotificationPanelActions({
    onOpenNotification,
    onMarkAllNotificationsRead,
    onDeleteNotification,
    onClose,
  });

  if (!isOpen) {
    return null;
  }

  return (
    <div className="notification-drawer" data-notification-drawer="root">
      <button
        type="button"
        className="notification-drawer__overlay"
        aria-label="알림 닫기"
        onClick={onClose}
      />
      <aside
        className="notification-drawer__panel"
        role="dialog"
        aria-modal="true"
        aria-label="알림"
      >
        <button
          type="button"
          className="notification-drawer__close"
          aria-label="알림 닫기"
          onClick={onClose}
        >
          ×
        </button>
        <NotificationPanel
          embedded
          sessionUserName={sessionUserName}
          notifications={notifications}
          unreadCount={unreadCount}
          actions={actions}
        />
      </aside>
    </div>
  );
}
