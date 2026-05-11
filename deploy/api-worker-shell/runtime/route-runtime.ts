/*
 * File: route-runtime.ts
 * Purpose: Define the dependency contract consumed by Worker route dispatch.
 * Primary Responsibility: Keep route-level service dependencies local to the runtime layer.
 * Design Intent: Route dispatch should depend on a small runtime contract without forcing service interfaces into the global Worker type barrel.
 * Non-Goals: This file does not implement services, map database rows, or change external REST behavior.
 * Dependencies: Worker runtime DTOs, service-owned contracts, and review interaction dependency contracts.
 */
import type { WorkerBaseData, WorkerCourse } from './base-data-contracts';
import type { WorkerEnv } from '../types';
import type { WorkerAdminService } from '../services/admin-domain/contracts';
import type { WorkerCommunityRouteService } from '../services/community-domain/contracts';
import type { WorkerMyService } from '../services/my-domain/contracts';
import type { WorkerReviewInteractionDeps, WorkerReviewReadService } from '../services/review-domain/contracts';
import type { WorkerStampService } from '../services/stamp-domain/contracts';

export interface RouteRuntime {
  adminService: WorkerAdminService;
  buildReviewInteractionDeps: () => WorkerReviewInteractionDeps;
  communityRouteService: WorkerCommunityRouteService;
  loadBaseData: (env: WorkerEnv, sessionUserId?: string | null) => Promise<WorkerBaseData>;
  loadCuratedCourses: (env: WorkerEnv) => Promise<WorkerCourse[]>;
  myService: WorkerMyService;
  reviewReadService: WorkerReviewReadService;
  stampService: WorkerStampService;
}
