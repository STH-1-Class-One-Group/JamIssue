import { describe, expect, it } from 'vitest';
import { createReviewMapper } from '../../deploy/api-worker-shell/services/review-domain/mapper';
import { mapCommunityRoutes } from '../../deploy/api-worker-shell/services/community-domain/mapper';
import { mapMyComments } from '../../deploy/api-worker-shell/services/my-domain/mapper';
import { mapTourismPlace } from '../../deploy/api-worker-shell/services/tourism-domain/mapper';
import {
  buildPlaceVisitCountMap,
  buildStampLogs,
  buildTravelSessions,
  mapCourses,
  mapPlace,
  normalizePlaceCategory,
} from '../../deploy/api-worker-shell/runtime/base-data-mappers';
import type { WorkerPlace } from '../../deploy/api-worker-shell/runtime/base-data-contracts';

function workerPlace(overrides: Partial<WorkerPlace> = {}): WorkerPlace {
  return {
    id: 'place-1',
    positionId: '101',
    name: 'Place 1',
    district: 'District',
    category: 'cafe',
    jamColor: '#f4a',
    accentColor: '#333',
    imageUrl: null,
    latitude: 36.35,
    longitude: 127.38,
    summary: 'summary',
    description: 'description',
    vibeTags: [],
    visitTime: '1h',
    routeHint: 'hint',
    stampReward: 'reward',
    heroLabel: 'hero',
    totalVisitCount: 0,
    ...overrides,
  };
}

describe('worker review mapper', () => {
  const mapper = createReviewMapper((visitNumber) => `visit-${String(visitNumber)}`);

  it('builds comment trees, promotes live descendants, and collapses deleted leaves', () => {
    const usersById = new Map([
      ['user-1', { user_id: 'user-1', nickname: 'Author' }],
      ['user-2', { user_id: 'user-2', nickname: 'Reply' }],
    ]);

    const tree = mapper.buildCommentTree(
      [
        { comment_id: 1, feed_id: 7, user_id: 'user-1', parent_id: null, body: 'root', is_deleted: false, created_at: '2026-05-14T00:00:00Z' },
        { comment_id: 2, feed_id: 7, user_id: 'user-2', parent_id: 1, body: '[deleted]', is_deleted: true, created_at: '2026-05-14T00:01:00Z' },
        { comment_id: 3, feed_id: 7, user_id: 'user-2', parent_id: 2, body: 'live reply', is_deleted: false, created_at: '2026-05-14T00:02:00Z' },
        { comment_id: 4, feed_id: 7, user_id: 'user-2', parent_id: 1, body: '[deleted]', is_deleted: true, created_at: '2026-05-14T00:03:00Z' },
      ],
      usersById,
    );

    expect(tree).toHaveLength(1);
    expect(tree[0]).toMatchObject({ id: '1', author: 'Author', body: 'root' });
    expect(tree[0].replies).toHaveLength(1);
    expect(tree[0].replies[0]).toMatchObject({ id: '3', isDeleted: false, body: 'live reply' });
    expect(mapper.countComments(tree)).toBe(2);
  });

  it('maps feed rows with place fallback, like counts, stamp visits, and published route flags', () => {
    const place = workerPlace();
    const reviews = mapper.mapReviewRows(
      [
        { feed_id: 7, position_id: 101, user_id: 'user-1', stamp_id: 11, body: 'body', mood: 'mood', badge: 'badge', image_url: null, created_at: '2026-05-14T00:00:00Z' },
      ],
      [
        { comment_id: 1, feed_id: 7, user_id: 'user-2', parent_id: null, body: 'comment', is_deleted: false, created_at: '2026-05-14T00:01:00Z' },
      ],
      [{ feed_id: 7 }, { feed_id: 7 }],
      new Map([
        ['user-1', { user_id: 'user-1', nickname: 'Author' }],
        ['user-2', { user_id: 'user-2', nickname: 'Reply' }],
      ]),
      new Map([[place.positionId, place]]),
      new Map([
        ['11', { stamp_id: 11, user_id: 'user-1', position_id: 101, travel_session_id: 55, stamp_date: '2026-05-14', visit_ordinal: 2, created_at: '2026-05-14T00:00:00Z' }],
      ]),
      [{ route_id: 99, travel_session_id: 55 }],
      new Set(['7']),
    );

    expect(reviews).toEqual([
      expect.objectContaining({
        id: '7',
        userId: 'user-1',
        placeId: 'place-1',
        author: 'Author',
        commentCount: 1,
        likeCount: 2,
        likedByMe: true,
        stampId: '11',
        visitNumber: 2,
        visitLabel: 'visit-2',
        travelSessionId: '55',
        hasPublishedRoute: true,
      }),
    ]);
  });

  it('maps reviews with missing lookup data, deleted comments, and default visit metadata', () => {
    const reviews = mapper.mapReviewRows(
      [
        {
          feed_id: 8,
          position_id: 999,
          user_id: 'missing-user',
          stamp_id: null,
          body: null,
          mood: 'mood',
          badge: null,
          image_url: 'https://image.test/review.jpg',
          created_at: '2026-05-14T00:00:00Z',
        },
      ],
      [
        {
          comment_id: 10,
          feed_id: 8,
          user_id: 'missing-commenter',
          parent_id: 999,
          body: 'deleted',
          is_deleted: true,
          created_at: '2026-05-14T00:01:00Z',
        },
      ],
      [],
      new Map(),
      new Map(),
      new Map(),
    );

    expect(reviews).toEqual([
      expect.objectContaining({
        id: '8',
        placeId: '999',
        author: expect.any(String),
        placeName: expect.any(String),
        body: null,
        imageUrl: 'https://image.test/review.jpg',
        commentCount: 0,
        likeCount: 0,
        likedByMe: false,
        stampId: null,
        visitNumber: 1,
        visitLabel: 'visit-1',
        travelSessionId: null,
        hasPublishedRoute: false,
        comments: [],
      }),
    ]);
  });
});

describe('worker community and my page mappers', () => {
  it('maps community routes in stop order and resolves place names through the local place map', () => {
    const placesByPositionId = new Map([
      ['101', workerPlace({ id: 'place-1', name: 'Place 1' })],
      ['102', workerPlace({ id: 'place-2', positionId: '102', name: 'Place 2' })],
    ]);

    const routes = mapCommunityRoutes(
      [{ route_id: 7, user_id: 'user-1', title: 'Route', description: 'Description', mood: 'mood', like_count: 3, is_user_generated: true, travel_session_id: 55, created_at: '2026-05-14T00:00:00Z' }],
      [
        { route_id: 7, position_id: 102, stop_order: 2 },
        { route_id: 7, position_id: 101, stop_order: 1 },
      ],
      new Map([['user-1', { user_id: 'user-1', nickname: 'Author' }]]),
      placesByPositionId,
      new Set(['7']),
    );

    expect(routes).toEqual([
      expect.objectContaining({
        id: '7',
        author: 'Author',
        likeCount: 3,
        likedByMe: true,
        placeIds: ['place-1', 'place-2'],
        placeNames: ['Place 1', 'Place 2'],
        travelSessionId: '55',
      }),
    ]);
  });

  it('maps community routes with anonymous authors, fallback place ids, and default flags', () => {
    const routes = mapCommunityRoutes(
      [{ route_id: 8, user_id: 'missing-user', title: 'Fallback Route', description: 'Description', mood: 'mood', like_count: null, is_user_generated: null, travel_session_id: null, created_at: '2026-05-14T00:00:00Z' }],
      [{ route_id: 8, position_id: 999, stop_order: 1 }],
      new Map(),
      new Map(),
    );

    expect(routes).toEqual([
      expect.objectContaining({
        id: '8',
        author: expect.any(String),
        likeCount: 0,
        likedByMe: false,
        placeIds: ['999'],
        placeNames: ['999'],
        isUserGenerated: false,
        travelSessionId: null,
      }),
    ]);
  });

  it('maps my comments from arrays or maps and skips deleted comments', () => {
    const comments = mapMyComments(
      [
        { comment_id: 1, feed_id: 7, parent_id: null, body: 'comment', is_deleted: false, created_at: '2026-05-14T00:00:00Z' },
        { comment_id: 2, feed_id: 7, parent_id: null, body: '[deleted]', is_deleted: true, created_at: '2026-05-14T00:01:00Z' },
      ],
      [{ feed_id: 7, position_id: 101, body: 'review body' }],
      new Map([['101', workerPlace()]]),
    );

    expect(comments).toEqual([
      expect.objectContaining({
        id: '1',
        reviewId: '7',
        placeId: 'place-1',
        placeName: 'Place 1',
        body: 'comment',
        reviewBody: 'review body',
      }),
    ]);

    const mappedFromMap = mapMyComments(
      [{ comment_id: 3, feed_id: 9, parent_id: 1, body: 'mapped', is_deleted: false, created_at: '2026-05-14T00:02:00Z' }],
      new Map([['9', { id: '9', placeId: 'manual-place', placeName: 'Manual Place', body: 'manual body' }]]),
      new Map(),
    );
    expect(mappedFromMap[0]).toMatchObject({ placeId: 'manual-place', placeName: 'Manual Place', parentId: '1' });

    const missingFeedComments = mapMyComments(
      [
        { comment_id: 4, feed_id: 404, parent_id: null, body: 'missing feed', is_deleted: false, created_at: '2026-05-14T00:03:00Z' },
        { comment_id: 5, feed_id: 405, parent_id: null, body: null, is_deleted: false, created_at: '2026-05-14T00:04:00Z' },
        { comment_id: 6, feed_id: 406, parent_id: null, body: 'deleted text', is_deleted: true, created_at: '2026-05-14T00:05:00Z' },
      ],
      [],
      new Map(),
    );
    expect(missingFeedComments).toEqual([
      expect.objectContaining({ id: '4', placeId: '', placeName: expect.any(String), reviewBody: '' }),
      expect.objectContaining({ id: '5', body: null, placeId: '', reviewBody: '' }),
    ]);
  });
});

describe('worker tourism mapper', () => {
  it('maps nullable tourism rows and rejects invalid curated links without leaking raw data', () => {
    const invalidCurated = mapTourismPlace({
      external_id: 123,
      display_name: 'Tourism Place',
      category: 'tourism',
      district: 'District',
      content_type_id: null,
      content_type_label: null,
      cat1: null,
      cat1_label: null,
      cat2: null,
      cat2_label: null,
      cat3: null,
      cat3_label: null,
      kto_facet: null,
      address: null,
      road_address: null,
      summary: null,
      image_url: null,
      source_page_url: null,
      latitude: 'not-a-number',
      longitude: undefined,
      source_updated_at: null,
      kto_place_map_link: [
        null,
        { map: null },
        { map: { position_id: null, slug: 'missing-id', name: 'Missing Id' } },
        { map: { position_id: 'bad-id', slug: 'bad-id', name: 'Bad Id' } },
      ],
    });

    expect(invalidCurated).toEqual({
      id: '123',
      name: 'Tourism Place',
      category: 'tourism',
      ktoContentTypeId: null,
      ktoContentTypeLabel: null,
      ktoCategoryCode1: null,
      ktoCategoryLabel1: null,
      ktoCategoryCode2: null,
      ktoCategoryLabel2: null,
      ktoCategoryCode3: null,
      ktoCategoryLabel3: null,
      ktoFacet: null,
      district: 'District',
      address: null,
      roadAddress: null,
      summary: '',
      imageUrl: null,
      sourcePageUrl: null,
      latitude: null,
      longitude: null,
      sourceUpdatedAt: null,
      isCurated: false,
      curatedPlace: null,
    });

    const validCurated = mapTourismPlace({
      external_id: 'kto-2',
      display_name: 'Curated',
      category: 'food',
      district: 'District',
      content_type_id: '39',
      content_type_label: 'Food',
      cat1: 'A05',
      cat1_label: 'Food Root',
      cat2: 'A0502',
      cat2_label: 'Restaurant',
      cat3: 'A05020100',
      cat3_label: 'Local',
      kto_facet: 'restaurant',
      address: 'Address',
      road_address: 'Road',
      summary: 'Summary',
      image_url: 'https://image.test/kto.jpg',
      source_page_url: 'https://kto.example.test',
      latitude: 36.35,
      longitude: '127.38',
      source_updated_at: '2026-06-01T00:00:00Z',
      kto_place_map_link: [{ map: { position_id: '101', slug: 'place-1', name: 'Place 1' } }],
    });
    expect(validCurated).toMatchObject({
      id: 'kto-2',
      isCurated: true,
      latitude: 36.35,
      longitude: 127.38,
      curatedPlace: { positionId: 101, slug: 'place-1', name: 'Place 1' },
    });
  });
});

describe('worker base-data mappers', () => {
  it('normalizes map rows, categories, courses, and place visit counts', () => {
    const place = mapPlace({
      position_id: 101,
      slug: 'science-museum',
      name: 'Science Museum',
      district: 'District',
      category: 'landmark',
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
      total_visit_count: 2,
    });

    expect(normalizePlaceCategory('food')).toBe('restaurant');
    expect(normalizePlaceCategory('landmark', 'science-museum')).toBe('culture');
    expect(place).toMatchObject({ id: 'science-museum', category: 'culture', totalVisitCount: 2, vibeTags: [] });
    expect(buildPlaceVisitCountMap([{ position_id: 101 }, { position_id: 101 }, { position_id: 102 }])).toEqual(new Map([['101', 2], ['102', 1]]));
    expect(mapCourses(
      [{ course_id: 7, title: 'Course', mood: 'mood', duration: 'half-day', note: 'note', color: '#fff' }],
      [
        { course_id: 7, position_id: 102, stop_order: 2 },
        { course_id: 7, position_id: 101, stop_order: 1 },
      ],
      new Map([
        ['101', workerPlace({ id: 'place-1' })],
        ['102', workerPlace({ id: 'place-2', positionId: '102' })],
      ]),
    )[0].placeIds).toEqual(['place-1', 'place-2']);
  });

  it('maps base-data fallback palettes, visit labels, and empty course stops without changing response shape', () => {
    expect(normalizePlaceCategory('restaurant')).toBe('restaurant');
    expect(normalizePlaceCategory('cafe')).toBe('cafe');
    expect(normalizePlaceCategory('culture')).toBe('culture');
    expect(normalizePlaceCategory('attraction')).toBe('attraction');
    expect(normalizePlaceCategory('night')).toBe('attraction');
    expect(normalizePlaceCategory('landmark', 'city-observatory')).toBe('culture');
    expect(normalizePlaceCategory('landmark', 'bridge')).toBe('attraction');
    expect(normalizePlaceCategory('unknown')).toBe('attraction');

    const fallbackPlace = mapPlace({
      position_id: 202,
      slug: 'fallback-place',
      name: 'Fallback Place',
      district: 'District',
      category: 'unknown',
      latitude: 36.36,
      longitude: 127.39,
      summary: 'summary',
      description: 'description',
      image_url: 'https://image.test/place.png',
      vibe_tags: ['tag'],
      visit_time: '1h',
      route_hint: 'hint',
      stamp_reward: 'reward',
      hero_label: 'hero',
      jam_color: '#111',
      accent_color: '#222',
      total_visit_count: null,
    });
    expect(fallbackPlace).toMatchObject({
      id: 'fallback-place',
      category: 'attraction',
      heroLabel: 'City Spot',
      imageUrl: 'https://image.test/place.png',
      totalVisitCount: 0,
      vibeTags: ['tag'],
    });

    expect(mapCourses([{ course_id: 8, title: 'Empty', mood: 'mood', duration: 'short', note: 'note', color: '#000' }], [], new Map()))
      .toEqual([expect.objectContaining({ id: '8', placeIds: [] })]);

    expect(mapPlace({
      position_id: 203,
      slug: 'restaurant-place',
      name: 'Restaurant Place',
      district: 'District',
      category: 'restaurant',
      latitude: 36.36,
      longitude: 127.39,
      summary: 'summary',
      description: 'description',
      image_url: null,
      vibe_tags: [],
      visit_time: '1h',
      route_hint: 'hint',
      stamp_reward: 'reward',
      hero_label: null,
      jam_color: null,
      accent_color: null,
      total_visit_count: null,
    })).toMatchObject({ category: 'restaurant', heroLabel: 'Bakery Bite' });

    expect(mapPlace({
      position_id: 204,
      slug: 'cafe-place',
      name: 'Cafe Place',
      district: 'District',
      category: 'cafe',
      latitude: 36.36,
      longitude: 127.39,
      summary: 'summary',
      description: 'description',
      image_url: null,
      vibe_tags: [],
      visit_time: '1h',
      route_hint: 'hint',
      stamp_reward: 'reward',
      hero_label: null,
      jam_color: null,
      accent_color: null,
      total_visit_count: null,
    })).toMatchObject({ category: 'cafe', heroLabel: 'Cafe Mood' });
  });

  it('builds stamp logs and travel sessions with unique ordered places and route publication metadata', () => {
    const placesByPositionId = new Map([
      ['101', workerPlace({ id: 'place-1', name: 'Place 1' })],
      ['102', workerPlace({ id: 'place-2', positionId: '102', name: 'Place 2' })],
    ]);
    const stampRows = [
      { stamp_id: 2, user_id: 'user-1', position_id: 102, travel_session_id: 55, stamp_date: '2026-05-14', visit_ordinal: 2, created_at: '2026-05-14T02:00:00Z' },
      { stamp_id: 1, user_id: 'user-1', position_id: 101, travel_session_id: 55, stamp_date: '2026-05-14', visit_ordinal: 1, created_at: '2026-05-14T01:00:00Z' },
    ];

    const logs = buildStampLogs(stampRows, placesByPositionId);
    expect(logs[0]).toMatchObject({ id: '2', placeId: 'place-2', visitNumber: 2, travelSessionId: '55', travelSessionStampCount: 2 });

    const sessions = buildTravelSessions(
      [{ travel_session_id: 55, user_id: 'user-1', started_at: '2026-05-14T01:00:00Z', ended_at: '2026-05-15T01:00:00Z', last_stamp_at: '2026-05-14T02:00:00Z', stamp_count: 2, created_at: '2026-05-14T01:00:00Z' }],
      [...stampRows, { ...stampRows[1], stamp_id: 3 }],
      placesByPositionId,
      [{ route_id: 99, travel_session_id: 55 }],
    );

    expect(sessions).toEqual([
      expect.objectContaining({
        id: '55',
        stampCount: 2,
        placeIds: ['place-1', 'place-2'],
        placeNames: ['Place 1', 'Place 2'],
        canPublish: true,
        publishedRouteId: '99',
        coverPlaceId: 'place-1',
      }),
    ]);
  });

  it('builds stamp logs and travel sessions with missing place and same-day fallback labels', () => {
    const logs = buildStampLogs(
      [{ stamp_id: 9, user_id: 'user-1', position_id: 999, travel_session_id: null, stamp_date: '1900-01-01', visit_ordinal: null, created_at: '2026-05-14T02:00:00Z' }],
      new Map(),
    );

    expect(logs[0]).toMatchObject({
      id: '9',
      placeId: '999',
      travelSessionId: null,
      travelSessionStampCount: 0,
      visitNumber: 1,
    });

    const sessions = buildTravelSessions(
      [{ travel_session_id: 77, user_id: 'user-1', started_at: '2026-05-14T01:00:00Z', ended_at: '2026-05-14T01:30:00Z', last_stamp_at: '2026-05-14T01:30:00Z', stamp_count: null, created_at: '2026-05-14T01:00:00Z' }],
      [
        { stamp_id: 10, user_id: 'user-1', position_id: 999, travel_session_id: 77, stamp_date: '2026-05-14', visit_ordinal: null, created_at: '2026-05-14T01:00:00Z' },
        { stamp_id: 11, user_id: 'user-1', position_id: 101, travel_session_id: null, stamp_date: '2026-05-14', visit_ordinal: null, created_at: '2026-05-14T02:00:00Z' },
      ],
      new Map(),
      [{ route_id: 100, travel_session_id: null }],
    );

    expect(sessions[0]).toMatchObject({
      id: '77',
      stampCount: 1,
      placeIds: ['999'],
      placeNames: ['999'],
      canPublish: false,
      publishedRouteId: null,
      coverPlaceId: '999',
    });
  });
});
