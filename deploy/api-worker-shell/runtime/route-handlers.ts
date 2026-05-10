import { jsonResponse } from '../lib/http';
import { getSupabaseKey } from '../lib/supabase';
import { createAuthResponse, kakaoConfigured, naverConfigured, readSessionUser } from '../services/auth';
import type { WorkerEnv, WorkerPlace } from '../types';
import type { RouteRuntime } from './route-runtime';

type PublicWorkerPlace = Omit<WorkerPlace, 'positionId'>;

function toPublicPlace({ positionId: _positionId, ...place }: WorkerPlace): PublicWorkerPlace {
  return place;
}

export async function handleHealth(request: Request, env: WorkerEnv) {
  return jsonResponse(
    200,
    {
      status: 'ok',
      env: env.APP_ENV ?? 'worker-first',
      databaseUrl: env.APP_SUPABASE_URL ?? '',
      databaseProvider: 'supabase-rest',
      storageBackend: env.APP_STORAGE_BACKEND ?? 'supabase',
      storagePath: env.APP_SUPABASE_STORAGE_BUCKET ? `supabase://${env.APP_SUPABASE_STORAGE_BUCKET}` : '',
      supabaseConfigured: Boolean(env.APP_SUPABASE_URL && getSupabaseKey(env)),
      frontendUrlConfigured: Boolean(env.APP_FRONTEND_URL),
      corsOriginsConfigured: Boolean(env.APP_CORS_ORIGINS),
      naverLoginConfigured: naverConfigured(env),
      naverLoginClientIdConfigured: Boolean(env.APP_NAVER_LOGIN_CLIENT_ID),
      naverLoginClientSecretConfigured: Boolean(env.APP_NAVER_LOGIN_CLIENT_SECRET),
      naverLoginCallbackUrlConfigured: Boolean(env.APP_NAVER_LOGIN_CALLBACK_URL),
      naverLoginCallbackUrl: env.APP_NAVER_LOGIN_CALLBACK_URL ?? '',
      kakaoLoginConfigured: kakaoConfigured(env),
      kakaoLoginClientIdConfigured: Boolean(env.APP_KAKAO_LOGIN_CLIENT_ID),
      kakaoLoginClientSecretConfigured: Boolean(env.APP_KAKAO_LOGIN_CLIENT_SECRET),
      kakaoLoginCallbackUrlConfigured: Boolean(env.APP_KAKAO_LOGIN_CALLBACK_URL),
      kakaoLoginCallbackUrl: env.APP_KAKAO_LOGIN_CALLBACK_URL ?? '',
    },
    env,
    request,
  );
}

export async function handleMapBootstrap(request: Request, env: WorkerEnv, runtime: RouteRuntime) {
  const sessionUser = await readSessionUser(request, env);
  const mapData = await runtime.loadBaseData(env, sessionUser?.id ?? null);
  return jsonResponse(
    200,
    {
      auth: createAuthResponse(sessionUser, env),
      places: mapData.places.map(toPublicPlace),
      stamps: {
        collectedPlaceIds: mapData.collectedPlaceIds,
        logs: mapData.stampLogs,
        travelSessions: mapData.travelSessions,
      },
      hasRealData: mapData.places.length > 0,
    },
    env,
    request,
  );
}

export async function handleCuratedCourses(request: Request, env: WorkerEnv, runtime: RouteRuntime) {
  const { placeRows, courseRows, coursePlaceRows } = await runtime.loadStaticBaseRows(env);
  const places = placeRows.map((row) => runtime.mapPlace(row));
  const placesByPositionId = new Map<string, WorkerPlace>(places.map((place) => [place.positionId, place]));
  return jsonResponse(200, { courses: runtime.mapCourses(courseRows, coursePlaceRows, placesByPositionId) }, env, request);
}

export async function handleBootstrap(request: Request, env: WorkerEnv, runtime: RouteRuntime) {
  const sessionUser = await readSessionUser(request, env);
  const baseData = await runtime.loadBaseData(env, sessionUser?.id ?? null);
  return jsonResponse(
    200,
    {
      auth: createAuthResponse(sessionUser, env),
      places: baseData.places.map(toPublicPlace),
      reviews: baseData.reviews,
      courses: baseData.courses,
      stamps: {
        collectedPlaceIds: baseData.collectedPlaceIds,
        logs: baseData.stampLogs,
        travelSessions: baseData.travelSessions,
      },
      hasRealData: baseData.places.length > 0,
    },
    env,
    request,
  );
}
