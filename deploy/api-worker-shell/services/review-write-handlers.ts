/*
 * File: review-write-handlers.ts
 * Purpose: Handle review create, update, and delete requests.
 * Primary Responsibility: Own review mutation HTTP use cases and related notification side effects.
 * Design Intent: Keep review CRUD readable without mixing comment and like logic.
 * Non-Goals: This file does not upload files or mutate comments/likes.
 * Dependencies: Worker HTTP helpers, review repository functions, and review session guard.
 */
import { jsonResponse } from '../lib/http';
import type { WorkerEnv } from '../types';
import type { WorkerReviewInteractionDeps } from './review-domain';
import {
  createReviewRow,
  deleteReviewRow,
  publishReviewNotification,
  readFeedRow,
  readStampRow,
  updateReviewRow,
} from './review-domain';
import { readJsonBody, requireSessionUser } from './review-interaction-shared';

export async function handleCreateReview(request: Request, env: WorkerEnv, deps: WorkerReviewInteractionDeps) {
  const sessionResult = await requireSessionUser(request, env, deps);
  if (sessionResult.response) {
    return sessionResult.response;
  }

  const payload = await readJsonBody(request);
  const placeId = String(payload.placeId ?? '').trim();
  const stampId = String(payload.stampId ?? '').trim();
  const body = String(payload.body ?? '').trim();
  const mood = String(payload.mood ?? '설렘').trim();
  const imageUrl = payload.imageUrl ? String(payload.imageUrl) : null;
  if (!placeId) {
    return jsonResponse(400, { detail: '장소 정보가 필요해요.' }, env, request);
  }
  if (!stampId) {
    return jsonResponse(400, { detail: '피드를 쓰려면 해당 방문 스탬프가 필요해요.' }, env, request);
  }
  if (!body) {
    return jsonResponse(400, { detail: '후기를 조금 더 적어 주세요.' }, env, request);
  }

  const baseData = await deps.loadBaseData(env, sessionResult.sessionUser.id);
  const place = baseData.places.find((item) => item.id === placeId);
  if (!place) {
    return jsonResponse(404, { detail: '장소를 찾지 못했어요.' }, env, request);
  }
  const stampRow = await readStampRow(env, stampId);
  if (!stampRow) {
    return jsonResponse(404, { detail: '방문 스탬프를 찾지 못했어요.' }, env, request);
  }
  if (stampRow.user_id !== sessionResult.sessionUser.id || String(stampRow.position_id) !== String(place.positionId)) {
    return jsonResponse(403, { detail: '해당 장소의 방문 스탬프가 확인되어야 피드를 쓸 수 있어요.' }, env, request);
  }

  const insertedRow = await createReviewRow(env, {
    position_id: Number(place.positionId),
    user_id: sessionResult.sessionUser.id,
    stamp_id: Number(stampId),
    body,
    mood,
    badge: deps.badgeByMood[mood] ?? '현장 방문',
    image_url: imageUrl,
  });
  const createdReviewId = insertedRow?.feed_id as string | number | undefined;
  const createdReview = createdReviewId == null
    ? null
    : await deps.loadSingleReview(env, String(createdReviewId), sessionResult.sessionUser.id);

  await publishReviewNotification(env, deps, {
    userId: sessionResult.sessionUser.id,
    actorUserId: sessionResult.sessionUser.id,
    type: 'review-created',
    title: '피드 작성이 완료되었습니다.',
    body: `${place.name} 피드를 남겼어요.`,
    reviewId: createdReviewId ?? null,
    metadata: { placeId: place.id },
  });

  return jsonResponse(201, createdReview, env, request);
}

export async function handleUpdateReview(request: Request, env: WorkerEnv, reviewId: string, deps: WorkerReviewInteractionDeps) {
  const sessionResult = await requireSessionUser(request, env, deps);
  if (sessionResult.response) {
    return sessionResult.response;
  }

  const reviewRow = await readFeedRow(env, reviewId);
  if (!reviewRow) {
    return jsonResponse(404, { detail: '후기를 찾지 못했어요.' }, env, request);
  }
  if (reviewRow.user_id !== sessionResult.sessionUser.id) {
    return jsonResponse(403, { detail: '내가 쓴 피드만 수정할 수 있어요.' }, env, request);
  }

  const payload = await readJsonBody(request);
  const body = String(payload.body ?? '').trim();
  const mood = String(payload.mood ?? '').trim();
  const imageUrlProvided = Object.prototype.hasOwnProperty.call(payload, 'imageUrl');
  const imageUrl = imageUrlProvided ? (payload.imageUrl ? String(payload.imageUrl) : null) : undefined;
  if (!body) {
    return jsonResponse(400, { detail: '후기를 조금 더 적어 주세요.' }, env, request);
  }
  if (!mood) {
    return jsonResponse(400, { detail: '무드 태그를 선택해 주세요.' }, env, request);
  }

  await updateReviewRow(env, reviewId, {
    body,
    mood,
    ...(imageUrlProvided ? { image_url: imageUrl } : {}),
    badge: deps.badgeByMood[mood] ?? '현장 방문',
    updated_at: new Date().toISOString(),
  });
  const updatedReview = await deps.loadSingleReview(env, reviewId, sessionResult.sessionUser.id);
  return jsonResponse(200, updatedReview, env, request);
}

export async function handleDeleteReview(request: Request, env: WorkerEnv, reviewId: string, deps: WorkerReviewInteractionDeps) {
  const sessionResult = await requireSessionUser(request, env, deps);
  if (sessionResult.response) {
    return sessionResult.response;
  }

  const reviewRow = await readFeedRow(env, reviewId);
  if (!reviewRow) {
    return jsonResponse(404, { detail: '후기를 찾지 못했어요.' }, env, request);
  }
  if (reviewRow.user_id !== sessionResult.sessionUser.id) {
    return jsonResponse(403, { detail: '내가 쓴 피드만 삭제할 수 있어요.' }, env, request);
  }

  await deleteReviewRow(env, reviewId);
  return jsonResponse(200, { reviewId: String(reviewId), deleted: true }, env, request);
}
