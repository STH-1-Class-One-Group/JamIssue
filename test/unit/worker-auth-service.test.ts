import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createAuthResponse,
  handleAuthProviders,
  handleAuthSession,
  handleKakaoCallback,
  handleLogout,
  handleNaverCallback,
  handleStartKakaoLogin,
  handleStartNaverLogin,
  handleUpdateProfile,
} from '../../deploy/api-worker-shell/services/auth';
import type { WorkerEnv } from '../../deploy/api-worker-shell/types';

const providerConfigMocks = vi.hoisted(() => ({
  buildAuthProviders: vi.fn(),
  kakaoConfigured: vi.fn(),
  naverConfigured: vi.fn(),
}));

const sessionMocks = vi.hoisted(() => ({
  createOAuthCleanupCookie: vi.fn(),
  createOAuthStateCookie: vi.fn(),
  createSessionCleanupCookie: vi.fn(),
  getSigningSecret: vi.fn(),
  isMissingSigningSecretError: vi.fn(),
  issueSessionCookie: vi.fn(),
  nowSeconds: vi.fn(),
  readOAuthStatePayload: vi.fn(),
  readSessionUser: vi.fn(),
  requireSessionUser: vi.fn(),
  sha256Base64Url: vi.fn(),
}));

const socialUserMocks = vi.hoisted(() => ({
  ensureUniqueNickname: vi.fn(),
  readUserRow: vi.fn(),
  upsertSocialUser: vi.fn(),
}));

const providerMocks = vi.hoisted(() => ({
  buildKakaoLoginUrl: vi.fn(),
  buildNaverLoginUrl: vi.fn(),
  exchangeKakaoCode: vi.fn(),
  exchangeNaverCode: vi.fn(),
  fetchKakaoProfile: vi.fn(),
  fetchNaverProfile: vi.fn(),
}));

const supabaseMocks = vi.hoisted(() => ({
  supabaseRequest: vi.fn(),
}));

vi.mock('../../deploy/api-worker-shell/services/auth/provider-config', () => ({
  buildAuthProviders: providerConfigMocks.buildAuthProviders,
  kakaoConfigured: providerConfigMocks.kakaoConfigured,
  naverConfigured: providerConfigMocks.naverConfigured,
}));

vi.mock('../../deploy/api-worker-shell/services/auth/session', () => ({
  createOAuthCleanupCookie: sessionMocks.createOAuthCleanupCookie,
  createOAuthStateCookie: sessionMocks.createOAuthStateCookie,
  createSessionCleanupCookie: sessionMocks.createSessionCleanupCookie,
  getSigningSecret: sessionMocks.getSigningSecret,
  isMissingSigningSecretError: sessionMocks.isMissingSigningSecretError,
  issueSessionCookie: sessionMocks.issueSessionCookie,
  nowSeconds: sessionMocks.nowSeconds,
  readOAuthStatePayload: sessionMocks.readOAuthStatePayload,
  readSessionUser: sessionMocks.readSessionUser,
  requireSessionUser: sessionMocks.requireSessionUser,
  sha256Base64Url: sessionMocks.sha256Base64Url,
}));

vi.mock('../../deploy/api-worker-shell/services/auth/social-user', () => ({
  ensureUniqueNickname: socialUserMocks.ensureUniqueNickname,
  readUserRow: socialUserMocks.readUserRow,
  upsertSocialUser: socialUserMocks.upsertSocialUser,
}));

vi.mock('../../deploy/api-worker-shell/services/auth/kakao-provider', () => ({
  buildKakaoLoginUrl: providerMocks.buildKakaoLoginUrl,
  exchangeKakaoCode: providerMocks.exchangeKakaoCode,
  fetchKakaoProfile: providerMocks.fetchKakaoProfile,
}));

vi.mock('../../deploy/api-worker-shell/services/auth/naver-provider', () => ({
  buildNaverLoginUrl: providerMocks.buildNaverLoginUrl,
  exchangeNaverCode: providerMocks.exchangeNaverCode,
  fetchNaverProfile: providerMocks.fetchNaverProfile,
}));

vi.mock('../../deploy/api-worker-shell/lib/supabase', () => ({
  supabaseRequest: supabaseMocks.supabaseRequest,
}));

const env = {
  APP_CORS_ORIGINS: '',
  APP_FRONTEND_URL: 'https://daejeon.jamissue.com',
} as WorkerEnv;

const sessionUser = {
  id: 'user-1',
  nickname: 'User',
  email: 'user@example.com',
  provider: 'kakao',
  profileCompletedAt: null,
  isAdmin: false,
};

async function readJson(response: Response) {
  return response.json() as Promise<unknown>;
}

describe('worker auth service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    providerConfigMocks.buildAuthProviders.mockReturnValue([{ key: 'kakao' }]);
    providerConfigMocks.kakaoConfigured.mockReturnValue(true);
    providerConfigMocks.naverConfigured.mockReturnValue(true);
    providerMocks.buildKakaoLoginUrl.mockImplementation((_env, state) => `https://kakao.test/login?state=${state}`);
    providerMocks.buildNaverLoginUrl.mockImplementation((_env, state) => `https://naver.test/login?state=${state}`);
    providerMocks.exchangeKakaoCode.mockResolvedValue({ access_token: 'kakao-token' });
    providerMocks.exchangeNaverCode.mockResolvedValue({ access_token: 'naver-token' });
    providerMocks.fetchKakaoProfile.mockResolvedValue({ id: 'kakao-id', nickname: 'Kakao User' });
    providerMocks.fetchNaverProfile.mockResolvedValue({ id: 'naver-id', nickname: 'Naver User' });
    sessionMocks.createOAuthCleanupCookie.mockReturnValue('oauth=; Max-Age=0');
    sessionMocks.createOAuthStateCookie.mockResolvedValue('oauth-state=state-cookie');
    sessionMocks.createSessionCleanupCookie.mockReturnValue('session=; Max-Age=0');
    sessionMocks.issueSessionCookie.mockResolvedValue('session=session-cookie');
    sessionMocks.isMissingSigningSecretError.mockReturnValue(false);
    sessionMocks.nowSeconds.mockReturnValue(100);
    sessionMocks.readOAuthStatePayload.mockResolvedValue({ state: 'state-1', next: 'https://front.test/next', exp: 200 });
    sessionMocks.readSessionUser.mockResolvedValue(sessionUser);
    sessionMocks.requireSessionUser.mockResolvedValue({ sessionUser });
    socialUserMocks.ensureUniqueNickname.mockResolvedValue('New Nick');
    socialUserMocks.readUserRow.mockResolvedValue({ nickname: 'Stored Nick', email: 'stored@example.com', profile_completed_at: '2026-05-14T00:00:00Z' });
    socialUserMocks.upsertSocialUser.mockResolvedValue(sessionUser);
  });

  it('builds auth responses, provider lists, session state, and logout cleanup cookies', async () => {
    expect(createAuthResponse(null, env)).toEqual({ isAuthenticated: false, user: null, providers: [{ key: 'kakao' }] });

    const providers = await handleAuthProviders(new Request('https://api.test/api/auth/providers'), env);
    const session = await handleAuthSession(new Request('https://api.test/api/auth/me'), env);
    const logout = await handleLogout(new Request('https://api.test/api/auth/logout'), env);

    await expect(readJson(providers)).resolves.toEqual([{ key: 'kakao' }]);
    await expect(readJson(session)).resolves.toEqual(expect.objectContaining({ isAuthenticated: true, user: sessionUser }));
    await expect(readJson(logout)).resolves.toEqual(expect.objectContaining({ isAuthenticated: false, user: null }));
    expect(logout.headers.get('set-cookie')).toContain('session=');
  });

  it('updates profile nickname, persists profile completion, and reissues the session cookie', async () => {
    vi.spyOn(Date.prototype, 'toISOString').mockReturnValue('2026-05-14T01:00:00Z');
    const response = await handleUpdateProfile(new Request('https://api.test/api/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify({ nickname: 'New Nick' }),
    }), env);
    const payload = await readJson(response);

    expect(response.status).toBe(200);
    expect(socialUserMocks.ensureUniqueNickname).toHaveBeenCalledWith(env, 'New Nick', 'user-1');
    expect(supabaseMocks.supabaseRequest).toHaveBeenCalledWith(env, 'user?user_id=eq.user-1', expect.objectContaining({ method: 'PATCH' }));
    expect(sessionMocks.issueSessionCookie).toHaveBeenCalledWith(expect.objectContaining({
      nickname: 'Stored Nick',
      email: 'stored@example.com',
      profileCompletedAt: '2026-05-14T00:00:00Z',
    }), expect.any(Request), env);
    expect(payload).toEqual(expect.objectContaining({ user: expect.objectContaining({ nickname: 'Stored Nick' }) }));
  });

  it('maps profile update auth, validation, duplicate, and missing-secret failures', async () => {
    sessionMocks.requireSessionUser.mockResolvedValueOnce({ response: new Response('unauthorized', { status: 401 }) });
    const unauthorized = await handleUpdateProfile(new Request('https://api.test/api/auth/profile'), env);
    expect(unauthorized.status).toBe(401);

    socialUserMocks.ensureUniqueNickname.mockRejectedValueOnce({ status: 400 });
    const invalid = await handleUpdateProfile(new Request('https://api.test/api/auth/profile', { method: 'PATCH', body: '{}' }), env);
    expect(invalid.status).toBe(400);

    socialUserMocks.ensureUniqueNickname.mockRejectedValueOnce({ status: 409 });
    const duplicate = await handleUpdateProfile(new Request('https://api.test/api/auth/profile', { method: 'PATCH', body: '{}' }), env);
    expect(duplicate.status).toBe(409);

    sessionMocks.issueSessionCookie.mockRejectedValueOnce(new Error('missing secret'));
    sessionMocks.isMissingSigningSecretError.mockReturnValueOnce(true);
    const missingSecret = await handleUpdateProfile(new Request('https://api.test/api/auth/profile', { method: 'PATCH', body: '{}' }), env);
    expect(missingSecret.status).toBe(503);
  });

  it('starts configured social logins and returns 503 for unconfigured or missing-secret providers', async () => {
    vi.spyOn(crypto, 'randomUUID').mockReturnValue('00000000-0000-4000-8000-000000000001');
    const naverResponse = await handleStartNaverLogin(
      new Request('https://api.test/api/auth/naver/start?next=https://front.test/path'),
      env,
      new URL('https://api.test/api/auth/naver/start?next=https://front.test/path'),
    );
    expect(naverResponse.status).toBe(302);
    expect(naverResponse.headers.get('location')).toContain('https://naver.test/login');
    expect(sessionMocks.createOAuthStateCookie).toHaveBeenCalledWith('https://front.test/path', '00000000000040008000000000000001', expect.any(Request), env);

    providerConfigMocks.kakaoConfigured.mockReturnValueOnce(false);
    const unconfigured = await handleStartKakaoLogin(new Request('https://api.test/api/auth/kakao/start'), env, new URL('https://api.test/api/auth/kakao/start'));
    expect(unconfigured.status).toBe(503);

    sessionMocks.createOAuthStateCookie.mockRejectedValueOnce(new Error('missing secret'));
    sessionMocks.isMissingSigningSecretError.mockReturnValueOnce(true);
    const missingSecret = await handleStartNaverLogin(new Request('https://api.test/api/auth/naver/start'), env, new URL('https://api.test/api/auth/naver/start'));
    expect(missingSecret.status).toBe(503);
  });

  it('handles OAuth callback provider errors and state mismatch without exchanging tokens', async () => {
    const providerError = await handleKakaoCallback(
      new Request('https://api.test/api/auth/kakao/callback?error=access_denied&error_description=denied'),
      env,
      new URL('https://api.test/api/auth/kakao/callback?error=access_denied&error_description=denied'),
    );
    expect(providerError.headers.get('location')).toContain('auth=kakao-error');
    expect(providerError.headers.get('location')).toContain('reason=denied');

    const mismatch = await handleNaverCallback(
      new Request('https://api.test/api/auth/naver/callback?code=code&state=wrong'),
      env,
      new URL('https://api.test/api/auth/naver/callback?code=code&state=wrong'),
    );
    expect(mismatch.headers.get('location')).toContain('state-mismatch');
    expect(providerMocks.exchangeNaverCode).not.toHaveBeenCalled();
  });

  it('finishes Naver and Kakao callbacks through token exchange, profile fetch, user upsert, and session issue', async () => {
    const naver = await handleNaverCallback(
      new Request('https://api.test/api/auth/naver/callback?code=code&state=state-1'),
      env,
      new URL('https://api.test/api/auth/naver/callback?code=code&state=state-1'),
    );
    const kakao = await handleKakaoCallback(
      new Request('https://api.test/api/auth/kakao/callback?code=code&state=state-1'),
      env,
      new URL('https://api.test/api/auth/kakao/callback?code=code&state=state-1'),
    );

    expect(naver.status).toBe(302);
    expect(kakao.status).toBe(302);
    expect(providerMocks.exchangeNaverCode).toHaveBeenCalledWith(env, 'code', 'state-1');
    expect(providerMocks.exchangeKakaoCode).toHaveBeenCalledWith(env, 'code');
    expect(providerMocks.fetchNaverProfile).toHaveBeenCalledWith('naver-token');
    expect(providerMocks.fetchKakaoProfile).toHaveBeenCalledWith('kakao-token');
    expect(socialUserMocks.upsertSocialUser).toHaveBeenCalledWith(env, { id: 'naver-id', nickname: 'Naver User' }, 'naver');
    expect(socialUserMocks.upsertSocialUser).toHaveBeenCalledWith(env, { id: 'kakao-id', nickname: 'Kakao User' }, 'kakao');
    expect(naver.headers.get('set-cookie')).toContain('oauth=');
  });

  it('maps callback exchange failures to redirects and missing session secrets to 503', async () => {
    providerMocks.exchangeKakaoCode.mockRejectedValueOnce(new Error('token failed'));
    const failed = await handleKakaoCallback(
      new Request('https://api.test/api/auth/kakao/callback?code=code&state=state-1'),
      env,
      new URL('https://api.test/api/auth/kakao/callback?code=code&state=state-1'),
    );
    expect(failed.status).toBe(302);
    expect(failed.headers.get('location')).toContain('kakao-callback-failed');

    sessionMocks.issueSessionCookie.mockRejectedValueOnce(new Error('missing secret'));
    sessionMocks.isMissingSigningSecretError.mockReturnValueOnce(true);
    const missingSecret = await handleNaverCallback(
      new Request('https://api.test/api/auth/naver/callback?code=code&state=state-1'),
      env,
      new URL('https://api.test/api/auth/naver/callback?code=code&state=state-1'),
    );
    expect(missingSecret.status).toBe(503);
    expect(missingSecret.headers.get('set-cookie')).toContain('oauth=');
  });
});
