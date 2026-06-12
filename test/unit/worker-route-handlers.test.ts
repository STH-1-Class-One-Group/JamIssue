import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  handleBootstrap,
  handleCuratedCourses,
  handleHealth,
  handleMapBootstrap,
} from '../../deploy/api-worker-shell/runtime/route-handlers';
import type { RouteRuntime } from '../../deploy/api-worker-shell/runtime/route-runtime';
import type { WorkerEnv } from '../../deploy/api-worker-shell/types';

const authMocks = vi.hoisted(() => ({
  createAuthResponse: vi.fn(),
  kakaoConfigured: vi.fn(),
  naverConfigured: vi.fn(),
  readSessionUser: vi.fn(),
}));

const supabaseMocks = vi.hoisted(() => ({
  getSupabaseKey: vi.fn(),
}));

vi.mock('../../deploy/api-worker-shell/services/auth', () => ({
  createAuthResponse: authMocks.createAuthResponse,
  kakaoConfigured: authMocks.kakaoConfigured,
  naverConfigured: authMocks.naverConfigured,
  readSessionUser: authMocks.readSessionUser,
}));

vi.mock('../../deploy/api-worker-shell/lib/supabase', () => ({
  getSupabaseKey: supabaseMocks.getSupabaseKey,
}));

const baseEnv = {
  APP_CORS_ORIGINS: 'https://daejeon.jamissue.com',
  APP_ENV: 'production',
  APP_FRONTEND_URL: 'https://daejeon.jamissue.com',
  APP_KAKAO_LOGIN_CALLBACK_URL: 'https://api.test/api/auth/kakao/callback',
  APP_KAKAO_LOGIN_CLIENT_ID: 'kakao-client',
  APP_KAKAO_LOGIN_CLIENT_SECRET: 'kakao-secret',
  APP_NAVER_LOGIN_CALLBACK_URL: 'https://api.test/api/auth/naver/callback',
  APP_NAVER_LOGIN_CLIENT_ID: 'naver-client',
  APP_NAVER_LOGIN_CLIENT_SECRET: 'naver-secret',
  APP_STORAGE_BACKEND: 'supabase',
  APP_SUPABASE_STORAGE_BUCKET: 'jamissue',
  APP_SUPABASE_URL: 'https://supabase.test',
} as WorkerEnv;

function createRuntime(overrides: Partial<RouteRuntime> = {}): RouteRuntime {
  return {
    adminService: {} as RouteRuntime['adminService'],
    communityRouteService: {} as RouteRuntime['communityRouteService'],
    festivalService: {} as RouteRuntime['festivalService'],
    myService: {} as RouteRuntime['myService'],
    notificationService: {} as RouteRuntime['notificationService'],
    reviewService: {} as RouteRuntime['reviewService'],
    stampService: {} as RouteRuntime['stampService'],
    tourismService: {} as RouteRuntime['tourismService'],
    handleNaverCallback: vi.fn(),
    handleNaverLogin: vi.fn(),
    handleKakaoCallback: vi.fn(),
    handleKakaoLogin: vi.fn(),
    handleLogout: vi.fn(),
    handleOAuthMe: vi.fn(),
    handleOAuthSessionIssue: vi.fn(),
    loadBaseData: vi.fn(async () => ({
      collectedPlaceIds: ['place-1'],
      courses: [{ id: 'course-1' }],
      places: [{
        id: 'place-1',
        positionId: '101',
        name: 'Place 1',
      }],
      reviews: [{ id: 'review-1' }],
      stampLogs: [{ id: 'stamp-1' }],
      travelSessions: [{ id: 'session-1' }],
    })),
    loadCuratedCourses: vi.fn(async () => [{ id: 'course-1' }]),
    ...overrides,
  } as RouteRuntime;
}

async function readJson<T>(response: Response) {
  return response.json() as Promise<T>;
}

describe('worker route handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMocks.createAuthResponse.mockReturnValue({ isAuthenticated: true, user: { id: 'user-1' } });
    authMocks.kakaoConfigured.mockReturnValue(true);
    authMocks.naverConfigured.mockReturnValue(true);
    authMocks.readSessionUser.mockResolvedValue({ id: 'user-1' });
    supabaseMocks.getSupabaseKey.mockReturnValue('service-key');
  });

  it('reports health configuration flags without exposing mutable runtime state', async () => {
    const response = await handleHealth(new Request('https://api.test/api/health'), baseEnv);
    const payload = await readJson<Record<string, unknown>>(response);

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({
      status: 'ok',
      env: 'production',
      databaseProvider: 'supabase-rest',
      storagePath: 'supabase://jamissue',
      supabaseConfigured: true,
      frontendUrlConfigured: true,
      corsOriginsConfigured: true,
      naverLoginConfigured: true,
      kakaoLoginConfigured: true,
    });
  });

  it('uses fallback health values when optional environment values are missing', async () => {
    authMocks.kakaoConfigured.mockReturnValue(false);
    authMocks.naverConfigured.mockReturnValue(false);
    supabaseMocks.getSupabaseKey.mockReturnValue('');

    const response = await handleHealth(new Request('https://api.test/api/health'), {} as WorkerEnv);
    const payload = await readJson<Record<string, unknown>>(response);

    expect(payload).toMatchObject({
      env: 'worker-first',
      databaseUrl: '',
      storageBackend: 'supabase',
      storagePath: '',
      supabaseConfigured: false,
      frontendUrlConfigured: false,
      corsOriginsConfigured: false,
      naverLoginConfigured: false,
      kakaoLoginConfigured: false,
    });
  });

  it('maps bootstrap and map bootstrap responses without leaking internal position ids', async () => {
    const runtime = createRuntime();

    const bootstrap = await readJson<{ places: Array<Record<string, unknown>>; hasRealData: boolean }>(
      await handleBootstrap(new Request('https://api.test/api/bootstrap'), baseEnv, runtime),
    );
    const mapBootstrap = await readJson<{ places: Array<Record<string, unknown>>; hasRealData: boolean }>(
      await handleMapBootstrap(new Request('https://api.test/api/map-bootstrap'), baseEnv, runtime),
    );

    expect(bootstrap.hasRealData).toBe(true);
    expect(mapBootstrap.hasRealData).toBe(true);
    expect(bootstrap.places[0]).toMatchObject({ id: 'place-1', name: 'Place 1' });
    expect(mapBootstrap.places[0]).toMatchObject({ id: 'place-1', name: 'Place 1' });
    expect(bootstrap.places[0]).not.toHaveProperty('positionId');
    expect(mapBootstrap.places[0]).not.toHaveProperty('positionId');
    expect(runtime.loadBaseData).toHaveBeenCalledWith(baseEnv, 'user-1');
  });

  it('supports anonymous empty bootstrap responses and curated course loading', async () => {
    authMocks.createAuthResponse.mockReturnValue({ isAuthenticated: false, user: null });
    authMocks.readSessionUser.mockResolvedValue(null);
    const runtime = createRuntime({
      loadBaseData: vi.fn(async () => ({
        collectedPlaceIds: [],
        courses: [],
        places: [],
        reviews: [],
        stampLogs: [],
        travelSessions: [],
      })),
      loadCuratedCourses: vi.fn(async () => []),
    });

    const bootstrap = await readJson<{ auth: unknown; hasRealData: boolean; places: unknown[] }>(
      await handleBootstrap(new Request('https://api.test/api/bootstrap'), baseEnv, runtime),
    );
    const courses = await readJson<{ courses: unknown[] }>(
      await handleCuratedCourses(new Request('https://api.test/api/courses/curated'), baseEnv, runtime),
    );

    expect(bootstrap).toMatchObject({ auth: { isAuthenticated: false, user: null }, hasRealData: false, places: [] });
    expect(courses).toEqual({ courses: [] });
    expect(runtime.loadBaseData).toHaveBeenCalledWith(baseEnv, null);
    expect(runtime.loadCuratedCourses).toHaveBeenCalledWith(baseEnv);
  });
});
