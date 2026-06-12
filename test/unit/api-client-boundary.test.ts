import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getAdminSummary, importPublicData, updatePlaceVisibility } from '../../src/api/adminClient';
import { getProviderLoginUrl, logout, updateProfile } from '../../src/api/authClient';
import { getBootstrap, getCuratedCourses, getFestivals, getMapBootstrap, getPublicEventBanner } from '../../src/api/bootstrapClient';
import { ApiError, fetchJson, invalidateApiCache } from '../../src/api/core';
import { getTourismPlaces } from '../../src/api/tourismClient';
import {
  deleteNotification,
  getMyCommentsPage,
  getMyNotifications,
  getMyNotificationsRealtimeChannel,
  getMySummary,
  markAllNotificationsRead,
  markNotificationRead,
} from '../../src/api/myClient';
import {
  createComment,
  createReview,
  deleteComment,
  deleteReview,
  getReviewComments,
  getReviewDetail,
  getReviewFeedPage,
  getReviews,
  toggleReviewLike,
  uploadReviewImage,
  updateReview,
  updateComment,
} from '../../src/api/reviewsClient';
import { createUserRoute, getCommunityRoutes, toggleCommunityRouteLike } from '../../src/api/routesClient';
import { claimStamp } from '../../src/api/stampClient';
import type {
  AuthSessionResponse,
  BootstrapResponse,
  Comment,
  MapBootstrapResponse,
  Review,
  ReviewMood,
  UserRoute,
  UserNotification,
} from '../../src/types';

type FetchHandler = (url: string, init?: RequestInit) => Response | Promise<Response>;

interface CapturedFetchCall {
  url: string;
  init?: RequestInit;
}

const API_BASE_URL = 'https://api.example.test';
const reviewMood = 'test-mood' as ReviewMood;

const imageUploadMocks = vi.hoisted(() => ({
  prepareReviewImageUpload: vi.fn(),
}));

vi.mock('../../src/lib/imageUpload', () => ({
  prepareReviewImageUpload: imageUploadMocks.prepareReviewImageUpload,
}));

const authResponse: AuthSessionResponse = {
  isAuthenticated: true,
  providers: [],
  user: {
    id: 'user-1',
    nickname: 'tester',
    email: 'tester@example.test',
    provider: 'kakao',
    profileImage: null,
    isAdmin: false,
    profileCompletedAt: '2026-05-14T00:00:00Z',
  },
};

const reviewFixture: Review = {
  id: 'review-1',
  userId: 'user-1',
  placeId: 'place-1',
  placeName: 'Place 1',
  author: 'tester',
  body: 'body',
  mood: reviewMood,
  badge: 'badge',
  visitedAt: '2026-05-14',
  imageUrl: null,
  thumbnailUrl: null,
  commentCount: 0,
  likeCount: 0,
  likedByMe: false,
  stampId: 'stamp-1',
  visitNumber: 1,
  visitLabel: '1',
  travelSessionId: null,
  hasPublishedRoute: false,
  comments: [],
};

const commentFixture: Comment = {
  id: 'comment-1',
  userId: 'user-1',
  author: 'tester',
  body: 'comment body',
  parentId: null,
  isDeleted: false,
  createdAt: '2026-05-14T00:00:00Z',
  replies: [],
};

function notificationFixture(id: string): UserNotification {
  return {
    id,
    type: 'comment-reply',
    title: 'reply',
    body: 'body',
    createdAt: '2026-05-14T00:00:00Z',
    isRead: false,
    reviewId: 'review-1',
    commentId: 'comment-1',
    routeId: null,
    actorName: 'tester',
  };
}

const routeFixture: UserRoute = {
  id: 'route-1',
  authorId: 'user-1',
  author: 'tester',
  title: 'Route 1',
  description: 'description',
  mood: 'walk',
  likeCount: 0,
  likedByMe: false,
  createdAt: '2026-05-14T00:00:00Z',
  placeIds: ['place-1'],
  placeNames: ['Place 1'],
  isUserGenerated: true,
  travelSessionId: 'session-1',
};

const bootstrapFixture: BootstrapResponse = {
  auth: authResponse,
  places: [],
  reviews: [reviewFixture],
  courses: [],
  stamps: {
    collectedPlaceIds: ['place-1'],
    logs: [],
    travelSessions: [],
  },
  hasRealData: true,
};

function jsonResponse(payload: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  if (!headers.has('content-type')) {
    headers.set('content-type', 'application/json');
  }
  return new Response(JSON.stringify(payload), {
    ...init,
    headers,
    status: init.status ?? 200,
  });
}

function stubFetch(handler: FetchHandler) {
  const calls: CapturedFetchCall[] = [];
  const fetchSpy = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = input instanceof Request ? input.url : String(input);
    calls.push({ url, init });
    return handler(url, init);
  });
  vi.stubGlobal('fetch', fetchSpy);
  return { calls, fetchSpy };
}

function pathOf(call: CapturedFetchCall) {
  const url = new URL(call.url);
  return `${url.pathname}${url.search}`;
}

function parseJsonBody(init?: RequestInit) {
  if (typeof init?.body !== 'string') {
    return undefined;
  }
  return JSON.parse(init.body) as unknown;
}

function setClientConfig() {
  window.__JAMISSUE_CONFIG__ = {
    apiBaseUrl: API_BASE_URL,
    naverMapClientId: 'naver-client',
    supabaseUrl: 'https://supabase.example.test',
    supabaseAnonKey: 'supabase-anon',
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  invalidateApiCache();
  setClientConfig();
});

describe('fetchJson', () => {
  it('uses the configured API base URL with no-store credentials and JSON headers', async () => {
    const { calls } = stubFetch(() => jsonResponse({ ok: true }));

    await expect(fetchJson<{ ok: boolean }>('/api/ping')).resolves.toEqual({ ok: true });

    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe(`${API_BASE_URL}/api/ping`);
    expect(calls[0].init?.credentials).toBe('include');
    expect(calls[0].init?.cache).toBe('no-store');
    expect(new Headers(calls[0].init?.headers).get('Content-Type')).toBe('application/json');
  });

  it('deduplicates cached GET requests and clones cached payloads', async () => {
    let requestCount = 0;
    const { fetchSpy } = stubFetch(() => jsonResponse({ value: ++requestCount, nested: { stable: true } }));

    const first = await fetchJson<{ value: number; nested: { stable: boolean } }>('/api/cached');
    first.nested.stable = false;
    const second = await fetchJson<{ value: number; nested: { stable: boolean } }>('/api/cached');

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(second).toEqual({ value: 1, nested: { stable: true } });

    invalidateApiCache(['/api/cached']);

    await expect(fetchJson<{ value: number }>('/api/cached')).resolves.toMatchObject({ value: 2 });
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it('throws API errors with server detail and dispatches auth expiration on 401', async () => {
    const authExpired = vi.fn();
    window.addEventListener('jamissue:auth-expired', authExpired);
    stubFetch(() => jsonResponse({ detail: 'session expired' }, { status: 401 }));

    await expect(fetchJson('/api/private')).rejects.toMatchObject<ApiError>({
      message: 'session expired',
      status: 401,
    });
    expect(authExpired).toHaveBeenCalledTimes(1);

    window.removeEventListener('jamissue:auth-expired', authExpired);
  });

  it('handles empty responses, status-text fallback errors, pending GET dedupe, and FormData bodies', async () => {
    let releasePending: ((response: Response) => void) | undefined;
    const { calls, fetchSpy } = stubFetch((url, _init) => {
      const { pathname } = new URL(url);
      if (pathname === '/api/no-content') {
        return new Response(null, { status: 204 });
      }
      if (pathname === '/api/status-error') {
        return new Response('not json', { status: 503, statusText: 'Service Unavailable' });
      }
      if (pathname === '/api/pending') {
        return new Promise<Response>((resolve) => {
          releasePending = resolve;
        });
      }
      if (pathname === '/api/upload') {
        return jsonResponse({ ok: true });
      }
      throw new Error(`Unhandled request: ${pathname}`);
    });

    await expect(fetchJson('/api/no-content')).resolves.toBeUndefined();
    await expect(fetchJson('/api/status-error')).rejects.toMatchObject<ApiError>({
      message: 'Service Unavailable',
      status: 503,
    });

    const firstPending = fetchJson<{ ok: boolean }>('/api/pending');
    const secondPending = fetchJson<{ ok: boolean }>('/api/pending');
    releasePending?.(jsonResponse({ ok: true }));
    await expect(Promise.all([firstPending, secondPending])).resolves.toEqual([{ ok: true }, { ok: true }]);

    const body = new FormData();
    body.append('file', new Blob(['x']), 'upload.txt');
    await expect(fetchJson<{ ok: boolean }>('/api/upload', { method: 'POST', body })).resolves.toEqual({ ok: true });

    expect(fetchSpy).toHaveBeenCalledTimes(4);
    expect(new Headers(calls.at(-1)?.init?.headers).has('Content-Type')).toBe(false);
  });
});

describe('bootstrap clients', () => {
  it('falls back to bootstrap when map bootstrap is unavailable', async () => {
    const { calls } = stubFetch((url) => {
      const { pathname } = new URL(url);
      if (pathname === '/api/map-bootstrap') {
        return jsonResponse({ detail: 'not ready' }, { status: 501 });
      }
      return jsonResponse(bootstrapFixture);
    });

    await expect(getMapBootstrap()).resolves.toEqual<MapBootstrapResponse>({
      auth: bootstrapFixture.auth,
      places: bootstrapFixture.places,
      stamps: bootstrapFixture.stamps,
      hasRealData: bootstrapFixture.hasRealData,
    });
    expect(calls.map(pathOf)).toEqual(['/api/map-bootstrap', '/api/bootstrap']);
  });

  it('falls back to bootstrap courses when curated courses are unavailable', async () => {
    const { calls } = stubFetch((url) => {
      const { pathname } = new URL(url);
      if (pathname === '/api/courses/curated') {
        return jsonResponse({ detail: 'not ready' }, { status: 500 });
      }
      return jsonResponse(bootstrapFixture);
    });

    await expect(getCuratedCourses()).resolves.toEqual({ courses: bootstrapFixture.courses });
    expect(calls.map(pathOf)).toEqual(['/api/courses/curated', '/api/bootstrap']);
  });

  it('keeps direct bootstrap reads cached by endpoint', async () => {
    const { fetchSpy } = stubFetch(() => jsonResponse(bootstrapFixture));

    await getBootstrap();
    await getBootstrap();

    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('does not hide non-fallback bootstrap errors', async () => {
    stubFetch((url) => {
      const { pathname } = new URL(url);
      if (pathname === '/api/map-bootstrap') {
        return jsonResponse({ detail: 'bad request' }, { status: 400 });
      }
      throw new Error(`Unexpected fallback request: ${pathname}`);
    });

    await expect(getMapBootstrap()).rejects.toMatchObject<ApiError>({ status: 400 });
  });
});

describe('auth, admin, stamp, route, review, and my clients', () => {
  it('builds provider login URLs from the configured API origin', () => {
    expect(getProviderLoginUrl('kakao', 'https://daejeon.jamissue.com/feed?x=1', 'link')).toBe(
      `${API_BASE_URL}/api/auth/kakao/login?next=https%3A%2F%2Fdaejeon.jamissue.com%2Ffeed%3Fx%3D1&mode=link`,
    );
  });

  it('sends mutation methods and JSON bodies through domain clients', async () => {
    const { calls } = stubFetch((url, init) => {
      const { pathname } = new URL(url);
      const method = init?.method ?? 'GET';
      if (pathname === '/api/auth/logout') return jsonResponse(authResponse);
      if (pathname === '/api/auth/profile') return jsonResponse(authResponse);
      if (pathname === '/api/admin/places/place-1') return jsonResponse({ id: 'place-1' });
      if (pathname === '/api/admin/import/public-data') return jsonResponse({ importedPlaces: 1, importedCourses: 0 });
      if (pathname === '/api/stamps/toggle') return jsonResponse(bootstrapFixture.stamps);
      if (pathname === '/api/community-routes') {
        return method === 'POST' ? jsonResponse(routeFixture) : jsonResponse([routeFixture]);
      }
      if (pathname === '/api/community-routes/route-1/like') {
        return jsonResponse({ routeId: 'route-1', likeCount: 1, likedByMe: true });
      }
      if (pathname === '/api/reviews') {
        return method === 'POST' ? jsonResponse(reviewFixture) : jsonResponse([reviewFixture]);
      }
      if (pathname === '/api/reviews/review-1') {
        return method === 'DELETE' ? jsonResponse({ reviewId: 'review-1', deleted: true }) : jsonResponse(reviewFixture);
      }
      if (pathname === '/api/reviews/upload') return jsonResponse({ url: 'https://image.test/review.jpg', thumbnailUrl: 'https://image.test/thumb.jpg' });
      if (pathname === '/api/reviews/review-1/comments/comment-1') return jsonResponse([]);
      if (pathname === '/api/reviews/review-1/like') {
        return jsonResponse({ reviewId: 'review-1', likeCount: 1, likedByMe: true });
      }
      if (pathname === '/api/reviews/review-1/comments') {
        return method === 'POST' ? jsonResponse([commentFixture]) : jsonResponse([commentFixture]);
      }
      if (pathname === '/api/notifications/noti-1/read') {
        return jsonResponse({ notificationId: 'noti-1', read: true });
      }
      if (pathname === '/api/notifications/noti-1') {
        return jsonResponse({ notificationId: 'noti-1', deleted: true });
      }
      if (pathname === '/api/notifications/read-all') return jsonResponse({ updated: 1 });
      throw new Error(`Unhandled request: ${method} ${pathname}`);
    });

    await logout();
    await updateProfile({ nickname: 'tester2' });
    await updatePlaceVisibility('place-1', { isActive: false, isManualOverride: true });
    await importPublicData();
    await claimStamp({ placeId: 'place-1', latitude: 36.35, longitude: 127.38 });
    await createUserRoute({
      title: 'Route 1',
      description: 'description',
      mood: 'walk',
      travelSessionId: 'session-1',
      isPublic: true,
    });
    await toggleCommunityRouteLike('route-1');
    await createReview({ placeId: 'place-1', stampId: 'stamp-1', body: 'body', mood: reviewMood });
    await updateReview('review-1', { body: 'updated', mood: reviewMood });
    await toggleReviewLike('review-1');
    await createComment('review-1', { body: 'comment body', parentId: null });
    await updateComment('review-1', 'comment-1', { body: 'updated comment' });
    await deleteComment('review-1', 'comment-1');
    await deleteReview('review-1');
    await markNotificationRead('noti-1');
    await markAllNotificationsRead();
    await deleteNotification('noti-1');

    expect(calls.map((call) => `${call.init?.method ?? 'GET'} ${pathOf(call)}`)).toEqual([
      'POST /api/auth/logout',
      'PATCH /api/auth/profile',
      'PATCH /api/admin/places/place-1',
      'POST /api/admin/import/public-data',
      'POST /api/stamps/toggle',
      'POST /api/community-routes',
      'POST /api/community-routes/route-1/like',
      'POST /api/reviews',
      'PATCH /api/reviews/review-1',
      'POST /api/reviews/review-1/like',
      'POST /api/reviews/review-1/comments',
      'PATCH /api/reviews/review-1/comments/comment-1',
      'DELETE /api/reviews/review-1/comments/comment-1',
      'DELETE /api/reviews/review-1',
      'PATCH /api/notifications/noti-1/read',
      'PATCH /api/notifications/read-all',
      'DELETE /api/notifications/noti-1',
    ]);
    expect(parseJsonBody(calls[2].init)).toEqual({ isActive: false, isManualOverride: true });
    expect(parseJsonBody(calls[4].init)).toEqual({ placeId: 'place-1', latitude: 36.35, longitude: 127.38 });
    expect(parseJsonBody(calls[7].init)).toEqual({
      placeId: 'place-1',
      stampId: 'stamp-1',
      body: 'body',
      mood: reviewMood,
    });
    expect(parseJsonBody(calls[10].init)).toEqual({ body: 'comment body', parentId: null });
    expect(parseJsonBody(calls[11].init)).toEqual({ body: 'updated comment' });
  });

  it('uploads prepared review image files through multipart form data', async () => {
    const preparedFile = new File(['image'], 'prepared.jpg', { type: 'image/jpeg' });
    const thumbnailFile = new File(['thumb'], 'thumb.jpg', { type: 'image/jpeg' });
    imageUploadMocks.prepareReviewImageUpload.mockResolvedValueOnce({
      file: preparedFile,
      thumbnailFile,
    });
    const { calls } = stubFetch((url) => {
      const { pathname } = new URL(url);
      if (pathname === '/api/reviews/upload') {
        return jsonResponse({ url: 'https://image.test/review.jpg', thumbnailUrl: 'https://image.test/thumb.jpg' });
      }
      throw new Error(`Unhandled request: ${pathname}`);
    });

    await expect(uploadReviewImage(new File(['raw'], 'raw.jpg', { type: 'image/jpeg' }))).resolves.toEqual({
      url: 'https://image.test/review.jpg',
      thumbnailUrl: 'https://image.test/thumb.jpg',
    });

    const body = calls[0].init?.body;
    expect(body).toBeInstanceOf(FormData);
    expect((body as FormData).get('file')).toBe(preparedFile);
    expect((body as FormData).get('thumbnail')).toBe(thumbnailFile);
  });

  it('omits the thumbnail part when image preparation returns only the main file', async () => {
    const preparedFile = new File(['image'], 'prepared.jpg', { type: 'image/jpeg' });
    imageUploadMocks.prepareReviewImageUpload.mockResolvedValueOnce({
      file: preparedFile,
      thumbnailFile: null,
    });
    const { calls } = stubFetch(() => jsonResponse({ url: 'https://image.test/review.jpg' }));

    await uploadReviewImage(new File(['raw'], 'raw.jpg', { type: 'image/jpeg' }));

    const body = calls[0].init?.body as FormData;
    expect(body.get('file')).toBe(preparedFile);
    expect(body.has('thumbnail')).toBe(false);
  });

  it('builds query strings for list endpoints', async () => {
    const { calls } = stubFetch((url) => {
      const { pathname } = new URL(url);
      if (pathname === '/api/admin/summary') return jsonResponse({ places: [] });
      if (pathname === '/api/community-routes') return jsonResponse([routeFixture]);
      if (pathname === '/api/my/comments') return jsonResponse({ items: [], nextCursor: null });
      if (pathname === '/api/my/notifications') return jsonResponse([notificationFixture('notification-1')]);
      if (pathname === '/api/my/notifications/realtime-channel') return jsonResponse({ channel: 'notification:user-1' });
      if (pathname === '/api/banner/events') {
        return jsonResponse({ sourceReady: true, sourceName: 'events', importedAt: null, items: [] });
      }
      if (pathname === '/api/festivals') return jsonResponse([]);
      if (pathname === '/api/tourism/places') return jsonResponse({ sourceReady: true, sourceName: 'KTO', importedAt: null, facets: { contentTypes: [], ktoFacets: [], districts: [] }, items: [] });
      if (pathname === '/api/my/summary') {
        return jsonResponse({
          user: authResponse.user,
          stats: {},
          reviews: [],
          comments: [],
          notifications: [],
          unreadNotificationCount: 0,
          stampLogs: [],
          travelSessions: [],
          visitedPlaces: [],
          unvisitedPlaces: [],
          collectedPlaces: [],
          routes: [],
        });
      }
      if (pathname === '/api/review-feed') return jsonResponse({ items: [reviewFixture], nextCursor: 'next' });
      if (pathname === '/api/reviews') return jsonResponse([reviewFixture]);
      if (pathname === '/api/reviews/review-1') return jsonResponse(reviewFixture);
      if (pathname === '/api/reviews/review-1/comments') return jsonResponse([commentFixture]);
      throw new Error(`Unhandled request: ${pathname}`);
    });

    await getAdminSummary();
    await getCommunityRoutes('latest');
    await getMyCommentsPage({ cursor: 'cursor-1', limit: 20 });
    await getMyNotifications();
    await getMyNotificationsRealtimeChannel();
    await getMySummary();
    await getPublicEventBanner();
    await getFestivals();
    await getTourismPlaces({ district: '유성구', ktoContentTypeId: '12', ktoFacet: 'attraction', limit: 100 });
    await getReviewFeedPage({ cursor: 'cursor-2', limit: 5 });
    await getReviews({ placeId: 'place-1', userId: 'user-1' });
    await getReviewDetail('review-1');
    await getReviewComments('review-1');

    expect(calls.map(pathOf)).toEqual([
      '/api/admin/summary',
      '/api/community-routes?sort=latest',
      '/api/my/comments?cursor=cursor-1&limit=20',
      '/api/my/notifications',
      '/api/my/notifications/realtime-channel',
      '/api/my/summary',
      '/api/banner/events',
      '/api/festivals',
      '/api/tourism/places?district=%EC%9C%A0%EC%84%B1%EA%B5%AC&ktoContentTypeId=12&ktoFacet=attraction&limit=100',
      '/api/review-feed?cursor=cursor-2&limit=5',
      '/api/reviews?placeId=place-1&userId=user-1',
      '/api/reviews/review-1',
      '/api/reviews/review-1/comments',
    ]);
  });

  it('omits optional query parameters when list clients receive empty filters', async () => {
    const { calls } = stubFetch((url) => {
      const { pathname } = new URL(url);
      if (pathname === '/api/tourism/places') {
        return jsonResponse({
          sourceReady: true,
          sourceName: 'KTO',
          importedAt: null,
          facets: { contentTypes: [], ktoFacets: [], districts: [] },
          items: [],
        });
      }
      if (pathname === '/api/review-feed') return jsonResponse({ items: [], nextCursor: null });
      if (pathname === '/api/my/comments') return jsonResponse({ items: [], nextCursor: null });
      if (pathname === '/api/reviews') return jsonResponse([]);
      throw new Error(`Unhandled request: ${pathname}`);
    });

    await getTourismPlaces({ category: '', district: null, ktoContentTypeId: undefined, ktoFacet: '', limit: null });
    await getReviewFeedPage({ cursor: null });
    await getMyCommentsPage({ cursor: null });
    await getReviews();

    expect(calls.map(pathOf)).toEqual([
      '/api/tourism/places',
      '/api/review-feed',
      '/api/my/comments',
      '/api/reviews',
    ]);
  });

  it('invalidates cached read models after write operations', async () => {
    let reviewReads = 0;
    const { fetchSpy } = stubFetch((url, init) => {
      const { pathname } = new URL(url);
      const method = init?.method ?? 'GET';
      if (pathname === '/api/reviews' && method === 'GET') {
        reviewReads += 1;
        return jsonResponse([{ ...reviewFixture, id: `review-${reviewReads}` }]);
      }
      if (pathname === '/api/reviews' && method === 'POST') return jsonResponse(reviewFixture);
      throw new Error(`Unhandled request: ${method} ${pathname}`);
    });

    await expect(getReviews()).resolves.toMatchObject([{ id: 'review-1' }]);
    await expect(getReviews()).resolves.toMatchObject([{ id: 'review-1' }]);
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    await createReview({ placeId: 'place-1', stampId: 'stamp-1', body: 'body', mood: reviewMood });
    await expect(getReviews()).resolves.toMatchObject([{ id: 'review-2' }]);

    expect(fetchSpy).toHaveBeenCalledTimes(3);
  });
});
