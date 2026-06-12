import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPublicSmokeChecks } from '../../scripts/run-public-smoke-checks';
import { createProtectedSmokeChecks, runProtectedSmokeSuite } from '../../scripts/run-protected-smoke-checks';
import { createProtectedWriteSmokeChecks, runProtectedWriteSmokeSuite } from '../../scripts/run-protected-write-smoke-checks';
import {
  getProtectedAuthHeaders,
  getProtectedSmokeSkipReason,
  isProtectedSmokeEnabled,
  PROTECTED_SMOKE_ENDPOINTS,
} from '../../scripts/smoke/protected';
import {
  getProtectedWriteSmokeConfig,
  getProtectedWriteSmokeSkipReason,
  isProtectedWriteSmokeEnabled,
} from '../../scripts/smoke/protected-write';

function stubSmokeFetch() {
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
    const path = new URL(url).pathname;
    if (path === '/') {
      return new Response('<html><div id="root"></div></html>', { status: 200 });
    }
    if (path === '/api/health') {
      return Response.json({ status: 'ok' });
    }
    if (path === '/api/auth/providers') {
      return Response.json([{ key: 'naver' }]);
    }
    if (path === '/api/map-bootstrap') {
      return Response.json({ places: [], stamps: { logs: [] } });
    }
    if (path === '/api/review-feed') {
      return Response.json({ items: [], nextCursor: null });
    }
    if (path === '/api/community-routes' || path === '/api/festivals') {
      return Response.json([]);
    }
    const headers = new Headers(init?.headers);
    if (path === '/api/my/summary' && !headers.has('Authorization')) {
      return Response.json({ detail: 'unauthorized' }, { status: 401 });
    }
    if (path === '/api/auth/me') {
      return Response.json({ isAuthenticated: true, user: { id: 'user-1' } });
    }
    if (path === '/api/my/summary') {
      return Response.json({ stamps: [], reviews: [], notifications: [] });
    }
    if (path === '/api/my/notifications') {
      return Response.json([]);
    }
    if (path === '/api/reviews' && init?.method === 'POST') {
      return Response.json({ id: 'review-1' }, { status: 201 });
    }
    if (path === '/api/reviews/review-1/comments') {
      return Response.json([]);
    }
    if (path === '/api/reviews/review-1' && init?.method === 'DELETE') {
      return Response.json({ deleted: true });
    }
    return Response.json({ detail: `unhandled ${path}` }, { status: 404 });
  }));
}

describe('smoke entrypoint checks', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    delete process.env.SMOKE_AUTH_BEARER_TOKEN;
  });

  it('runs the public smoke check matrix against the expected public endpoints', async () => {
    stubSmokeFetch();

    const checks = createPublicSmokeChecks({
      appConfigResult: {
        response: new Response('window.__JAMISSUE_CONFIG__ = {"apiBaseUrl":"https://api.test"};', { status: 200 }),
        text: 'window.__JAMISSUE_CONFIG__ = {"apiBaseUrl":"https://api.test"};',
      },
      apiBaseUrl: 'https://api.test',
    });
    const results = await Promise.all(checks.map((check) => check.run()));

    expect(checks.map((check) => check.name)).toEqual([
      'frontend-root',
      'frontend-app-config',
      'api-health',
      'api-auth-providers',
      'api-map-bootstrap',
      'api-review-feed',
      'api-community-routes',
      'api-festivals',
      'api-my-summary-unauthorized',
    ]);
    expect(results.every((result) => result.ok)).toBe(true);
  });

  it('reports a failed public app-config check when the bootstrap cannot be fetched', async () => {
    const checks = createPublicSmokeChecks({
      appConfigResult: { response: null, text: '', error: 'network down' },
      apiBaseUrl: 'https://api.test',
    });

    await expect(checks[1].run()).resolves.toEqual(expect.objectContaining({
      name: 'frontend-app-config',
      ok: false,
      error: 'network down',
    }));
  });

  it('guards protected smoke helpers behind a bearer token and runs authenticated checks', async () => {
    expect(isProtectedSmokeEnabled({})).toBe(false);
    expect(getProtectedSmokeSkipReason({})).toBe('SMOKE_AUTH_BEARER_TOKEN is not configured');
    expect(() => getProtectedAuthHeaders({})).toThrow('SMOKE_AUTH_BEARER_TOKEN is required');
    expect(getProtectedAuthHeaders({ SMOKE_AUTH_BEARER_TOKEN: 'token' })).toEqual({ Authorization: 'Bearer token' });

    process.env.SMOKE_AUTH_BEARER_TOKEN = 'token';
    stubSmokeFetch();
    const checks = createProtectedSmokeChecks({ apiBaseUrl: 'https://api.test' });
    const results = await Promise.all(checks.map((check) => check.run()));

    expect(checks.map((check) => check.name)).toEqual(PROTECTED_SMOKE_ENDPOINTS.map((endpoint) => endpoint.name));
    expect(results.every((result) => result.ok)).toBe(true);
  });

  it('skips protected smoke when auth is missing and delegates to the suite when present', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const skipped = await runProtectedSmokeSuite({ env: {} });
    expect(skipped).toEqual(expect.objectContaining({
      suite: 'protected',
      skipped: true,
      reason: 'SMOKE_AUTH_BEARER_TOKEN is not configured',
    }));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('"suite": "protected"'));

    process.env.SMOKE_AUTH_BEARER_TOKEN = 'token';
    const runSmokeSuiteImpl = vi.fn(async (payload) => payload);
    const loaded = await runProtectedSmokeSuite({
      env: { SMOKE_AUTH_BEARER_TOKEN: 'token' },
      loadRuntimeConfigImpl: vi.fn(async () => ({
        appConfigResult: { response: null, text: '' },
        runtimeConfig: null,
        apiBaseUrl: 'https://api.test',
      })),
      runSmokeSuiteImpl,
    });
    expect(loaded).toEqual(expect.objectContaining({ suiteName: 'protected' }));
    expect(runSmokeSuiteImpl).toHaveBeenCalledWith(expect.objectContaining({
      suiteName: 'protected',
      apiBaseUrl: 'https://api.test',
      checks: expect.any(Array),
    }));
  });

  it('guards protected write smoke config and performs review/comment/delete roundtrips', async () => {
    expect(isProtectedWriteSmokeEnabled({ SMOKE_WRITE_ENABLED: 'false' })).toBe(false);
    expect(getProtectedWriteSmokeSkipReason({ SMOKE_WRITE_ENABLED: 'true' })).toBe('SMOKE_AUTH_BEARER_TOKEN is not configured');
    expect(getProtectedWriteSmokeSkipReason({
      SMOKE_WRITE_ENABLED: 'true',
      SMOKE_AUTH_BEARER_TOKEN: 'token',
    })).toBe('SMOKE_WRITE_PLACE_ID and SMOKE_WRITE_STAMP_ID are required for protected write smoke checks');
    expect(getProtectedWriteSmokeConfig({
      SMOKE_WRITE_PLACE_ID: 'place-1',
      SMOKE_WRITE_STAMP_ID: 'stamp-1',
    })).toEqual({
      placeId: 'place-1',
      stampId: 'stamp-1',
      reviewBody: 'protected smoke review roundtrip',
      commentBody: 'protected smoke comment',
    });

    stubSmokeFetch();
    const checks = createProtectedWriteSmokeChecks({
      apiBaseUrl: 'https://api.test',
      env: {
        SMOKE_AUTH_BEARER_TOKEN: 'token',
        SMOKE_WRITE_PLACE_ID: 'place-1',
        SMOKE_WRITE_STAMP_ID: 'stamp-1',
        SMOKE_WRITE_REVIEW_BODY: 'review body',
        SMOKE_WRITE_COMMENT_BODY: 'comment body',
      },
    });

    await expect(checks[0].run()).resolves.toEqual(expect.objectContaining({
      name: 'api-review-write-roundtrip',
      ok: true,
    }));
  });

  it('skips protected write smoke unless explicitly enabled and delegates to the suite when configured', async () => {
    const skipped = await runProtectedWriteSmokeSuite({ env: {} });
    expect(skipped).toEqual(expect.objectContaining({
      suite: 'protected-write',
      skipped: true,
      reason: 'SMOKE_WRITE_ENABLED is not true',
    }));

    const runSmokeSuiteImpl = vi.fn(async (payload) => payload);
    const loaded = await runProtectedWriteSmokeSuite({
      env: {
        SMOKE_WRITE_ENABLED: 'true',
        SMOKE_AUTH_BEARER_TOKEN: 'token',
        SMOKE_WRITE_PLACE_ID: 'place-1',
        SMOKE_WRITE_STAMP_ID: 'stamp-1',
      },
      loadRuntimeConfigImpl: vi.fn(async () => ({
        appConfigResult: { response: null, text: '' },
        runtimeConfig: null,
        apiBaseUrl: 'https://api.test',
      })),
      runSmokeSuiteImpl,
    });

    expect(loaded).toEqual(expect.objectContaining({ suiteName: 'protected-write' }));
    expect(runSmokeSuiteImpl).toHaveBeenCalledWith(expect.objectContaining({
      suiteName: 'protected-write',
      checks: expect.any(Array),
    }));
  });
});
