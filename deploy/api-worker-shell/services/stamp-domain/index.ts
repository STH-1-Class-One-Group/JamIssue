/*
 * File: index.ts
 * Purpose: Expose the readable public entrypoint for Worker stamp domain collaborators.
 * Primary Responsibility: Let the stamp service facade import one owned domain surface.
 * Design Intent: Stamp persistence is domain-owned, while callers should not need repository file names.
 * Non-Goals: This file does not implement stamp claim logic or database operations.
 * Dependencies: Stamp domain contracts and repository functions.
 */
export type { WorkerStampService, WorkerStampServiceDeps } from './contracts';
export {
  createTravelSession,
  createUserStamp,
  readLastStampRow,
  readPlaceStampRows,
  readTodayStampRow,
  readTravelSessionRow,
  updateStampTravelSession,
  updateTravelSession,
} from './repository';
