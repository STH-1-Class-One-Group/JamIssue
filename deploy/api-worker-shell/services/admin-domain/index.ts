/*
 * File: index.ts
 * Purpose: Expose the readable public entrypoint for the Worker admin domain.
 * Primary Responsibility: Let callers depend on the admin domain surface instead of internal filenames.
 * Design Intent: Human readers should see one admin-domain import before choosing to inspect contracts or repositories.
 * Non-Goals: This file does not implement authorization, summary loading, or place visibility mutations.
 * Dependencies: Admin domain contracts and repository functions.
 */
export type { WorkerAdminService, WorkerAdminServiceDeps } from './contracts';
export {
  loadAdminSummaryRows,
  loadPlaceReviewRows,
  loadPublicDataSource,
  updateAdminPlaceVisibility,
} from './repository';
