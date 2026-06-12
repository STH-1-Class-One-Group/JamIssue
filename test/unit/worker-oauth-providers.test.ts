import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { WorkerEnv } from '../../deploy/api-worker-shell/types';
import {
  buildKakaoLoginUrl,
  exchangeKakaoCode,
  fetchKakaoProfile,
} from '../../deploy/api-worker-shell/services/auth/kakao-provider';
import {
  buildNaverLoginUrl,
  exchangeNaverCode,
  fetchNaverProfile,
} from '../../deploy/api-worker-shell/services/auth/naver-provider';

const env = {
  APP_KAKAO_LOGIN_CALLBACK_URL: 'https://api.test/api/auth/kakao/callback',
  APP_KAKAO_LOGIN_CLIENT_ID: 'kakao-client',
  APP_KAKAO_LOGIN_CLIENT_SECRET: 'kakao-secret',
  APP_NAVER_LOGIN_CALLBACK_URL: 'https://api.test/api/auth/naver/callback',
  APP_NAVER_LOGIN_CLIENT_ID: 'naver-client',
  APP_NAVER_LOGIN_CLIENT_SECRET: 'naver-secret',
} as WorkerEnv;

describe('worker OAuth provider adapters', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('builds provider login URLs with the configured REST callback contract', () => {
    const kakaoUrl = new URL(buildKakaoLoginUrl(env, 'state-1'));
    const naverUrl = new URL(buildNaverLoginUrl(env, 'state-2'));
    const emptyKakaoUrl = new URL(buildKakaoLoginUrl({}, 'state-3'));
    const emptyNaverUrl = new URL(buildNaverLoginUrl({}, 'state-4'));

    expect(kakaoUrl.origin + kakaoUrl.pathname).toBe('https://kauth.kakao.com/oauth/authorize');
    expect(kakaoUrl.searchParams.get('client_id')).toBe('kakao-client');
    expect(kakaoUrl.searchParams.get('redirect_uri')).toBe('https://api.test/api/auth/kakao/callback');
    expect(kakaoUrl.searchParams.get('state')).toBe('state-1');
    expect(naverUrl.origin + naverUrl.pathname).toBe('https://nid.naver.com/oauth2.0/authorize');
    expect(naverUrl.searchParams.get('client_id')).toBe('naver-client');
    expect(naverUrl.searchParams.get('redirect_uri')).toBe('https://api.test/api/auth/naver/callback');
    expect(naverUrl.searchParams.get('state')).toBe('state-2');
    expect(emptyKakaoUrl.searchParams.get('client_id')).toBe('');
    expect(emptyKakaoUrl.searchParams.get('redirect_uri')).toBe('');
    expect(emptyNaverUrl.searchParams.get('client_id')).toBe('');
    expect(emptyNaverUrl.searchParams.get('redirect_uri')).toBe('');
  });

  it('exchanges Kakao codes and maps Kakao profile payloads', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ access_token: 'kakao-token', token_type: 'bearer' }))
      .mockResolvedValueOnce(Response.json({
        id: 12345,
        kakao_account: {
          email: 'kakao@example.com',
          profile: { nickname: 'Kakao User', profile_image_url: 'https://image.test/kakao.png' },
        },
      }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(exchangeKakaoCode(env, 'code-1')).resolves.toMatchObject({ access_token: 'kakao-token' });
    await expect(fetchKakaoProfile('kakao-token')).resolves.toEqual({
      id: '12345',
      nickname: 'Kakao User',
      email: 'kakao@example.com',
      profile_image: 'https://image.test/kakao.png',
    });
    expect(fetchMock.mock.calls[0][0]).toBe('https://kauth.kakao.com/oauth/token');
    expect(String(fetchMock.mock.calls[0][1]?.body)).toContain('client_secret=kakao-secret');
    expect(fetchMock.mock.calls[1][1]).toMatchObject({
      headers: expect.objectContaining({ Authorization: 'Bearer kakao-token' }),
    });
  });

  it('rejects Kakao token and profile failures with provider payload messages', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(Response.json({ error: 'bad', error_description: 'token failed' }, { status: 400 }))
      .mockResolvedValueOnce(Response.json({ msg: 'profile failed' }, { status: 401 })));

    await expect(exchangeKakaoCode(env, 'bad-code')).rejects.toThrow('token failed');
    await expect(fetchKakaoProfile('bad-token')).rejects.toThrow('profile failed');
  });

  it('uses Kakao fallback token and profile error messages and maps property profile fields', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ message: 'token message' }, { status: 400 }))
      .mockResolvedValueOnce(Response.json({ access_token: 'kakao-token' }))
      .mockResolvedValueOnce(Response.json({
        id: 'kakao-id',
        properties: {
          nickname: 'Property Nick',
          profile_image: 'https://image.test/property.png',
        },
      }))
      .mockResolvedValueOnce(Response.json({}, { status: 401 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(exchangeKakaoCode(env, 'bad-code')).rejects.toThrow('token message');
    await expect(exchangeKakaoCode(env, 'code')).resolves.toEqual({ access_token: 'kakao-token' });
    await expect(fetchKakaoProfile('kakao-token')).resolves.toEqual({
      id: 'kakao-id',
      nickname: 'Property Nick',
      email: null,
      profile_image: 'https://image.test/property.png',
    });
    await expect(fetchKakaoProfile('bad-profile')).rejects.toThrow(/\S+/u);
  });

  it('uses Kakao default failures and empty profile fallbacks when provider payloads omit optional fields', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json({}, { status: 200 }))
      .mockResolvedValueOnce(Response.json({ id: 777 }, { status: 200 }))
      .mockResolvedValueOnce(Response.json({}, { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(exchangeKakaoCode(env, 'missing-token')).rejects.toThrow(/\S+/u);
    await expect(fetchKakaoProfile('profile-token')).resolves.toEqual({
      id: '777',
      nickname: '',
      email: null,
      profile_image: null,
    });
    await expect(fetchKakaoProfile('missing-id')).rejects.toThrow(/\S+/u);
  });

  it('exchanges Naver codes and maps Naver profile payloads', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ access_token: 'naver-token', token_type: 'bearer' }))
      .mockResolvedValueOnce(Response.json({
        resultcode: '00',
        response: {
          id: 'naver-id',
          email: 'naver@example.com',
          name: 'Naver Name',
          nickname: 'Naver Nick',
          profile_image: 'https://image.test/naver.png',
        },
      }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(exchangeNaverCode(env, 'code-2', 'state-2')).resolves.toMatchObject({ access_token: 'naver-token' });
    await expect(fetchNaverProfile('naver-token')).resolves.toEqual({
      id: 'naver-id',
      email: 'naver@example.com',
      name: 'Naver Name',
      nickname: 'Naver Nick',
      profile_image: 'https://image.test/naver.png',
    });
    expect(String(fetchMock.mock.calls[0][0])).toContain('client_secret=naver-secret');
    expect(fetchMock.mock.calls[1][1]).toMatchObject({
      headers: expect.objectContaining({ Authorization: 'Bearer naver-token' }),
    });
  });

  it('rejects Naver token and profile failures with provider payload messages', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(Response.json({ error: 'bad', error_description: 'token failed' }, { status: 400 }))
      .mockResolvedValueOnce(Response.json({ resultcode: '99', message: 'profile failed' }, { status: 401 })));

    await expect(exchangeNaverCode(env, 'bad-code', 'state')).rejects.toThrow('token failed');
    await expect(fetchNaverProfile('bad-token')).rejects.toThrow('profile failed');
  });

  it('uses Naver fallback token messages and normalizes non-string profile fields', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ message: 'token message' }, { status: 400 }))
      .mockResolvedValueOnce(Response.json({ access_token: 'naver-token' }))
      .mockResolvedValueOnce(Response.json({
        resultcode: '00',
        response: {
          id: 123,
          email: 456,
          name: null,
          nickname: ['bad'],
          profile_image: {},
        },
      }))
      .mockResolvedValueOnce(Response.json({ resultcode: '99' }, { status: 401 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(exchangeNaverCode(env, 'bad-code', 'state')).rejects.toThrow('token message');
    await expect(exchangeNaverCode(env, 'code', 'state')).resolves.toEqual({ access_token: 'naver-token' });
    await expect(fetchNaverProfile('naver-token')).resolves.toEqual({
      id: '123',
      email: null,
      name: null,
      nickname: null,
      profile_image: null,
    });
    await expect(fetchNaverProfile('bad-profile')).rejects.toThrow(/\S+/u);
  });

  it('uses Naver default failures and empty id fallback when provider payloads omit optional fields', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json({}, { status: 200 }))
      .mockResolvedValueOnce(Response.json({ resultcode: '00', response: {} }, { status: 200 }))
      .mockResolvedValueOnce(Response.json({ resultcode: '00' }, { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(exchangeNaverCode(env, 'missing-token', 'state')).rejects.toThrow(/\S+/u);
    await expect(fetchNaverProfile('profile-token')).resolves.toEqual({
      id: '',
      email: null,
      name: null,
      nickname: null,
      profile_image: null,
    });
    await expect(fetchNaverProfile('missing-response')).rejects.toThrow(/\S+/u);
  });
});
