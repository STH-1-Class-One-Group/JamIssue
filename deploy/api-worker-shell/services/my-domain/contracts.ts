/*
 * File: contracts.ts
 * Purpose: Define the public service contract for My Page Worker handlers.
 * Primary Responsibility: Keep My Page service shape owned by the my-domain boundary.
 * Design Intent: Route runtime needs only the handler facade, while implementation details stay inside the domain.
 * Non-Goals: This file does not implement summaries, comments, notification reads, or persistence.
 * Dependencies: Worker environment primitives.
 */
import type { WorkerEnv } from '../../types';

export interface WorkerMyService {
  handleMyComments(request: Request, env: WorkerEnv, url: URL): Promise<Response>;
  handleMySummary(request: Request, env: WorkerEnv): Promise<Response>;
}
