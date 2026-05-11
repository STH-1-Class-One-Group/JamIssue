/*
 * File: contracts.ts
 * Purpose: Define review-domain service and side-effect dependency contracts.
 * Primary Responsibility: Keep review read and interaction interfaces near the review domain implementation.
 * Design Intent: Review handlers need explicit collaborators, but those collaborators should not expand the global Worker type barrel.
 * Non-Goals: This file does not perform persistence, notification publishing, or DTO mapping.
 * Dependencies: Worker environment primitives and current Worker read-model DTOs.
 */
import type { SupabaseMapRow, WorkerBaseData, WorkerPlace, WorkerStaticBaseRows } from '../../runtime/base-data-contracts';
import type { WorkerEnv, WorkerJsonRecord, WorkerSessionUser } from '../../types';
import type { WorkerReview } from './read-model';

export interface WorkerReviewFeedRow extends WorkerJsonRecord {
  feed_id: string | number;
  user_id: string;
  position_id: string | number;
  body: string;
  mood?: string | null;
  badge?: string | null;
  created_at: string;
  image_url?: string | null;
  stamp_id?: string | number | null;
}

export interface WorkerReviewCommentRow extends WorkerJsonRecord {
  comment_id: string | number;
  feed_id: string | number;
  user_id: string;
  body?: string | null;
  parent_id?: string | number | null;
  is_deleted?: boolean | null;
  created_at: string;
}

export interface WorkerReviewLikeRow extends WorkerJsonRecord {
  feed_id: string | number;
}

export interface WorkerReviewUserRow extends WorkerJsonRecord {
  user_id: string;
  nickname?: string | null;
}

export interface WorkerReviewStampRow extends WorkerJsonRecord {
  stamp_id: string | number;
  visit_ordinal?: number | null;
  travel_session_id?: string | number | null;
}

export interface WorkerReviewRouteRow extends WorkerJsonRecord {
  route_id: string | number;
  travel_session_id?: string | number | null;
}

export interface WorkerReviewReadServiceDeps {
  formatVisitLabel: (visitNumber: unknown) => string;
  loadStaticBaseRows(env: WorkerEnv): Promise<WorkerStaticBaseRows>;
  mapPlace(row: SupabaseMapRow): WorkerPlace;
}

export interface WorkerReviewDataFilters {
  placeId?: string;
  userId?: string;
}

export interface WorkerReviewPageOptions {
  cursor?: string | null;
  limit?: number;
}

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
