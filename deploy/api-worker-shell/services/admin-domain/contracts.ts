/*
 * File: contracts.ts
 * Purpose: Define the public service contract for admin Worker handlers.
 * Primary Responsibility: Keep admin handler dependencies owned by the admin domain.
 * Design Intent: Runtime routing should see an explicit admin facade without placing admin service shape in global Worker types.
 * Non-Goals: This file does not implement admin authorization, imports, or place visibility updates.
 * Dependencies: Worker environment primitives.
 */
import type { WorkerEnv } from '../../types';

export interface WorkerAdminService {
  handleAdminSummary(request: Request, env: WorkerEnv): Promise<Response>;
  handleAdminImportPublicData(request: Request, env: WorkerEnv): Promise<Response>;
  handleAdminPlaceVisibility(request: Request, env: WorkerEnv, placeId: string): Promise<Response>;
}
