import { memo } from 'react';
import { DrawerListItem } from '../app-shell/drawer-kit';
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
  const deleteButton = (
    <button
      type="button"
      className="notification-item__delete"
      aria-label="알림 삭제"
      onClick={(event) => void onDelete(event, notification.id)}
      disabled={isBusy}
    >
      <span aria-hidden="true">×</span>
    </button>
  );

  return (
    <DrawerListItem
      action={deleteButton}
      body={notification.body}
      className={notification.isRead ? 'notification-item' : 'notification-item is-unread'}
      meta={meta}
      onOpen={() => void onOpenNotification(notification)}
      tag={getNotificationLabel(notification)}
      title={notification.title}
    />
  );
});
