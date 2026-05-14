import type { WorkerEnv } from '../../types';
import type { WorkerNotificationCreatePayload, WorkerReviewInteractionDeps } from './contracts';

export async function publishReviewNotification(
  env: WorkerEnv,
  deps: WorkerReviewInteractionDeps,
  payload: WorkerNotificationCreatePayload,
): Promise<void> {
  try {
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
  } catch (error) {
    console.error('Review notification side effect failed', error);
  }
}
