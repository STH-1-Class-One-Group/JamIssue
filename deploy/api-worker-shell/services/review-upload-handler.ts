/*
 * File: review-upload-handler.ts
 * Purpose: Handle review image upload requests.
 * Primary Responsibility: Own Supabase Storage upload URL construction and file upload validation.
 * Design Intent: Keep binary upload flow separate from review/comment mutation handlers.
 * Non-Goals: This file does not create reviews, comments, likes, or notifications.
 * Dependencies: Worker HTTP helpers, Supabase key helper, and review session guard.
 */
import { jsonResponse } from '../lib/http';
import { getSupabaseKey } from '../lib/supabase';
import type { WorkerEnv, WorkerSessionUser } from '../types';
import type { WorkerReviewInteractionDeps } from './review-domain';
import { requireSessionUser } from './review-interaction-shared';

function sanitizeFileName(fileName: string) {
  return String(fileName || 'upload.jpg').replace(/[^a-zA-Z0-9._-]+/g, '-');
}

function buildPublicStorageUrl(env: WorkerEnv, objectPath: string) {
  const normalizedPath = objectPath.split('/').map((segment) => encodeURIComponent(segment)).join('/');
  return `${env.APP_SUPABASE_URL}/storage/v1/object/public/${env.APP_SUPABASE_STORAGE_BUCKET}/${normalizedPath}`;
}

async function uploadReviewFile(env: WorkerEnv, sessionUser: WorkerSessionUser, file: File) {
  if (!env.APP_SUPABASE_URL || !env.APP_SUPABASE_STORAGE_BUCKET) {
    throw new Error('Supabase Storage 설정이 비어 있어요.');
  }
  const storageKey = env.APP_SUPABASE_SERVICE_ROLE_KEY || getSupabaseKey(env);
  if (!storageKey) {
    throw new Error('Supabase Storage 권한 키가 비어 있어요.');
  }

  const safeFileName = sanitizeFileName(file.name);
  const objectPath = `reviews/${sessionUser.id.replace(/[^a-zA-Z0-9_-]+/g, '_')}/${Date.now()}-${safeFileName}`;
  const uploadPath = objectPath.split('/').map((segment) => encodeURIComponent(segment)).join('/');
  const uploadUrl = `${env.APP_SUPABASE_URL}/storage/v1/object/${env.APP_SUPABASE_STORAGE_BUCKET}/${uploadPath}`;
  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      apikey: storageKey,
      Authorization: `Bearer ${storageKey}`,
      'x-upsert': 'true',
      'content-type': file.type || 'application/octet-stream',
    },
    body: file,
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`이미지 업로드에 실패했어요. (${response.status}) ${detail}`);
  }
  return { url: buildPublicStorageUrl(env, objectPath), fileName: safeFileName, contentType: file.type || 'application/octet-stream' };
}

export async function handleReviewUpload(request: Request, env: WorkerEnv, deps: WorkerReviewInteractionDeps) {
  const sessionResult = await requireSessionUser(request, env, deps);
  if (sessionResult.response) {
    return sessionResult.response;
  }

  const formData = await request.formData();
  const file = formData.get('file');
  if (!(file instanceof File)) {
    return jsonResponse(400, { detail: '업로드할 이미지 파일이 필요해요.' }, env, request);
  }
  if (!(file.type || '').startsWith('image/')) {
    return jsonResponse(400, { detail: '이미지 파일만 업로드할 수 있어요.' }, env, request);
  }
  const maxUploadSize = Number(env.APP_MAX_UPLOAD_SIZE_BYTES ?? '5242880');
  if (file.size > maxUploadSize) {
    return jsonResponse(413, { detail: '이미지는 5MB 이하로 올려 주세요.' }, env, request);
  }

  const uploaded = await uploadReviewFile(env, sessionResult.sessionUser, file);
  return jsonResponse(200, uploaded, env, request);
}
