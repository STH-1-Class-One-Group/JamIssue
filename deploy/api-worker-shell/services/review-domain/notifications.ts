import type { WorkerEnv, WorkerNotificationCreatePayload, WorkerReviewInteractionDeps } from '../../types';

export async function publishReviewNotification(
  env: WorkerEnv,
  deps: WorkerReviewInteractionDeps,
  payload: WorkerNotificationCreatePayload,
): Promise<void> {
  const createdNotification = await deps.createUserNotification(env, payload);
  if (!createdNotification?.notification_id) {
    return;
  }

  const notification = await deps.loadNotificationById(env, createdNotification.notification_id);
  if (!notification) {
    return;
  }

  await deps.publishNotificationEvent(env, payload.userId, 'notification.created', {
    notification,
    unreadCount: await deps.countUnreadNotifications(env, payload.userId),
  });
}
