/*
 * File: contracts.ts
 * Purpose: Define the public service contract for My Page Worker handlers.
 * Primary Responsibility: Keep My Page service shape owned by the my-domain boundary.
 * Design Intent: Route runtime needs only the handler facade, while implementation details stay inside the domain.
 * Non-Goals: This file does not implement summaries, comments, notification reads, or persistence.
 * Dependencies: Worker environment primitives.
 */
import type { WorkerEnv, WorkerJsonRecord } from '../../types';
import type { WorkerBaseData, WorkerStaticBaseRows } from '../../runtime/base-data-contracts';
import type { WorkerCommunityRouteService } from '../community-domain';

export interface WorkerMyCommentRow extends WorkerJsonRecord {
  comment_id: string | number;
  feed_id: string | number;
  body?: string | null;
  parent_id?: string | number | null;
  is_deleted?: boolean | null;
  created_at: string;
}

export interface WorkerMyFeedRow extends WorkerJsonRecord {
  feed_id?: string | number;
  id?: string | number;
  position_id?: string | number | null;
  placeId?: string | null;
  placeName?: string | null;
  body?: string | null;
}

export type WorkerMyFeedInput = WorkerMyFeedRow[] | Map<string, WorkerMyFeedRow>;

export interface WorkerMyPlaceRef extends WorkerJsonRecord {
  id: string;
  name: string;
}

export type WorkerMyPlaceMap = Map<string, WorkerMyPlaceRef>;

export interface WorkerMyServiceDeps {
  communityRouteService: WorkerCommunityRouteService;
  loadBaseData(env: WorkerEnv, sessionUserId?: string | null): Promise<WorkerBaseData>;
  loadStaticBaseRows(env: WorkerEnv): Promise<WorkerStaticBaseRows>;
  loadUserNotifications(env: WorkerEnv, userId: string): Promise<WorkerJsonRecord[]>;
}

export interface WorkerMyService {
  handleMyComments(request: Request, env: WorkerEnv, url: URL): Promise<Response>;
  handleMySummary(request: Request, env: WorkerEnv): Promise<Response>;
}
