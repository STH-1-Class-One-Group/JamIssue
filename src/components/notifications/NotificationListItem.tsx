import { memo } from 'react';
import { getNotificationLabel } from './notificationTypes';
import type { NotificationItem } from './notificationTypes';

interface NotificationListItemProps {
  notification: NotificationItem;
  isBusy: boolean;
  onOpenNotification: (notification: NotificationItem) => Promise<void>;
  onDelete: (event: React.MouseEvent<HTMLButtonElement>, notificationId: string) => Promise<void>;
}

export const NotificationListItem = memo(function NotificationListItem({
  notification,
  isBusy,
  onOpenNotification,
  onDelete,
}: NotificationListItemProps) {
  const meta = notification.actorName
    ? `${notification.actorName} · ${notification.createdAt}`
    : notification.createdAt;

  return (
    <article className={notification.isRead ? 'notification-item chrome-drawer-card' : 'notification-item chrome-drawer-card is-unread'}>
      <div className="notification-item__top">
        <span className="soft-tag notification-item__tag">{getNotificationLabel(notification)}</span>
        <span className="notification-item__time">{meta}</span>
        <button
          type="button"
          className="notification-item__delete"
          aria-label="알림 삭제"
          onClick={(event) => void onDelete(event, notification.id)}
          disabled={isBusy}
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>
      <button
        type="button"
        className="notification-item__content"
        onClick={() => void onOpenNotification(notification)}
        disabled={isBusy}
      >
        <strong>{notification.title}</strong>
        <p>{notification.body}</p>
      </button>
    </article>
  );
});
