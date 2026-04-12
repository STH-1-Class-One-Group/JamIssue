import { prepareReviewImageUpload } from '../lib/imageUpload';
import type {
  Comment,
  CommentCreateRequest,
  Review,
  ReviewCreateRequest,
  ReviewFeedPageResponse,
  ReviewLikeResponse,
  ReviewUpdateRequest,
  UploadResponse,
} from '../types';
import { fetchJson, invalidateApiCache } from './core';

export function getReviews(params?: { placeId?: string; userId?: string }) {
  const search = new URLSearchParams();
  if (params?.placeId) {
    search.set('placeId', params.placeId);
  }
  if (params?.userId) {
    search.set('userId', params.userId);
  }
  const query = search.toString();
  return fetchJson<Review[]>(`/api/reviews${query ? `?${query}` : ''}`);
}

export function getReviewFeedPage(params?: { cursor?: string | null; limit?: number }) {
  const search = new URLSearchParams();
  if (params?.cursor) {
    search.set('cursor', params.cursor);
  }
  if (params?.limit) {
    search.set('limit', String(params.limit));
  }
  const query = search.toString();
  return fetchJson<ReviewFeedPageResponse>(`/api/review-feed${query ? `?${query}` : ''}`);
}

export function getReviewDetail(reviewId: string) {
  return fetchJson<Review>(`/api/reviews/${reviewId}`);
}

export async function createReview(payload: ReviewCreateRequest) {
  const response = await fetchJson<Review>('/api/reviews', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  invalidateApiCache(['/api/reviews', '/api/my/summary']);
  return response;
}

export async function updateReview(reviewId: string, payload: ReviewUpdateRequest) {
  const response = await fetchJson<Review>(`/api/reviews/${reviewId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  invalidateApiCache(['/api/reviews', `/api/reviews/${reviewId}`, '/api/my/summary']);
  return response;
}

export async function toggleReviewLike(reviewId: string) {
  const response = await fetchJson<ReviewLikeResponse>(`/api/reviews/${reviewId}/like`, {
    method: 'POST',
  });
  invalidateApiCache(['/api/reviews']);
  return response;
}

export function getReviewComments(reviewId: string) {
  return fetchJson<Comment[]>(`/api/reviews/${reviewId}/comments`);
}

export async function createComment(reviewId: string, payload: CommentCreateRequest) {
  const response = await fetchJson<Comment[]>(`/api/reviews/${reviewId}/comments`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  invalidateApiCache([`/api/reviews/${reviewId}/comments`, '/api/reviews', '/api/my/summary']);
  return response;
}

export async function updateComment(reviewId: string, commentId: string, payload: { body: string }) {
  const response = await fetchJson<Comment[]>(`/api/reviews/${reviewId}/comments/${commentId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  invalidateApiCache([`/api/reviews/${reviewId}/comments`, '/api/reviews', '/api/my/summary']);
  return response;
}

export async function deleteComment(reviewId: string, commentId: string) {
  const response = await fetchJson<Comment[]>(`/api/reviews/${reviewId}/comments/${commentId}`, {
    method: 'DELETE',
  });
  invalidateApiCache([`/api/reviews/${reviewId}/comments`, '/api/reviews', '/api/my/summary']);
  return response;
}

export async function deleteReview(reviewId: string) {
  const response = await fetchJson<{ reviewId: string; deleted: boolean }>(`/api/reviews/${reviewId}`, {
    method: 'DELETE',
  });
  invalidateApiCache(['/api/reviews', '/api/my/summary']);
  return response;
}

export async function uploadReviewImage(file: File) {
  const preparedUpload = await prepareReviewImageUpload(file);
  const body = new FormData();
  body.append('file', preparedUpload.file);
  if (preparedUpload.thumbnailFile) {
    body.append('thumbnail', preparedUpload.thumbnailFile);
  }
  return fetchJson<UploadResponse>('/api/reviews/upload', {
    method: 'POST',
    body,
  });
}

