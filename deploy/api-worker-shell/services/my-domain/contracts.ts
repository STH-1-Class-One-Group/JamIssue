/*
 * File: contracts.ts
 * Purpose: Define the public service contract for My Page Worker handlers.
 * Primary Responsibility: Keep My Page service shape owned by the my-domain boundary.
 * Design Intent: Route runtime needs only the handler facade, while implementation details stay inside the domain.
 * Non-Goals: This file does not implement summaries, comments, notification reads, or persistence.
 * Dependencies: Worker environment primitives.
 */
import type { WorkerEnv } from '../../types';
import type { WorkerBaseData, WorkerStaticBaseRows } from '../../runtime/base-data-contracts';
import type { WorkerJsonRecord } from '../../types';
import type { WorkerCommunityRouteService } from '../community-domain/contracts';

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
