/*
 * File: review-comment-handlers.ts
 * Purpose: Handle review comment create, update, and delete requests.
 * Primary Responsibility: Own comment mutation HTTP use cases and notification side effects.
 * Design Intent: Keep threaded comment rules readable without mixing review CRUD or like logic.
 * Non-Goals: This file does not upload files, create reviews, or toggle likes.
 * Dependencies: Worker HTTP helpers, review repository functions, and review session guard.
 */
import { jsonResponse } from '../lib/http';
import type { WorkerEnv, WorkerJsonRecord } from '../types';
import type { WorkerReviewInteractionDeps } from './review-domain';
import {
  createCommentRow,
  publishReviewNotification,
  readCommentRow,
  readFeedRow,
  softDeleteCommentRow,
  updateCommentRow,
} from './review-domain';
import { readJsonBody, requireSessionUser } from './review-interaction-shared';

export async function handleCreateComment(request: Request, env: WorkerEnv, reviewId: string, deps: WorkerReviewInteractionDeps) {
  const sessionResult = await requireSessionUser(request, env, deps);
  if (sessionResult.response) {
    return sessionResult.response;
  }

  const reviewRow = await readFeedRow(env, reviewId);
  if (!reviewRow) {
    return jsonResponse(404, { detail: '후기를 찾지 못했어요.' }, env, request);
  }
  const payload = await readJsonBody(request);
  const body = String(payload.body ?? '').trim();
  let parentId = payload.parentId ? Number(payload.parentId) : null;
  let parentComment: WorkerJsonRecord | null = null;
  if (!body) {
    return jsonResponse(400, { detail: '댓글을 조금 더 적어 주세요.' }, env, request);
  }
  if (parentId) {
    parentComment = await readCommentRow(env, parentId);
    if (!parentComment || String(parentComment.feed_id) !== String(reviewId)) {
      return jsonResponse(400, { detail: '같은 후기 안의 댓글에만 답글을 달 수 있어요.' }, env, request);
    }
    if (parentComment.parent_id) {
      parentId = Number(parentComment.parent_id);
    }
  }

  const insertedRow = await createCommentRow(env, {
    feed_id: Number(reviewId),
    user_id: sessionResult.sessionUser.id,
    parent_id: parentId,
    body,
    is_deleted: false,
  });
  const createdCommentId = insertedRow?.comment_id ?? null;
  const actorUserId = sessionResult.sessionUser.id;
  const reviewOwnerId = reviewRow.user_id;
  if (parentComment && parentComment.user_id && parentComment.user_id !== actorUserId) {
    await publishReviewNotification(env, deps, {
      userId: String(parentComment.user_id),
      actorUserId,
      type: 'comment-reply',
      title: '내 댓글에 답글이 달렸습니다.',
      body,
      reviewId,
      commentId: createdCommentId as string | number | null,
    });
  }
  if (reviewOwnerId && reviewOwnerId !== actorUserId && (!parentComment || parentComment.user_id !== reviewOwnerId)) {
    await publishReviewNotification(env, deps, {
      userId: String(reviewOwnerId),
      actorUserId,
      type: 'review-comment',
      title: '내 피드에 댓글이 달렸습니다.',
      body,
      reviewId,
      commentId: createdCommentId as string | number | null,
    });
  }

  const comments = (await deps.loadSingleReview(env, reviewId, sessionResult.sessionUser.id))?.comments ?? [];
  return jsonResponse(200, comments, env, request);
}

export async function handleUpdateComment(request: Request, env: WorkerEnv, reviewId: string, commentId: string, deps: WorkerReviewInteractionDeps) {
  const sessionResult = await requireSessionUser(request, env, deps);
  if (sessionResult.response) {
    return sessionResult.response;
  }

  const reviewRow = await readFeedRow(env, reviewId);
  if (!reviewRow) {
    return jsonResponse(404, { detail: '후기를 찾지 못했어요.' }, env, request);
  }
  const commentRow = await readCommentRow(env, commentId);
  if (!commentRow || String(commentRow.feed_id) !== String(reviewId)) {
    return jsonResponse(404, { detail: '댓글을 찾지 못했어요.' }, env, request);
  }
  if (commentRow.user_id !== sessionResult.sessionUser.id) {
    return jsonResponse(403, { detail: '내 댓글만 수정할 수 있어요.' }, env, request);
  }
  if (commentRow.is_deleted) {
    return jsonResponse(400, { detail: '삭제된 댓글은 수정할 수 없어요.' }, env, request);
  }

  const payload = await readJsonBody(request);
  const body = String(payload.body ?? '').trim();
  if (!body) {
    return jsonResponse(400, { detail: '댓글을 조금 더 적어 주세요.' }, env, request);
  }

  await updateCommentRow(env, commentId, { body, updated_at: new Date().toISOString() });
  const comments = (await deps.loadSingleReview(env, reviewId, sessionResult.sessionUser.id))?.comments ?? [];
  return jsonResponse(200, comments, env, request);
}

export async function handleDeleteComment(request: Request, env: WorkerEnv, reviewId: string, commentId: string, deps: WorkerReviewInteractionDeps) {
  const sessionResult = await requireSessionUser(request, env, deps);
  if (sessionResult.response) {
    return sessionResult.response;
  }

  const reviewRow = await readFeedRow(env, reviewId);
  if (!reviewRow) {
    return jsonResponse(404, { detail: '후기를 찾지 못했어요.' }, env, request);
  }
  const commentRow = await readCommentRow(env, commentId);
  if (!commentRow || String(commentRow.feed_id) !== String(reviewId)) {
    return jsonResponse(404, { detail: '댓글을 찾지 못했어요.' }, env, request);
  }
  if (commentRow.user_id !== sessionResult.sessionUser.id) {
    return jsonResponse(403, { detail: '내 댓글만 삭제할 수 있어요.' }, env, request);
  }

  await softDeleteCommentRow(env, commentId);
  const comments = (await deps.loadSingleReview(env, reviewId, sessionResult.sessionUser.id))?.comments ?? [];
  return jsonResponse(200, comments, env, request);
}
