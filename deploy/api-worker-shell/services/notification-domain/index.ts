/*
 * File: index.ts
 * Purpose: Expose the readable public entrypoint for notification persistence and publishing.
 * Primary Responsibility: Hide notification repository and realtime publisher filenames from the service facade.
 * Design Intent: Notification handlers should read as domain operations without exposing Supabase or broadcast layout.
 * Non-Goals: This file does not implement notification HTTP handlers or realtime protocol details.
 * Dependencies: Notification contracts, repository functions, and realtime publisher helpers.
 */
export type {
  WorkerNotificationCreatePayload,
  WorkerNotificationInsertResult,
  WorkerNotificationRow,
} from './contracts';
export { buildNotificationRealtimeTopic, sendRealtimeBroadcast } from './publisher';
export {
  createNotification,
  deleteNotificationRow,
  markAllNotificationsRead,
  markNotificationRead,
  readNotificationActorRow,
  readNotificationActorRows,
  readNotificationRow,
  readUnreadNotificationRows,
  readUserNotificationRows,
} from './repository';
