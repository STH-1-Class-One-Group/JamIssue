/*
 * File: contracts.ts
 * Purpose: Define the public service contract for community-route handlers.
 * Primary Responsibility: Keep community-route service shape owned by the community domain.
 * Design Intent: Runtime routing can depend on this narrow facade without centralizing the contract in global Worker types.
 * Non-Goals: This file does not implement route persistence, mapping, or authorization.
 * Dependencies: Worker environment primitives and JSON records returned by the current Worker read models.
 */
import type { WorkerEnv, WorkerJsonRecord } from '../../types';

export interface WorkerCommunityRouteService {
  handleCommunityRoutes(request: Request, env: WorkerEnv, url: URL): Promise<Response>;
  handleCreateUserRoute(request: Request, env: WorkerEnv): Promise<Response>;
  handleMyRoutes(request: Request, env: WorkerEnv): Promise<Response>;
  handleToggleCommunityRouteLike(request: Request, env: WorkerEnv, routeId: string): Promise<Response>;
  loadCommunityRoutes(env: WorkerEnv, options?: WorkerJsonRecord): Promise<WorkerJsonRecord[]>;
}
