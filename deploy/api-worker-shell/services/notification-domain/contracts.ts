import type { WorkerJsonRecord } from '../../types';

export interface WorkerNotificationRow extends WorkerJsonRecord {
  notification_id: string | number;
  user_id: string;
  actor_user_id?: string | null;
  type: string;
  title: string;
  body?: string | null;
  review_id?: string | number | null;
  comment_id?: string | number | null;
  route_id?: string | number | null;
  is_read?: boolean | null;
  created_at: string;
}

export interface WorkerNotificationActorRow extends WorkerJsonRecord {
  user_id: string;
  nickname?: string | null;
}

export interface WorkerNotificationInsertResult extends WorkerJsonRecord {
  notification_id?: string | number | null;
}

export interface WorkerNotificationCreatePayload extends WorkerJsonRecord {
  userId: string;
  actorUserId?: string | null;
  type: string;
  title: string;
  body?: string;
  reviewId?: string | number | null;
  commentId?: string | number | null;
  routeId?: string | number | null;
  metadata?: WorkerJsonRecord;
}
