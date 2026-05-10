/*
 * File: contracts.ts
 * Purpose: Define the public service contract for stamp Worker handlers.
 * Primary Responsibility: Keep stamp service shape owned by the stamp domain boundary.
 * Design Intent: Route runtime depends on the stamp facade while stamp implementation keeps geolocation and persistence details hidden.
 * Non-Goals: This file does not implement stamp distance checks, session creation, or persistence.
 * Dependencies: Worker environment primitives.
 */
import type { WorkerEnv } from '../../types';

export interface WorkerStampService {
  handleToggleStamp(request: Request, env: WorkerEnv): Promise<Response>;
}
