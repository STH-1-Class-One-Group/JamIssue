/*
 * File: contracts.ts
 * Purpose: Define review-domain service and side-effect dependency contracts.
 * Primary Responsibility: Keep review read and interaction interfaces near the review domain implementation.
 * Design Intent: Review handlers need explicit collaborators, but those collaborators should not expand the global Worker type barrel.
 * Non-Goals: This file does not perform persistence, notification publishing, or DTO mapping.
 * Dependencies: Worker environment primitives and current Worker read-model DTOs.
 */
import type { WorkerBaseData, WorkerPlace } from '../../runtime/base-data-contracts';
import type { WorkerEnv, WorkerJsonRecord, WorkerSessionUser } from '../../types';
import type { WorkerReview } from './read-model';

export interface WorkerReviewReadService {
  handleReviewFeed(request: Request, env: WorkerEnv, url: URL): Promise<Response>;
  handleReviews(request: Request, env: WorkerEnv, url: URL): Promise<Response>;
  handleReviewDetail(request: Request, env: WorkerEnv, reviewId: string): Promise<Response>;
  loadSingleReview(env: WorkerEnv, reviewId: string, sessionUserId?: string | null): Promise<WorkerReview | null>;
  mapReviewRows(
    feedRows: WorkerJsonRecord[],
    commentRows: WorkerJsonRecord[],
    likeRows: WorkerJsonRecord[],
    usersById: Map<string, WorkerJsonRecord>,
    placesByPositionId: Map<string, WorkerPlace>,
    stampRowsById: Map<string, WorkerJsonRecord>,
    routeRows: WorkerJsonRecord[],
    likedFeedIds: Set<string>,
  ): WorkerReview[];
}

export interface WorkerNotificationInsertResult extends WorkerJsonRecord {
  notification_id?: string | number | null;
}

export interface WorkerNotificationCreatePayload extends WorkerJsonRecord {
  userId: string;
  type: string;
  title: string;
  actorUserId?: string | null;
  body?: string;
  reviewId?: string | number | null;
  commentId?: string | number | null;
  routeId?: string | number | null;
  metadata?: WorkerJsonRecord;
}

export interface WorkerReviewInteractionDeps {
  badgeByMood: Record<string, string>;
  countUnreadNotifications(env: WorkerEnv, userId: string): Promise<number>;
  createUserNotification(env: WorkerEnv, payload: WorkerNotificationCreatePayload): Promise<WorkerNotificationInsertResult | null>;
  loadBaseData(env: WorkerEnv, sessionUserId?: string | null): Promise<WorkerBaseData>;
  loadNotificationById(env: WorkerEnv, notificationId: string | number): Promise<WorkerJsonRecord | null>;
  loadSingleReview(env: WorkerEnv, reviewId: string, sessionUserId?: string | null): Promise<WorkerReview | null>;
  publishNotificationEvent(env: WorkerEnv, userId: string, event: string, payload: WorkerJsonRecord): Promise<void>;
  readSessionUser(request: Request, env: WorkerEnv): Promise<WorkerSessionUser | null>;
}
