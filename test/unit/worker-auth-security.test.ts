import { describe, expect, it } from 'vitest';

import { handleFestivalImport } from '../../deploy/api-worker-shell/services/festivals';
import {
  handleKakaoCallback,
  handleLogout,
  handleStartKakaoLogin,
  handleStartNaverLogin,
} from '../../deploy/api-worker-shell/services/auth';
import { buildAuthProviders } from '../../deploy/api-worker-shell/services/auth/provider-config';
import {
  buildSessionUser,
  createOAuthCleanupCookie,
  createOAuthStateCookie,
  createSessionCleanupCookie,
  getSecureCookieFlag,
  getSigningSecret,
  issueSessionCookie,
  parseCookies,
  readOAuthStatePayload,
  readSessionUser,
  requireSessionUser,
  serializeCookie,
  sha256Base64Url,
} from '../../deploy/api-worker-shell/services/auth/session';
import { createAdminService } from '../../deploy/api-worker-shell/services/admin';
import type { WorkerEnv, WorkerSessionUser } from '../../deploy/api-worker-shell/types';

const frontendUrl = 'https://daejeon.jamissue.com';
const apiUrl = 'https://api.daejeon.jamissue.com';

function buildConfiguredEnv(overrides: WorkerEnv = {}): WorkerEnv {
  return {
    APP_FRONTEND_URL: frontendUrl,
    APP_KAKAO_LOGIN_CALLBACK_URL: `${apiUrl}/api/auth/kakao/callback`,
    APP_KAKAO_LOGIN_CLIENT_ID: 'kakao-rest-api-key',
    APP_KAKAO_LOGIN_CLIENT_SECRET: 'kakao-client-secret',
    APP_NAVER_LOGIN_CALLBACK_URL: `${apiUrl}/api/auth/naver/callback`,
    APP_NAVER_LOGIN_CLIENT_ID: 'naver-client-id',
    APP_NAVER_LOGIN_CLIENT_SECRET: 'naver-client-secret',
    APP_SESSION_SECRET: 'session-secret',
    ...overrides,
  };
}

async function expectJsonDetail(response: Response) {
  return (await response.json()) as { detail: string };
}

describe('worker auth provider configuration', () => {
  it('exposes Kakao and Naver providers only when each REST credential set is complete', () => {
    const providers = buildAuthProviders(
      buildConfiguredEnv({
        APP_KAKAO_LOGIN_CLIENT_SECRET: '',
      }),
    );

    expect(providers).toEqual([
      {
        key: 'naver',
        label: '네이버',
        isEnabled: true,
        loginUrl: '/api/auth/naver/login',
      },
      {
        key: 'kakao',
        label: '카카오',
        isEnabled: false,
        loginUrl: null,
      },
    ]);
  });
});

describe('worker OAuth session security', () => {
  it('returns 503 before starting Kakao OAuth when the signing secret is missing', async () => {
    const request = new Request(`${apiUrl}/api/auth/kakao/login`);
    const response = await handleStartKakaoLogin(
      request,
      buildConfiguredEnv({ APP_SESSION_SECRET: '', APP_JWT_SECRET: '' }),
      new URL(request.url),
    );

    expect(response.status).toBe(503);
    expect(await expectJsonDetail(response)).toEqual({ detail: '세션 비밀키가 설정되지 않았어요.' });
  });

  it('returns 503 before starting Naver OAuth when the signing secret is missing', async () => {
    const request = new Request(`${apiUrl}/api/auth/naver/login`);
    const response = await handleStartNaverLogin(
      request,
      buildConfiguredEnv({ APP_SESSION_SECRET: '', APP_JWT_SECRET: '' }),
      new URL(request.url),
    );

    expect(response.status).toBe(503);
    expect(await expectJsonDetail(response)).toEqual({ detail: '세션 비밀키가 설정되지 않았어요.' });
  });

  it('does not issue a session cookie without a signing secret', async () => {
    const sessionUser: WorkerSessionUser = {
      id: 'user-1',
      nickname: '테스터',
      email: 'tester@example.com',
      provider: 'kakao',
      profileImage: null,
      isAdmin: false,
      profileCompletedAt: null,
    };

    await expect(
      issueSessionCookie(
        sessionUser,
        new Request(`${apiUrl}/api/auth/kakao/callback`),
        buildConfiguredEnv({ APP_SESSION_SECRET: '', APP_JWT_SECRET: '' }),
      ),
    ).rejects.toThrow('APP_SESSION_SECRET is required');
  });

  it('redirects Kakao callback with state-mismatch without exchanging tokens', async () => {
    const env = buildConfiguredEnv();
    const stateCookie = await createOAuthStateCookie(
      frontendUrl,
      'expected-state',
      new Request(`${apiUrl}/api/auth/kakao/login`),
      env,
    );
    const request = new Request(`${apiUrl}/api/auth/kakao/callback?code=abc&state=wrong-state`, {
      headers: { cookie: stateCookie },
    });

    const response = await handleKakaoCallback(request, env, new URL(request.url));

    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toContain('auth=kakao-error');
    expect(response.headers.get('location')).toContain('reason=state-mismatch');
    expect(response.headers.get('set-cookie')).toContain('jamissue_worker_oauth_state=');
  });

  it('clears the Worker session cookie with Secure on HTTPS logout', async () => {
    const request = new Request(`${apiUrl}/api/auth/logout`, { method: 'POST' });

    const response = await handleLogout(request, buildConfiguredEnv());

    expect(response.status).toBe(200);
    expect(response.headers.get('set-cookie')).toContain('jamissue_worker_session=');
    expect(response.headers.get('set-cookie')).toContain('Secure');
  });

  it('signs, reads, rejects, and clears Worker session cookies through the public session helpers', async () => {
    const env = buildConfiguredEnv({ APP_ADMIN_USER_IDS: 'user-1', APP_SESSION_HTTPS: 'false' });
    const request = new Request(`${apiUrl}/api/auth/me`);
    const sessionUser = buildSessionUser('user-1', 'tester', undefined, 'kakao', undefined, env);
    const sessionCookie = await issueSessionCookie(sessionUser, request, env);
    const authenticatedRequest = new Request(`${apiUrl}/api/auth/me`, {
      headers: { Cookie: `${sessionCookie}; other=value=with=equals` },
    });

    await expect(readSessionUser(authenticatedRequest, env)).resolves.toEqual(expect.objectContaining({
      id: 'user-1',
      email: null,
      profileImage: null,
      profileCompletedAt: null,
      isAdmin: true,
    }));
    await expect(requireSessionUser(authenticatedRequest, env)).resolves.toEqual({
      sessionUser: expect.objectContaining({ id: 'user-1', isAdmin: true }),
    });
    await expect(readSessionUser(new Request(`${apiUrl}/api/auth/me`, { headers: { Cookie: 'jamissue_worker_session=bad.token' } }), env))
      .resolves.toBeNull();

    const unauthorized = await requireSessionUser(new Request(`${apiUrl}/api/auth/me`), env);
    expect(unauthorized.response?.status).toBe(401);
    expect(parseCookies(authenticatedRequest).get('other')).toBe('value=with=equals');
    expect(getSecureCookieFlag(request, env)).toBe(false);
    expect(createSessionCleanupCookie(request, env)).toContain('Max-Age=0');
    expect(createOAuthCleanupCookie(request, env)).toContain('Max-Age=0');
    expect(serializeCookie('plain', 'value', { httpOnly: false, sameSite: 'Strict', path: '/x' })).toBe('plain=value; Path=/x; SameSite=Strict');
    await expect(sha256Base64Url('state')).resolves.toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('reads OAuth state payloads and rejects tampered or missing OAuth cookies', async () => {
    const env = buildConfiguredEnv();
    const loginRequest = new Request(`${apiUrl}/api/auth/kakao/login`);
    const stateCookie = await createOAuthStateCookie('https://front.test/next', 'state-1', loginRequest, env);
    const callbackRequest = new Request(`${apiUrl}/api/auth/kakao/callback`, {
      headers: { Cookie: stateCookie },
    });

    await expect(readOAuthStatePayload(callbackRequest, env)).resolves.toEqual(expect.objectContaining({
      state: 'state-1',
      next: 'https://front.test/next',
      exp: expect.any(Number),
    }));
    await expect(readOAuthStatePayload(new Request(`${apiUrl}/api/auth/kakao/callback`), env)).resolves.toBeNull();
    await expect(readOAuthStatePayload(
      new Request(`${apiUrl}/api/auth/kakao/callback`, { headers: { Cookie: 'jamissue_worker_oauth_state=broken' } }),
      env,
    )).resolves.toBeNull();
    expect(getSigningSecret(buildConfiguredEnv({ APP_SESSION_SECRET: '', APP_JWT_SECRET: 'jwt-secret' }))).toBe('jwt-secret');
  });
});

describe('worker protected backend gates', () => {
  it('returns 403 for admin summary without an admin session', async () => {
    const adminService = createAdminService({
      normalizePlaceCategory: (category) => String(category || 'attraction'),
    });

    const response = await adminService.handleAdminSummary(new Request(`${apiUrl}/api/admin/summary`), buildConfiguredEnv());

    expect(response.status).toBe(403);
  });

  it('rejects public event import when the import token is not configured', async () => {
    const request = new Request(`${apiUrl}/api/internal/public-events/import`, { method: 'POST' });

    const response = await handleFestivalImport(request, buildConfiguredEnv({ APP_EVENT_IMPORT_TOKEN: '' }));

    expect(response.status).toBe(503);
    expect(await expectJsonDetail(response)).toEqual({ detail: 'APP_EVENT_IMPORT_TOKEN is empty.' });
  });

  it('rejects public event import when the bearer token is missing or wrong', async () => {
    const request = new Request(`${apiUrl}/api/internal/public-events/import`, { method: 'POST' });

    const response = await handleFestivalImport(request, buildConfiguredEnv({ APP_EVENT_IMPORT_TOKEN: 'expected' }));

    expect(response.status).toBe(401);
  });
});
