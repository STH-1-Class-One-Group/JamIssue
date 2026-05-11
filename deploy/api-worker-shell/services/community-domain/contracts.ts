/*
 * File: contracts.ts
 * Purpose: Define the public service contract for community-route handlers.
 * Primary Responsibility: Keep community-route service shape owned by the community domain.
 * Design Intent: Runtime routing can depend on this narrow facade without centralizing the contract in global Worker types.
 * Non-Goals: This file does not implement route persistence, mapping, or authorization.
 * Dependencies: Worker environment primitives and JSON records returned by the current Worker read models.
 */
import type { WorkerEnv, WorkerJsonRecord } from '../../types';
import type { WorkerStaticBaseRows } from '../../runtime/base-data-contracts';

export interface WorkerCommunityRouteRow extends WorkerJsonRecord {
  route_id: string | number;
  user_id: string;
  title: string;
  description?: string | null;
  mood?: string | null;
  like_count?: number | null;
  created_at: string;
  is_user_generated?: boolean | null;
  travel_session_id?: string | number | null;
}

export interface WorkerCommunityRoutePlaceRow extends WorkerJsonRecord {
  route_id: string | number;
  position_id: string | number;
  stop_order: number;
}

export interface WorkerCommunityRouteLikeRow extends WorkerJsonRecord {
  route_id: string | number;
}

export interface WorkerCommunityUserRow extends WorkerJsonRecord {
  user_id: string;
  nickname?: string | null;
}

export interface WorkerCommunityPlaceRef extends WorkerJsonRecord {
  id: string;
  name: string;
}

export type WorkerCommunityPlaceMap = Map<string, WorkerCommunityPlaceRef>;

export interface WorkerCommunityRouteLoadOptions extends WorkerJsonRecord {
  ownerUserId?: string | null;
  sessionUserId?: string | null;
  sort?: string;
}

export interface WorkerCommunityRouteServiceDeps {
  loadStaticBaseRows(env: WorkerEnv): Promise<WorkerStaticBaseRows>;
}

export interface WorkerCommunityRouteService {
  handleCommunityRoutes(request: Request, env: WorkerEnv, url: URL): Promise<Response>;
  handleCreateUserRoute(request: Request, env: WorkerEnv): Promise<Response>;
  handleMyRoutes(request: Request, env: WorkerEnv): Promise<Response>;
  handleToggleCommunityRouteLike(request: Request, env: WorkerEnv, routeId: string): Promise<Response>;
  loadCommunityRoutes(env: WorkerEnv, options?: WorkerCommunityRouteLoadOptions): Promise<WorkerJsonRecord[]>;
}
