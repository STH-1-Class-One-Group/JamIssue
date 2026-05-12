/*
 * File: index.ts
 * Purpose: Expose the readable public entrypoint for community-route domain collaborators.
 * Primary Responsibility: Keep service callers on one domain import instead of mapper, repository, and contract internals.
 * Design Intent: The community-route facade can reveal its owned domain without leaking its internal file layout.
 * Non-Goals: This file does not map routes, authorize requests, or persist route data.
 * Dependencies: Community domain contracts, mapper, and repository functions.
 */
export type { WorkerCommunityRouteLoadOptions, WorkerCommunityRouteService, WorkerCommunityRouteServiceDeps } from './contracts';
export { mapCommunityRoutes } from './mapper';
export {
  countRouteLikes,
  createRouteLike,
  createUserRoute,
  createUserRoutePlaces,
  deleteRouteLike,
  loadRouteDetailRows,
  loadRouteRows,
  loadSessionStampRows,
  readExistingRouteForSession,
  readRouteLikeRow,
  readRouteRow,
  readTravelSessionForOwner,
  updateRouteLikeCount,
} from './repository';
