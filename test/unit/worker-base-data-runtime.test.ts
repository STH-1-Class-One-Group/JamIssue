import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { WorkerEnv } from '../../deploy/api-worker-shell/types';

const env = {} as WorkerEnv;

const placeRow = {
  position_id: 101,
  slug: 'place-1',
  name: 'Place 1',
  district: 'District',
  category: 'cafe',
  latitude: 36.35,
  longitude: 127.38,
  summary: 'summary',
  description: 'description',
  image_url: null,
  vibe_tags: null,
  visit_time: '1h',
  route_hint: 'hint',
  stamp_reward: 'reward',
  hero_label: null,
  jam_color: null,
  accent_color: null,
};

const courseRow = {
  course_id: 7,
  title: 'Course',
  mood: 'walk',
  duration: 'half-day',
  note: 'note',
  color: '#fff',
};

const coursePlaceRow = {
  course_id: 7,
  position_id: 101,
  stop_order: 1,
};

function installSupabaseMock(responses: unknown[]) {
  const supabaseRequest = vi.fn(async () => responses.shift() ?? []);

  vi.doMock('../../deploy/api-worker-shell/lib/supabase', () => ({
    buildInFilter: (values: unknown[]) => {
      const filtered = values.filter((value) => value !== null && value !== undefined && value !== '');
      return filtered.length > 0 ? `in.(${filtered.map((value) => String(value)).join(',')})` : null;
    },
    encodeFilterValue: (value: unknown) => encodeURIComponent(String(value)),
    rememberPending: async <T>(state: { pending: Promise<T> | null }, factory: () => Promise<T>) => {
      if (state.pending) {
        return state.pending;
      }
      state.pending = factory();
      return state.pending;
    },
    supabaseRequest,
  }));

  return supabaseRequest;
}

describe('worker base data repository', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it('loads static map and course rows once while the cache is valid', async () => {
    const supabaseRequest = installSupabaseMock([[placeRow], [courseRow], [coursePlaceRow]]);
    const { loadStaticBaseRows } = await import('../../deploy/api-worker-shell/runtime/base-data-repository');

    const first = await loadStaticBaseRows(env);
    const second = await loadStaticBaseRows(env);

    expect(first).toEqual({ placeRows: [placeRow], courseRows: [courseRow], coursePlaceRows: [coursePlaceRow] });
    expect(second).toBe(first);
    expect(supabaseRequest).toHaveBeenCalledTimes(3);
    expect(supabaseRequest.mock.calls.map(([, query]) => query)).toEqual([
      expect.stringContaining('map?select=position_id'),
      expect.stringContaining('course?select=course_id'),
      expect.stringContaining('course_place?select=course_id'),
    ]);
  });

  it('loads session-scoped review, stamp, route, and user rows without exposing query details to callers', async () => {
    const feedRow = {
      feed_id: 7,
      position_id: 101,
      user_id: 'user-1',
      stamp_id: 11,
      body: 'body',
      mood: 'mood',
      badge: 'badge',
      image_url: null,
      created_at: '2026-05-14T00:00:00Z',
    };
    const stampRow = {
      stamp_id: 11,
      user_id: 'user-1',
      position_id: 101,
      travel_session_id: 55,
      stamp_date: '2026-05-14',
      visit_ordinal: 1,
      created_at: '2026-05-14T00:00:00Z',
    };
    const responses = [
      [placeRow],
      [courseRow],
      [coursePlaceRow],
      [feedRow],
      [],
      [],
      [stampRow],
      [{ feed_id: 7 }],
      [{ travel_session_id: 55, user_id: 'user-1', started_at: '2026-05-14T00:00:00Z', ended_at: null, last_stamp_at: '2026-05-14T00:00:00Z', stamp_count: 1, created_at: '2026-05-14T00:00:00Z' }],
      [{ route_id: 99, travel_session_id: 55 }],
      [{ ...stampRow, stamp_id: 12 }],
      [{ position_id: 101 }],
      [{ route_id: 100, travel_session_id: 55 }],
      [{ user_id: 'user-1', nickname: 'Author' }],
    ];
    const supabaseRequest = installSupabaseMock(responses);
    const { loadBaseDataRows } = await import('../../deploy/api-worker-shell/runtime/base-data-repository');

    const rows = await loadBaseDataRows(env, 'user-1');

    expect(rows.staticRows.placeRows).toEqual([placeRow]);
    expect(rows.feedRows).toEqual([feedRow]);
    expect(rows.reviewStampRows).toEqual([stampRow]);
    expect(rows.userFeedLikeRows).toEqual([{ feed_id: 7 }]);
    expect(rows.reviewRouteRows).toEqual([{ route_id: 100, travel_session_id: 55 }]);
    expect(rows.userRows).toEqual([{ user_id: 'user-1', nickname: 'Author' }]);
    expect(supabaseRequest.mock.calls.map(([, query]) => String(query))).toEqual(
      expect.arrayContaining([
        expect.stringContaining('feed?select=feed_id'),
        expect.stringContaining('user_id=eq.user-1'),
        expect.stringContaining('travel_session?select=travel_session_id'),
        expect.stringContaining('user_route?select=route_id,travel_session_id'),
        expect.stringContaining('user?select=user_id,nickname'),
      ]),
    );
  });
});

describe('worker base data assembler', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it('loads curated courses through the repository and maps stops with stable place IDs', async () => {
    vi.doMock('../../deploy/api-worker-shell/runtime/base-data-repository', () => ({
      loadStaticBaseRows: vi.fn(async () => ({
        placeRows: [placeRow],
        courseRows: [courseRow],
        coursePlaceRows: [coursePlaceRow],
      })),
      loadBaseDataRows: vi.fn(),
    }));
    const { loadCuratedCourses } = await import('../../deploy/api-worker-shell/runtime/base-data-assembler');

    const courses = await loadCuratedCourses(env);

    expect(courses).toEqual([
      expect.objectContaining({
        id: '7',
        placeIds: ['place-1'],
      }),
    ]);
  });

  it('assembles review rows, collected places, stamp logs, and travel sessions for bootstrap payloads', async () => {
    const review = { id: '7', placeId: 'place-1' };
    const reviewReadService = {
      mapReviewRows: vi.fn(() => [review]),
    };
    vi.doMock('../../deploy/api-worker-shell/runtime/base-data-repository', () => ({
      loadStaticBaseRows: vi.fn(),
      loadBaseDataRows: vi.fn(async () => ({
        staticRows: {
          placeRows: [placeRow],
          courseRows: [courseRow],
          coursePlaceRows: [coursePlaceRow],
        },
        feedRows: [{ feed_id: 7, position_id: 101, user_id: 'user-1', stamp_id: 11, body: 'body', mood: 'mood', badge: 'badge', image_url: null, created_at: '2026-05-14T00:00:00Z' }],
        commentRows: [],
        likeRows: [{ feed_id: 7 }],
        reviewStampRows: [{ stamp_id: 11, user_id: 'user-1', position_id: 101, travel_session_id: 55, stamp_date: '2026-05-14', visit_ordinal: 1, created_at: '2026-05-14T00:00:00Z' }],
        userFeedLikeRows: [{ feed_id: 7 }],
        userSessionRows: [{ travel_session_id: 55, user_id: 'user-1', started_at: '2026-05-14T00:00:00Z', ended_at: null, last_stamp_at: '2026-05-14T00:00:00Z', stamp_count: 1, created_at: '2026-05-14T00:00:00Z' }],
        ownerRouteRows: [{ route_id: 99, travel_session_id: 55 }],
        userStampRows: [
          { stamp_id: 11, user_id: 'user-1', position_id: 101, travel_session_id: 55, stamp_date: '2026-05-14', visit_ordinal: 1, created_at: '2026-05-14T00:00:00Z' },
          { stamp_id: 12, user_id: 'user-1', position_id: 101, travel_session_id: 55, stamp_date: '2026-05-14', visit_ordinal: 2, created_at: '2026-05-14T01:00:00Z' },
        ],
        allPlaceStampRows: [{ position_id: 101 }, { position_id: 101 }],
        reviewRouteRows: [{ route_id: 100, travel_session_id: 55 }],
        userRows: [{ user_id: 'user-1', nickname: 'Author' }],
      })),
    }));
    const { createLoadBaseData } = await import('../../deploy/api-worker-shell/runtime/base-data-assembler');

    const loadBaseData = createLoadBaseData(reviewReadService);
    const data = await loadBaseData(env, 'user-1');

    expect(data.places[0]).toMatchObject({ id: 'place-1', totalVisitCount: 2 });
    expect(data.reviews).toEqual([review]);
    expect(data.courses[0]).toMatchObject({ id: '7', placeIds: ['place-1'] });
    expect(data.collectedPlaceIds).toEqual(['place-1']);
    expect(data.stampLogs).toHaveLength(2);
    expect(data.travelSessions[0]).toMatchObject({ id: '55', publishedRouteId: '99' });
    expect(reviewReadService.mapReviewRows).toHaveBeenCalledWith(
      expect.any(Array),
      [],
      [{ feed_id: 7 }],
      expect.any(Map),
      expect.any(Map),
      expect.any(Map),
      [{ route_id: 100, travel_session_id: 55 }],
      expect.any(Set),
    );
  });
});
