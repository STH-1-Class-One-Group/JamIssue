import type { Page, Route } from '@playwright/test';
import type { SessionUser } from '../../src/types/auth';
import type { TourismPlaceDetailResponse, TourismPlaceItem, TourismPlacesResponse } from '../../src/tourismTypes';
import type { CommunityRouteSort, Course, Place } from '../../src/types/core';
import type { Comment, Review, StampLog, StampState, TravelSession, UserRoute } from '../../src/types/review';
import type { MyComment, MyPageResponse, UserNotification } from '../../src/types/my-page';

export const e2eUser: SessionUser = {
  id: 'user-1',
  nickname: '테스터',
  email: 'tester@example.com',
  provider: 'kakao',
  linkedProviders: ['kakao'],
  profileImage: null,
  isAdmin: false,
  profileCompletedAt: '2026-05-14T10:00:00.000Z',
};

export const e2ePlace: Place = {
  id: 'place-1',
  positionId: 'position-1',
  name: '테스트 카페',
  district: '중구',
  category: 'cafe',
  jamColor: '#ff7fab',
  accentColor: '#7cb9d1',
  imageUrl: null,
  latitude: 36.3504,
  longitude: 127.3845,
  summary: '모바일 E2E에서 사용하는 테스트 장소입니다.',
  description: '지도와 피드 흐름을 검증하기 위한 장소입니다.',
  vibeTags: ['조용한', '산책'],
  visitTime: '오후',
  routeHint: '중앙로역에서 걸어서 이동할 수 있어요.',
  stampReward: '카페 스탬프',
  heroLabel: 'PLACE',
  totalVisitCount: 2,
};

export const e2eSecondPlace: Place = {
  ...e2ePlace,
  id: 'place-2',
  positionId: 'position-2',
  name: '테스트 공원',
  category: 'attraction',
  latitude: 36.351,
  longitude: 127.386,
  stampReward: '명소 스탬프',
};

const todayStamp: StampLog = {
  id: 'stamp-1',
  placeId: e2ePlace.id,
  placeName: e2ePlace.name,
  stampedAt: '05. 14. 14:00',
  stampedDate: '2026-05-14',
  visitNumber: 1,
  visitLabel: '첫 방문',
  travelSessionId: 'session-1',
  travelSessionStampCount: 1,
  isToday: true,
};

const travelSession: TravelSession = {
  id: 'session-1',
  startedAt: '2026-05-14T13:00:00.000Z',
  endedAt: '2026-05-14T15:00:00.000Z',
  durationLabel: '5월 14일 하루 코스',
  stampCount: 1,
  placeIds: [e2ePlace.id],
  placeNames: [e2ePlace.name],
  canPublish: true,
  publishedRouteId: null,
  coverPlaceId: e2ePlace.id,
};

export const e2eReview: Review = {
  id: 'review-1',
  userId: 'user-2',
  placeId: e2ePlace.id,
  placeName: e2ePlace.name,
  author: '방문자',
  body: '기본 피드 본문입니다.',
  mood: '친구랑',
  badge: '카페 추천',
  visitedAt: '05. 14. 13:40',
  imageUrl: null,
  thumbnailUrl: null,
  commentCount: 0,
  likeCount: 2,
  likedByMe: false,
  stampId: 'stamp-other',
  visitNumber: 1,
  visitLabel: '첫 방문',
  travelSessionId: 'session-other',
  hasPublishedRoute: false,
  comments: [],
};

const popularRoute: UserRoute = {
  id: 'route-popular',
  authorId: e2eUser.id,
  author: e2eUser.nickname,
  title: '좋아요 많은 산책 코스',
  description: '카페와 공원을 함께 보는 코스입니다.',
  mood: '산책',
  likeCount: 9,
  likedByMe: false,
  createdAt: '05. 14. 15:00',
  placeIds: [e2ePlace.id, e2eSecondPlace.id],
  placeNames: [e2ePlace.name, e2eSecondPlace.name],
  isUserGenerated: true,
  travelSessionId: travelSession.id,
};

const latestRoute: UserRoute = {
  ...popularRoute,
  id: 'route-latest',
  title: '최신 등록 산책 코스',
  likeCount: 1,
  createdAt: '05. 14. 16:00',
};

const curatedCourse: Course = {
  id: 'course-1',
  title: '대전 하루 산책',
  mood: '데이트',
  duration: '반나절',
  note: '가볍게 둘러보기 좋은 코스',
  color: '#ff7fab',
  placeIds: [e2ePlace.id, e2eSecondPlace.id],
};

interface E2EStateOptions {
  authenticated?: boolean;
  reviews?: Review[];
  tourismPlaces?: TourismPlaceItem[];
}

interface E2EAppState {
  user: SessionUser | null;
  places: Place[];
  courses: Course[];
  stampState: StampState;
  reviews: Review[];
  commentsByReviewId: Record<string, Comment[]>;
  communityRoutesBySort: Record<CommunityRouteSort, UserRoute[]>;
  notifications: UserNotification[];
  tourismPlaces: TourismPlaceItem[];
}

function cloneReview(review: Review): Review {
  return {
    ...review,
    comments: review.comments.map((comment) => ({ ...comment, replies: comment.replies.map((reply) => ({ ...reply })) })),
  };
}

export function createE2EAppState({ authenticated = true, reviews = [], tourismPlaces = [] }: E2EStateOptions = {}): E2EAppState {
  const clonedReviews = reviews.map(cloneReview);
  return {
    user: authenticated ? e2eUser : null,
    places: [e2ePlace, e2eSecondPlace],
    courses: [curatedCourse],
    stampState: authenticated
      ? { collectedPlaceIds: [e2ePlace.id], logs: [todayStamp], travelSessions: [travelSession] }
      : { collectedPlaceIds: [], logs: [], travelSessions: [] },
    reviews: clonedReviews,
    commentsByReviewId: Object.fromEntries(clonedReviews.map((review) => [review.id, review.comments])),
    communityRoutesBySort: {
      popular: [popularRoute],
      latest: [latestRoute],
    },
    notifications: [],
    tourismPlaces,
  };
}

function authPayload(state: E2EAppState) {
  return {
    isAuthenticated: Boolean(state.user),
    user: state.user,
    providers: [
      { key: 'naver', label: 'Naver', isEnabled: false, loginUrl: null, linkUrl: null },
      { key: 'kakao', label: 'Kakao', isEnabled: false, loginUrl: null, linkUrl: null },
    ],
  };
}

function buildMyPage(state: E2EAppState): MyPageResponse {
  const comments: MyComment[] = Object.entries(state.commentsByReviewId).flatMap(([reviewId, commentsForReview]) => {
    const review = state.reviews.find((candidate) => candidate.id === reviewId);
    return commentsForReview.map((comment) => ({
      id: `my-${comment.id}`,
      reviewId,
      placeId: review?.placeId ?? e2ePlace.id,
      placeName: review?.placeName ?? e2ePlace.name,
      body: comment.body,
      isDeleted: comment.isDeleted,
      parentId: comment.parentId,
      createdAt: comment.createdAt,
      reviewBody: review?.body ?? '',
    }));
  });

  return {
    user: state.user ?? e2eUser,
    stats: {
      reviewCount: state.reviews.length,
      stampCount: state.stampState.logs.length,
      uniquePlaceCount: state.stampState.collectedPlaceIds.length,
      totalPlaceCount: state.places.length,
      routeCount: state.communityRoutesBySort.popular.length,
    },
    reviews: state.reviews,
    comments,
    notifications: state.notifications,
    unreadNotificationCount: state.notifications.filter((notification) => !notification.isRead).length,
    stampLogs: state.stampState.logs,
    travelSessions: state.stampState.travelSessions,
    visitedPlaces: state.places.filter((place) => state.stampState.collectedPlaceIds.includes(place.id)),
    unvisitedPlaces: state.places.filter((place) => !state.stampState.collectedPlaceIds.includes(place.id)),
    collectedPlaces: state.places.filter((place) => state.stampState.collectedPlaceIds.includes(place.id)),
    routes: state.communityRoutesBySort.popular,
  };
}

async function fulfillJson(route: Route, json: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: 'application/json; charset=utf-8',
    body: JSON.stringify(json),
  });
}

function updateReview(state: E2EAppState, reviewId: string, updater: (review: Review) => Review) {
  state.reviews = state.reviews.map((review) => (review.id === reviewId ? updater(review) : review));
}

interface E2EFixtureOptions {
  tourismPlacesDelayMs?: number;
  tourismPlacesSourceReady?: boolean;
  tourismPlacesStatus?: number;
}

async function handleApiRoute(route: Route, state: E2EAppState, options: E2EFixtureOptions = {}) {
  const request = route.request();
  const url = new URL(request.url());
  const method = request.method();
  const path = url.pathname;

  if (method === 'GET' && path === '/api/map-bootstrap') {
    await fulfillJson(route, {
      auth: authPayload(state),
      places: state.places,
      stamps: state.stampState,
      hasRealData: true,
    });
    return;
  }

  if (method === 'GET' && path === '/api/courses/curated') {
    await fulfillJson(route, { courses: state.courses });
    return;
  }

  if (method === 'GET' && path === '/api/banner/events') {
    await fulfillJson(route, { sourceReady: false, sourceName: null, importedAt: null, items: [] });
    return;
  }

  if (method === 'GET' && path === '/api/festivals') {
    await fulfillJson(route, []);
    return;
  }

  if (method === 'GET' && path === '/api/tourism/places') {
    if (options.tourismPlacesDelayMs) {
      await new Promise((resolve) => {
        setTimeout(resolve, options.tourismPlacesDelayMs);
      });
    }
    if (options.tourismPlacesStatus === 503) {
      await fulfillJson(route, { detail: '관광정보 스냅샷을 준비 중입니다.' }, 503);
      return;
    }
    const sourceReady = options.tourismPlacesSourceReady ?? true;
    const displayGroup = url.searchParams.get('displayGroup');
    const items = displayGroup
      ? state.tourismPlaces.filter((place) => place.displayGroup === displayGroup)
      : state.tourismPlaces;
    const response: TourismPlacesResponse = {
      sourceReady,
      sourceName: 'kto',
      importedAt: '2026-06-13T00:00:00.000Z',
      total: sourceReady ? items.length : 0,
      facets: {
        categories: [],
        districts: [],
        contentTypes: [],
        ktoFacets: [],
        displayGroups: buildTourismDisplayGroupFacets(state.tourismPlaces),
      },
      items: sourceReady ? items : [],
    };
    await fulfillJson(route, response);
    return;
  }

  const tourismDetailMatch = path.match(/^\/api\/tourism\/places\/([^/]+)$/);
  if (method === 'GET' && tourismDetailMatch) {
    const placeId = decodeURIComponent(tourismDetailMatch[1]);
    const place = state.tourismPlaces.find((candidate) => candidate.id === placeId);
    const response: TourismPlaceDetailResponse = {
      sourceReady: Boolean(place),
      item: place
        ? {
            ...place,
            hasDetail: place.hasDetail ?? true,
            detailKind: place.detailKind ?? place.ktoFacet ?? place.category,
            overview: place.summary,
            contact: '0507-1429-3364',
            homepageUrl: null,
            images: [],
            displaySections: [
              {
                title: 'Usage',
                items: [
                  { label: 'Hours', value: '11:00~19:50<br>- 준비시간 15:00~17:00' },
                  { label: 'Parking', value: '가능' },
                ],
              },
              {
                title: 'Menu',
                items: [{ label: 'Main menu', value: '돌솥밥' }],
              },
            ],
            detail: {},
          }
        : null,
    };
    await fulfillJson(route, response, place ? 200 : 404);
    return;
  }

  if (method === 'GET' && path === '/api/reviews') {
    const placeId = url.searchParams.get('placeId');
    await fulfillJson(route, placeId ? state.reviews.filter((review) => review.placeId === placeId) : state.reviews);
    return;
  }

  if (method === 'GET' && path === '/api/review-feed') {
    await fulfillJson(route, { items: state.reviews, nextCursor: null });
    return;
  }

  if (method === 'POST' && path === '/api/reviews') {
    const payload = request.postDataJSON() as { placeId: string; stampId: string; body: string; mood: Review['mood'] };
    const createdReview: Review = {
      ...e2eReview,
      id: `review-created-${state.reviews.length + 1}`,
      userId: state.user?.id ?? e2eUser.id,
      placeId: payload.placeId,
      placeName: state.places.find((place) => place.id === payload.placeId)?.name ?? e2ePlace.name,
      author: state.user?.nickname ?? e2eUser.nickname,
      body: payload.body,
      mood: payload.mood,
      commentCount: 0,
      likeCount: 0,
      likedByMe: false,
      stampId: payload.stampId,
      comments: [],
    };
    state.reviews = [createdReview, ...state.reviews];
    state.commentsByReviewId[createdReview.id] = [];
    await fulfillJson(route, createdReview, 201);
    return;
  }

  const commentMatch = path.match(/^\/api\/reviews\/([^/]+)\/comments$/);
  if (commentMatch) {
    const reviewId = commentMatch[1];
    if (method === 'GET') {
      await fulfillJson(route, state.commentsByReviewId[reviewId] ?? []);
      return;
    }
    if (method === 'POST') {
      const payload = request.postDataJSON() as { body: string; parentId?: string | null };
      const nextComment: Comment = {
        id: `comment-${(state.commentsByReviewId[reviewId] ?? []).length + 1}`,
        userId: state.user?.id ?? e2eUser.id,
        author: state.user?.nickname ?? e2eUser.nickname,
        body: payload.body,
        parentId: payload.parentId ?? null,
        isDeleted: false,
        createdAt: '05. 14. 16:30',
        replies: [],
      };
      state.commentsByReviewId[reviewId] = [...(state.commentsByReviewId[reviewId] ?? []), nextComment];
      updateReview(state, reviewId, (review) => ({
        ...review,
        commentCount: state.commentsByReviewId[reviewId].length,
      }));
      await fulfillJson(route, state.commentsByReviewId[reviewId], 201);
      return;
    }
  }

  const likeMatch = path.match(/^\/api\/reviews\/([^/]+)\/like$/);
  if (method === 'POST' && likeMatch) {
    const reviewId = likeMatch[1];
    const review = state.reviews.find((candidate) => candidate.id === reviewId);
    const likedByMe = !review?.likedByMe;
    const likeCount = Math.max(0, (review?.likeCount ?? 0) + (likedByMe ? 1 : -1));
    updateReview(state, reviewId, (currentReview) => ({
      ...currentReview,
      likedByMe,
      likeCount,
    }));
    await fulfillJson(route, { reviewId, likedByMe, likeCount });
    return;
  }

  if (method === 'GET' && path === '/api/community-routes') {
    const sort = (url.searchParams.get('sort') === 'latest' ? 'latest' : 'popular') satisfies CommunityRouteSort;
    await fulfillJson(route, state.communityRoutesBySort[sort]);
    return;
  }

  if (method === 'GET' && path === '/api/my/summary') {
    await fulfillJson(route, buildMyPage(state));
    return;
  }

  if (method === 'GET' && path === '/api/my/notifications') {
    await fulfillJson(route, state.notifications);
    return;
  }

  if (method === 'GET' && path === '/api/history') {
    await fulfillJson(route, []);
    return;
  }

  if (method === 'GET' && path === '/api/chat-sessions') {
    await fulfillJson(route, []);
    return;
  }

  throw new Error(`Unhandled E2E API fixture: ${method} ${path}`);
}

function buildTourismDisplayGroupFacets(places: TourismPlaceItem[]) {
  const labels = new Map([
    ['restaurant', '음식점'],
    ['cafe', '카페'],
    ['attraction', '관광지'],
    ['culture', '문화시설'],
    ['leports', '레포츠'],
    ['lodging', '숙박'],
    ['shopping', '쇼핑'],
  ]);
  const counts = new Map<string, number>();
  for (const place of places) {
    if (place.displayGroup) {
      counts.set(place.displayGroup, (counts.get(place.displayGroup) ?? 0) + 1);
    }
  }
  return [...counts.entries()].map(([key, count]) => ({
    key,
    label: labels.get(key) ?? key,
    count,
  }));
}

export async function installApiFixtures(page: Page, state: E2EAppState, options: E2EFixtureOptions = {}) {
  await page.route('**/app-config.js', async (route) => {
    await route.fulfill({
      contentType: 'text/javascript; charset=utf-8',
      body: `window.__JAMISSUE_CONFIG__ = ${JSON.stringify({
        apiBaseUrl: 'http://127.0.0.1:4173',
        naverMapClientId: '',
        supabaseUrl: '',
        supabaseAnonKey: '',
      })};`,
    });
  });

  await page.route('**/api/**', async (route) => {
    await handleApiRoute(route, state, options);
  });
}
