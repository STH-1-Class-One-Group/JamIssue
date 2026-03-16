const PROVIDERS = [
  { key: "naver", label: "네이버" },
  { key: "kakao", label: "카카오" },
];

function jsonResponse(status, payload, env, request, extraHeaders = {}) {
  const headers = new Headers({
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    ...extraHeaders,
  });
  applyCorsHeaders(headers, env, request);
  return new Response(JSON.stringify(payload, null, 2), { status, headers });
}

function applyCorsHeaders(headers, env, request) {
  const origin = request.headers.get("Origin");
  const allowedOrigins = (env.APP_CORS_ORIGINS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const fallbackOrigin = env.APP_FRONTEND_URL ?? "*";
  const allowOrigin = origin && allowedOrigins.includes(origin) ? origin : fallbackOrigin;
  headers.set("Access-Control-Allow-Origin", allowOrigin);
  headers.set("Access-Control-Allow-Credentials", "true");
  headers.set("Access-Control-Allow-Headers", "content-type, authorization");
  headers.set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
  headers.set("Vary", "Origin");
}

function handlePreflight(env, request) {
  const headers = new Headers();
  applyCorsHeaders(headers, env, request);
  return new Response(null, { status: 204, headers });
}

function getSupabaseKey(env) {
  return env.APP_SUPABASE_SERVICE_ROLE_KEY || env.APP_SUPABASE_ANON_KEY || "";
}

async function supabaseRequest(env, path) {
  if (!env.APP_SUPABASE_URL) {
    throw new Error("APP_SUPABASE_URL is empty.");
  }

  const apiKey = getSupabaseKey(env);
  if (!apiKey) {
    throw new Error("Supabase API key is missing.");
  }

  const response = await fetch(`${env.APP_SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: apiKey,
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Supabase request failed (${response.status}): ${detail}`);
  }

  return response.json();
}

function formatDateTime(value) {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Seoul",
  }).format(date);
}

function formatDate(value) {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Seoul",
  }).format(date);
}

function buildAuthProviders() {
  return PROVIDERS.map((provider) => ({
    key: provider.key,
    label: provider.label,
    isEnabled: false,
    loginUrl: null,
  }));
}

function mapPlace(row) {
  return {
    id: String(row.position_id),
    name: row.name,
    district: row.district,
    category: row.category,
    jamColor: row.jam_color,
    accentColor: row.accent_color,
    latitude: row.latitude,
    longitude: row.longitude,
    summary: row.summary,
    description: row.description,
    vibeTags: Array.isArray(row.vibe_tags) ? row.vibe_tags : [],
    visitTime: row.visit_time,
    routeHint: row.route_hint,
    stampReward: row.stamp_reward,
    heroLabel: row.hero_label,
  };
}

function countComments(comments) {
  let total = 0;
  for (const comment of comments) {
    total += 1 + countComments(comment.replies);
  }
  return total;
}

function buildCommentTree(commentRows, usersById) {
  const commentsById = new Map();
  const roots = [];

  for (const row of commentRows) {
    const comment = {
      id: String(row.comment_id),
      userId: row.user_id,
      author: usersById.get(row.user_id)?.nickname ?? "알 수 없음",
      body: row.is_deleted ? "삭제된 댓글입니다." : row.body,
      parentId: row.parent_id ? String(row.parent_id) : null,
      isDeleted: row.is_deleted,
      createdAt: formatDateTime(row.created_at),
      replies: [],
    };
    commentsById.set(comment.id, comment);
  }

  for (const comment of commentsById.values()) {
    if (comment.parentId && commentsById.has(comment.parentId)) {
      commentsById.get(comment.parentId).replies.push(comment);
    } else {
      roots.push(comment);
    }
  }

  return roots;
}

function mapReviewRows(feedRows, commentRows, likeRows, usersById, placesById) {
  const commentsByFeedId = new Map();
  for (const row of commentRows) {
    const feedId = String(row.feed_id);
    if (!commentsByFeedId.has(feedId)) {
      commentsByFeedId.set(feedId, []);
    }
    commentsByFeedId.get(feedId).push(row);
  }

  const likesByFeedId = new Map();
  for (const row of likeRows) {
    const feedId = String(row.feed_id);
    likesByFeedId.set(feedId, (likesByFeedId.get(feedId) ?? 0) + 1);
  }

  return feedRows.map((row) => {
    const reviewComments = buildCommentTree(commentsByFeedId.get(String(row.feed_id)) ?? [], usersById);
    return {
      id: String(row.feed_id),
      userId: row.user_id,
      placeId: String(row.position_id),
      placeName: placesById.get(String(row.position_id))?.name ?? "장소 정보 없음",
      author: usersById.get(row.user_id)?.nickname ?? "알 수 없음",
      body: row.body,
      mood: row.mood,
      badge: row.badge,
      visitedAt: formatDateTime(row.created_at),
      imageUrl: row.image_url ?? null,
      commentCount: countComments(reviewComments),
      likeCount: likesByFeedId.get(String(row.feed_id)) ?? 0,
      likedByMe: false,
      comments: reviewComments,
    };
  });
}

function mapCourses(courseRows, coursePlaceRows) {
  const placeIdsByCourseId = new Map();
  for (const row of coursePlaceRows) {
    const courseId = String(row.course_id);
    if (!placeIdsByCourseId.has(courseId)) {
      placeIdsByCourseId.set(courseId, []);
    }
    placeIdsByCourseId.get(courseId).push({
      stopOrder: row.stop_order,
      placeId: String(row.position_id),
    });
  }

  return courseRows.map((row) => ({
    id: String(row.course_id),
    title: row.title,
    mood: row.mood,
    duration: row.duration,
    note: row.note,
    color: row.color,
    placeIds: (placeIdsByCourseId.get(String(row.course_id)) ?? [])
      .sort((left, right) => left.stopOrder - right.stopOrder)
      .map((item) => item.placeId),
  }));
}

function mapCommunityRoutes(routeRows, routePlaceRows, usersById, placesById) {
  const placeRowsByRouteId = new Map();
  for (const row of routePlaceRows) {
    const routeId = String(row.route_id);
    if (!placeRowsByRouteId.has(routeId)) {
      placeRowsByRouteId.set(routeId, []);
    }
    placeRowsByRouteId.get(routeId).push({
      stopOrder: row.stop_order,
      positionId: String(row.position_id),
    });
  }

  return routeRows.map((row) => {
    const placeRows = (placeRowsByRouteId.get(String(row.route_id)) ?? []).sort(
      (left, right) => left.stopOrder - right.stopOrder,
    );
    const placeIds = placeRows.map((item) => item.positionId);
    return {
      id: String(row.route_id),
      authorId: row.user_id,
      author: usersById.get(row.user_id)?.nickname ?? "알 수 없음",
      title: row.title,
      description: row.description,
      mood: row.mood,
      likeCount: row.like_count ?? 0,
      likedByMe: false,
      createdAt: formatDateTime(row.created_at),
      placeIds,
      placeNames: placeIds.map((placeId) => placesById.get(placeId)?.name ?? placeId),
    };
  });
}

async function loadBaseData(env) {
  const [placeRows, courseRows, coursePlaceRows, feedRows, commentRows, likeRows, userRows] = await Promise.all([
    supabaseRequest(
      env,
      "map?select=position_id,name,district,category,latitude,longitude,summary,description,vibe_tags,visit_time,route_hint,stamp_reward,hero_label,jam_color,accent_color,is_active&is_active=eq.true&order=position_id.asc",
    ),
    supabaseRequest(env, "course?select=course_id,title,mood,duration,note,color,display_order&order=display_order.asc"),
    supabaseRequest(env, "course_place?select=course_id,position_id,stop_order&order=stop_order.asc"),
    supabaseRequest(env, "feed?select=feed_id,position_id,user_id,body,mood,badge,image_url,created_at&order=created_at.desc"),
    supabaseRequest(
      env,
      "user_comment?select=comment_id,feed_id,user_id,parent_id,body,is_deleted,created_at&order=created_at.asc",
    ),
    supabaseRequest(env, "feed_like?select=feed_id,user_id"),
    supabaseRequest(env, "user?select=user_id,nickname"),
  ]);

  const places = placeRows.map(mapPlace);
  const placesById = new Map(places.map((place) => [place.id, place]));
  const usersById = new Map(userRows.map((row) => [row.user_id, row]));

  return {
    places,
    placesById,
    usersById,
    courses: mapCourses(courseRows, coursePlaceRows),
    reviews: mapReviewRows(feedRows, commentRows, likeRows, usersById, placesById),
  };
}

async function handleHealth(request, env) {
  return jsonResponse(
    200,
    {
      status: "ok",
      env: "worker-first",
      databaseUrl: env.APP_SUPABASE_URL ?? "",
      databaseProvider: "supabase-rest",
      storageBackend: env.APP_STORAGE_BACKEND ?? "supabase",
      storagePath: env.APP_SUPABASE_STORAGE_BUCKET ? `supabase://${env.APP_SUPABASE_STORAGE_BUCKET}` : "",
      supabaseConfigured: Boolean(env.APP_SUPABASE_URL && getSupabaseKey(env)),
    },
    env,
    request,
  );
}

async function handleAuthProviders(request, env) {
  return jsonResponse(200, buildAuthProviders(), env, request);
}

async function handleAuthSession(request, env) {
  return jsonResponse(
    200,
    {
      isAuthenticated: false,
      user: null,
      providers: buildAuthProviders(),
    },
    env,
    request,
  );
}

async function handleBootstrap(request, env) {
  const baseData = await loadBaseData(env);
  return jsonResponse(
    200,
    {
      places: baseData.places,
      reviews: baseData.reviews,
      courses: baseData.courses,
      stamps: { collectedPlaceIds: [] },
      hasRealData: baseData.places.length > 0,
    },
    env,
    request,
  );
}

async function handleReviews(request, env, url) {
  const baseData = await loadBaseData(env);
  const placeId = url.searchParams.get("placeId");
  const userId = url.searchParams.get("userId");

  const reviews = baseData.reviews.filter((review) => {
    if (placeId && review.placeId !== placeId) {
      return false;
    }
    if (userId && review.userId !== userId) {
      return false;
    }
    return true;
  });

  return jsonResponse(200, reviews, env, request);
}

async function handleCommunityRoutes(request, env, url) {
  const sort = url.searchParams.get("sort") === "latest" ? "latest" : "popular";
  const [routeRows, routePlaceRows, placeRows, userRows] = await Promise.all([
    supabaseRequest(
      env,
      `user_route?select=route_id,user_id,title,description,mood,like_count,created_at,is_public&is_public=eq.true&order=${
        sort === "popular" ? "like_count.desc,created_at.desc" : "created_at.desc"
      }`,
    ),
    supabaseRequest(env, "user_route_place?select=route_id,position_id,stop_order&order=stop_order.asc"),
    supabaseRequest(env, "map?select=position_id,name&is_active=eq.true"),
    supabaseRequest(env, "user?select=user_id,nickname"),
  ]);

  const placesById = new Map(placeRows.map((row) => [String(row.position_id), { name: row.name }]));
  const usersById = new Map(userRows.map((row) => [row.user_id, row]));
  const routes = mapCommunityRoutes(routeRows, routePlaceRows, usersById, placesById);
  return jsonResponse(200, routes, env, request);
}

async function handleMyRoutes(request, env) {
  return jsonResponse(401, { detail: "로그인이 필요해요." }, env, request);
}

async function handleBannerEvents(request, env) {
  const [eventRows, sourceRows] = await Promise.all([
    supabaseRequest(
      env,
      "public_event?select=public_event_id,title,venue_name,district,starts_at,ends_at,summary,source_page_url&order=starts_at.asc&limit=4",
    ),
    supabaseRequest(env, "public_data_source?select=name,last_imported_at&provider=eq.public-event&limit=1"),
  ]);

  const source = sourceRows[0] ?? null;
  const now = Date.now();
  const items = eventRows.map((row) => ({
    id: String(row.public_event_id),
    title: row.title,
    venueName: row.venue_name ?? null,
    district: row.district ?? "",
    startDate: row.starts_at,
    endDate: row.ends_at,
    dateLabel: `${formatDate(row.starts_at)} - ${formatDate(row.ends_at)}`,
    summary: row.summary ?? "",
    sourcePageUrl: row.source_page_url ?? null,
    linkedPlaceName: null,
    isOngoing: new Date(row.starts_at).getTime() <= now && new Date(row.ends_at).getTime() >= now,
  }));

  return jsonResponse(
    200,
    {
      sourceReady: items.length > 0,
      sourceName: source?.name ?? null,
      importedAt: source?.last_imported_at ?? null,
      items,
    },
    env,
    request,
  );
}

function resolveOriginUrl(request, env) {
  const originBaseUrl = (env.APP_ORIGIN_API_URL ?? "").trim();
  if (!originBaseUrl) {
    return null;
  }
  const incomingUrl = new URL(request.url);
  const upstreamUrl = new URL(originBaseUrl);
  upstreamUrl.pathname = incomingUrl.pathname;
  upstreamUrl.search = incomingUrl.search;
  return upstreamUrl;
}

function buildProxyHeaders(request) {
  const incomingUrl = new URL(request.url);
  const headers = new Headers(request.headers);
  headers.set("x-forwarded-host", incomingUrl.host);
  headers.set("x-forwarded-proto", incomingUrl.protocol.replace(":", ""));
  headers.set("x-forwarded-for", headers.get("cf-connecting-ip") ?? "");
  return headers;
}

async function proxyToOrigin(request, env) {
  const upstreamUrl = resolveOriginUrl(request, env);
  if (!upstreamUrl) {
    return jsonResponse(501, { detail: "이 엔드포인트는 아직 Worker-first 브랜치에서 구현되지 않았어요." }, env, request);
  }

  const init = {
    method: request.method,
    headers: buildProxyHeaders(request),
    redirect: "manual",
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = request.body;
  }

  const upstreamResponse = await fetch(upstreamUrl.toString(), init);
  const responseHeaders = new Headers(upstreamResponse.headers);
  responseHeaders.set("cache-control", "no-store");
  applyCorsHeaders(responseHeaders, env, request);
  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
    headers: responseHeaders,
  });
}

async function routeRequest(request, env) {
  const url = new URL(request.url);

  if (request.method === "OPTIONS") {
    return handlePreflight(env, request);
  }

  if (request.method === "GET" && url.pathname === "/api/health") {
    return handleHealth(request, env);
  }
  if (request.method === "GET" && url.pathname === "/api/auth/providers") {
    return handleAuthProviders(request, env);
  }
  if (request.method === "GET" && url.pathname === "/api/auth/me") {
    return handleAuthSession(request, env);
  }
  if (request.method === "GET" && url.pathname === "/api/bootstrap") {
    return handleBootstrap(request, env);
  }
  if (request.method === "GET" && url.pathname === "/api/reviews") {
    return handleReviews(request, env, url);
  }
  if (request.method === "GET" && url.pathname === "/api/community-routes") {
    return handleCommunityRoutes(request, env, url);
  }
  if (request.method === "GET" && url.pathname === "/api/my/routes") {
    return handleMyRoutes(request, env);
  }
  if (request.method === "GET" && url.pathname === "/api/banner/events") {
    return handleBannerEvents(request, env);
  }

  return proxyToOrigin(request, env);
}

export default {
  async fetch(request, env) {
    try {
      return await routeRequest(request, env);
    } catch (error) {
      return jsonResponse(
        500,
        {
          service: "jamissue-api-worker-poc",
          status: "worker-error",
          message: error instanceof Error ? error.message : String(error),
        },
        env,
        request,
      );
    }
  },
};
