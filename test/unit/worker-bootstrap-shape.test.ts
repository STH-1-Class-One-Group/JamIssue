import { describe, expect, it, vi } from 'vitest';

import { mapCourses, mapPlace } from '../../deploy/api-worker-shell/runtime/base-data';
import { createRouteRequest } from '../../deploy/api-worker-shell/runtime/routing';
import type {
  RouteRuntime,
  SupabaseCoursePlaceRow,
  SupabaseCourseRow,
  SupabaseMapRow,
  WorkerBaseData,
  WorkerEnv,
  WorkerStaticBaseRows,
} from '../../deploy/api-worker-shell/types';

const apiUrl = 'https://api.daejeon.jamissue.com';

const env: WorkerEnv = {
  APP_FRONTEND_URL: 'https://daejeon.jamissue.com',
};

const placeRow: SupabaseMapRow = {
  position_id: 101,
  slug: 'daejeon-place',
  name: 'Daejeon Place',
  district: 'Jung-gu',
  category: 'cafe',
  latitude: 36.35,
  longitude: 127.38,
  summary: 'summary',
  description: 'description',
  image_url: null,
  vibe_tags: ['cozy'],
  visit_time: '10:00',
  route_hint: 'walk',
  stamp_reward: 'stamp',
  hero_label: null,
  jam_color: null,
  accent_color: null,
};

const courseRow: SupabaseCourseRow = {
  course_id: 7,
  title: 'Course',
  mood: 'walk',
  duration: 'half-day',
  note: 'note',
  color: '#FFB3C6',
};

const coursePlaceRow: SupabaseCoursePlaceRow = {
  course_id: 7,
  position_id: 101,
  stop_order: 1,
};

const place = mapPlace(placeRow);

const baseData: WorkerBaseData = {
  places: [place],
  placesByPositionId: new Map([[place.positionId, place]]),
  reviews: [{ id: 'review-1', comments: [] }],
  courses: mapCourses([courseRow], [coursePlaceRow], new Map([[place.positionId, place]])),
  collectedPlaceIds: [place.id],
  stampLogs: [{ id: 'stamp-1', placeId: place.id }],
  travelSessions: [{ id: 'session-1', placeIds: [place.id] }],
};

const staticRows: WorkerStaticBaseRows = {
  placeRows: [placeRow],
  courseRows: [courseRow],
  coursePlaceRows: [coursePlaceRow],
};

function createRuntime(): RouteRuntime {
  const responseHandler = vi.fn(async () => new Response(null, { status: 204 }));

  return {
    adminService: {
      handleAdminImportPublicData: responseHandler,
      handleAdminPlaceVisibility: responseHandler,
      handleAdminSummary: responseHandler,
    },
    buildReviewInteractionDeps: vi.fn(),
    communityRouteService: {
      handleCommunityRoutes: responseHandler,
      handleCreateUserRoute: responseHandler,
      handleMyRoutes: responseHandler,
      handleToggleCommunityRouteLike: responseHandler,
      loadCommunityRoutes: vi.fn(async () => []),
    },
    loadBaseData: vi.fn(async () => baseData),
    loadStaticBaseRows: vi.fn(async () => staticRows),
    mapCourses,
    mapPlace,
    myService: {
      handleMyComments: responseHandler,
      handleMySummary: responseHandler,
    },
    reviewReadService: {
      handleReviewDetail: responseHandler,
      handleReviewFeed: responseHandler,
      handleReviews: responseHandler,
      loadSingleReview: vi.fn(async () => null),
      mapReviewRows: vi.fn(() => []),
    },
    stampService: {
      handleToggleStamp: responseHandler,
    },
  };
}

async function readJson(response: Response) {
  return (await response.json()) as Record<string, any>;
}

describe('worker bootstrap response shape', () => {
  it('keeps /api/bootstrap shape stable', async () => {
    const response = await createRouteRequest(createRuntime())(new Request(`${apiUrl}/api/bootstrap`), env);
    const payload = await readJson(response);

    expect(response.status).toBe(200);
    expect(payload.auth).toMatchObject({ isAuthenticated: false, user: null });
    expect(Array.isArray(payload.auth.providers)).toBe(true);
    expect(payload.places).toHaveLength(1);
    expect(payload.places[0]).not.toHaveProperty('positionId');
    expect(payload.places[0]).toMatchObject({ id: 'daejeon-place', name: 'Daejeon Place' });
    expect(payload.reviews).toEqual(baseData.reviews);
    expect(payload.courses).toEqual(baseData.courses);
    expect(payload.stamps).toEqual({
      collectedPlaceIds: baseData.collectedPlaceIds,
      logs: baseData.stampLogs,
      travelSessions: baseData.travelSessions,
    });
    expect(payload.hasRealData).toBe(true);
  });

  it('keeps /api/map-bootstrap shape stable', async () => {
    const response = await createRouteRequest(createRuntime())(new Request(`${apiUrl}/api/map-bootstrap`), env);
    const payload = await readJson(response);

    expect(response.status).toBe(200);
    expect(payload.places[0]).not.toHaveProperty('positionId');
    expect(payload.stamps).toEqual({
      collectedPlaceIds: baseData.collectedPlaceIds,
      logs: baseData.stampLogs,
      travelSessions: baseData.travelSessions,
    });
    expect(payload).not.toHaveProperty('reviews');
    expect(payload).not.toHaveProperty('courses');
    expect(payload.hasRealData).toBe(true);
  });

  it('keeps /api/courses/curated shape stable', async () => {
    const response = await createRouteRequest(createRuntime())(new Request(`${apiUrl}/api/courses/curated`), env);
    const payload = await readJson(response);

    expect(response.status).toBe(200);
    expect(payload).toEqual({ courses: baseData.courses });
  });
});
