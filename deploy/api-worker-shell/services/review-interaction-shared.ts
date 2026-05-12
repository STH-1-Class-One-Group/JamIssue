/*
 * File: review-interaction-shared.ts
 * Purpose: Share request parsing and session guard helpers for review interaction handlers.
 * Primary Responsibility: Keep cross-handler HTTP preconditions in one small module.
 * Design Intent: Handler files should read by use case without duplicating auth and JSON parsing.
 * Non-Goals: This file does not mutate reviews, comments, likes, or storage objects.
 * Dependencies: Worker HTTP helpers and review interaction dependency contract.
 */
import { jsonResponse } from '../lib/http';
import type { WorkerEnv, WorkerJsonRecord } from '../types';
import type { WorkerReviewInteractionDeps } from './review-domain';

export async function readJsonBody(request: Request): Promise<WorkerJsonRecord> {
  try {
    return await request.json() as WorkerJsonRecord;
  } catch {
    throw new Error('요청 형식이 올바르지 않아요.');
  }
}

export async function requireSessionUser(request: Request, env: WorkerEnv, deps: WorkerReviewInteractionDeps) {
  const sessionUser = await deps.readSessionUser(request, env);
  if (!sessionUser) {
    return { response: jsonResponse(401, { detail: '로그인이 필요해요.' }, env, request) };
  }
  return { sessionUser };
}
