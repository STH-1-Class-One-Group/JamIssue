/*
 * File: review-like-handler.ts
 * Purpose: Handle review like toggle requests.
 * Primary Responsibility: Own like existence check, insert/delete, and response count assembly.
 * Design Intent: Keep the like use case independent from review and comment mutation handlers.
 * Non-Goals: This file does not create reviews, comments, uploads, or notifications.
 * Dependencies: Worker HTTP helpers, review repository functions, and review session guard.
 */
import { jsonResponse } from '../lib/http';
import type { WorkerEnv } from '../types';
import type { WorkerReviewInteractionDeps } from './review-domain';
import {
  countReviewLikes,
  createReviewLikeRow,
  deleteReviewLikeRow,
  readFeedRow,
  readReviewLikeRow,
} from './review-domain';
import { requireSessionUser } from './review-interaction-shared';

export async function handleToggleReviewLike(request: Request, env: WorkerEnv, reviewId: string, deps: WorkerReviewInteractionDeps) {
  const sessionResult = await requireSessionUser(request, env, deps);
  if (sessionResult.response) {
    return sessionResult.response;
  }

  const reviewRow = await readFeedRow(env, reviewId);
  if (!reviewRow) {
    return jsonResponse(404, { detail: '후기를 찾지 못했어요.' }, env, request);
  }

  const existing = await readReviewLikeRow(env, reviewId, sessionResult.sessionUser.id);
  if (existing) {
    await deleteReviewLikeRow(env, existing.feed_like_id as string | number);
  } else {
    await createReviewLikeRow(env, reviewId, sessionResult.sessionUser.id);
  }

  return jsonResponse(200, { reviewId: String(reviewId), likeCount: await countReviewLikes(env, reviewId), likedByMe: !existing }, env, request);
}
