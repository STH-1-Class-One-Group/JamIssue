import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { WorkerEnv } from '../../deploy/api-worker-shell/types';

const supabaseMocks = vi.hoisted(() => ({
  supabaseRequest: vi.fn(),
}));

vi.mock('../../deploy/api-worker-shell/lib/supabase', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../deploy/api-worker-shell/lib/supabase')>();
  return {
    ...actual,
    supabaseRequest: supabaseMocks.supabaseRequest,
  };
});

const env = {
  APP_ADMIN_USER_IDS: 'user-admin',
} as WorkerEnv;

describe('worker auth social-user boundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it('finds nicknames case-insensitively and ignores the excluded user id', async () => {
    const { findUserByNickname } = await import('../../deploy/api-worker-shell/services/auth/social-user');
    supabaseMocks.supabaseRequest.mockResolvedValue([
      { user_id: 'user-1', nickname: 'JamUser' },
      { user_id: 'user-2', nickname: 'Other' },
    ]);

    await expect(findUserByNickname(env, '   ')).resolves.toBeNull();
    expect(supabaseMocks.supabaseRequest).not.toHaveBeenCalled();

    await expect(findUserByNickname(env, 'jamuser')).resolves.toEqual({ user_id: 'user-1', nickname: 'JamUser' });
    await expect(findUserByNickname(env, 'jamuser', 'user-1')).resolves.toBeNull();
  });

  it('returns null for missing user rows and empty nickname query responses', async () => {
    const { findUserByNickname, readUserRow } = await import('../../deploy/api-worker-shell/services/auth/social-user');

    supabaseMocks.supabaseRequest.mockResolvedValueOnce(undefined);
    await expect(findUserByNickname(env, 'missing')).resolves.toBeNull();

    supabaseMocks.supabaseRequest.mockResolvedValueOnce([]);
    await expect(readUserRow(env, 'missing-user')).resolves.toBeNull();
  });

  it('validates profile nickname length and duplicate ownership through ensureUniqueNickname', async () => {
    const { ensureUniqueNickname } = await import('../../deploy/api-worker-shell/services/auth/social-user');

    await expect(ensureUniqueNickname(env, ' a ')).rejects.toMatchObject({ status: 400 });

    supabaseMocks.supabaseRequest.mockResolvedValueOnce([{ user_id: 'other-user', nickname: 'Taken' }]);
    await expect(ensureUniqueNickname(env, 'Taken')).rejects.toMatchObject({ status: 409 });

    supabaseMocks.supabaseRequest.mockResolvedValueOnce([{ user_id: 'user-1', nickname: 'Taken' }]);
    await expect(ensureUniqueNickname(env, ' Taken ', 'user-1')).resolves.toBe('Taken');

    supabaseMocks.supabaseRequest.mockResolvedValueOnce([]);
    await expect(ensureUniqueNickname(env, ' Fresh ')).resolves.toBe('Fresh');
  });

  it('updates existing social identities and preserves stored profile completion fields', async () => {
    const { upsertSocialUser } = await import('../../deploy/api-worker-shell/services/auth/social-user');
    supabaseMocks.supabaseRequest
      .mockResolvedValueOnce([{ identity_id: 7, user_id: 'user-admin', email: 'old@example.com', profile_image: null }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{
        user_id: 'user-admin',
        nickname: 'Stored Admin',
        email: 'stored@example.com',
        provider: 'kakao',
        profile_completed_at: '2026-05-14T00:00:00Z',
      }]);

    const sessionUser = await upsertSocialUser(env, {
      id: 'provider-1',
      email: 'new@example.com',
      nickname: 'Provider Nick',
      profile_image: 'https://image.test/profile.png',
    }, 'kakao');

    expect(sessionUser).toEqual({
      id: 'user-admin',
      nickname: 'Stored Admin',
      email: 'stored@example.com',
      provider: 'kakao',
      profileImage: 'https://image.test/profile.png',
      isAdmin: true,
      profileCompletedAt: '2026-05-14T00:00:00Z',
    });
    expect(supabaseMocks.supabaseRequest).toHaveBeenCalledWith(env, 'user?user_id=eq.user-admin', expect.objectContaining({ method: 'PATCH' }));
    expect(supabaseMocks.supabaseRequest).toHaveBeenCalledWith(env, 'user_identity?identity_id=eq.7', expect.objectContaining({ method: 'PATCH' }));
  });

  it('uses provider profile fallback when an existing identity has no user row', async () => {
    const { upsertSocialUser } = await import('../../deploy/api-worker-shell/services/auth/social-user');
    supabaseMocks.supabaseRequest
      .mockResolvedValueOnce([{ identity_id: 'identity-1', user_id: 'user-1', email: null, profile_image: null }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const sessionUser = await upsertSocialUser(env, {
      id: 'provider-1',
      email: 'profile@example.com',
      name: 'Profile Name',
      nickname: null,
      profile_image: null,
    }, 'kakao');

    expect(sessionUser).toMatchObject({
      id: 'user-1',
      nickname: 'Profile Name',
      email: 'profile@example.com',
      provider: 'kakao',
      profileImage: null,
      isAdmin: false,
      profileCompletedAt: null,
    });
  });

  it('falls back to identity email and provider nickname when existing identity profile fields are sparse', async () => {
    const { upsertSocialUser } = await import('../../deploy/api-worker-shell/services/auth/social-user');
    supabaseMocks.supabaseRequest
      .mockResolvedValueOnce([{ identity_id: 'identity-2', user_id: 'user-2', email: 'identity@example.com', profile_image: 'https://image.test/identity.png' }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ user_id: 'user-2', nickname: null, email: null, provider: 'naver', profile_completed_at: null }]);

    const sessionUser = await upsertSocialUser(env, {
      id: 'provider-identity',
      email: null,
      name: null,
      nickname: 'Provider Nick',
      profile_image: null,
    }, 'naver');

    expect(sessionUser).toMatchObject({
      id: 'user-2',
      nickname: 'Provider Nick',
      email: null,
      provider: 'naver',
      profileImage: null,
      profileCompletedAt: null,
    });
  });

  it('creates new social users with fallback names and suffixes duplicate nicknames', async () => {
    vi.spyOn(crypto, 'randomUUID').mockReturnValue('00000000-0000-4000-8000-000000000123');
    const { upsertSocialUser } = await import('../../deploy/api-worker-shell/services/auth/social-user');
    supabaseMocks.supabaseRequest
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ user_id: 'existing-user', nickname: '이름 없음' }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const sessionUser = await upsertSocialUser(env, {
      id: 'provider-2',
      email: null,
      name: '',
      nickname: '',
      profile_image: null,
    }, 'naver');

    expect(sessionUser).toMatchObject({
      id: '00000000-0000-4000-8000-000000000123',
      nickname: expect.stringMatching(/2$/),
      email: null,
      provider: 'naver',
      profileImage: null,
      isAdmin: false,
      profileCompletedAt: null,
    });
    expect(supabaseMocks.supabaseRequest).toHaveBeenCalledWith(env, 'user', expect.objectContaining({ method: 'POST' }));
    expect(supabaseMocks.supabaseRequest).toHaveBeenCalledWith(env, 'user_identity', expect.objectContaining({ method: 'POST' }));
  });

  it('creates new social users without suffixing unique provider names', async () => {
    vi.spyOn(crypto, 'randomUUID').mockReturnValue('00000000-0000-4000-8000-000000000456');
    const { upsertSocialUser } = await import('../../deploy/api-worker-shell/services/auth/social-user');
    supabaseMocks.supabaseRequest
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const sessionUser = await upsertSocialUser(env, {
      id: 'provider-3',
      email: 'unique@example.com',
      name: 'Provider Name',
      nickname: 'Provider Nick',
      profile_image: 'https://image.test/unique.png',
    }, 'kakao');

    expect(sessionUser).toMatchObject({
      id: '00000000-0000-4000-8000-000000000456',
      nickname: 'Provider Nick',
      email: 'unique@example.com',
      provider: 'kakao',
      profileImage: 'https://image.test/unique.png',
      isAdmin: false,
      profileCompletedAt: null,
    });
  });

  it('fails when every generated social nickname candidate is already taken', async () => {
    const { upsertSocialUser } = await import('../../deploy/api-worker-shell/services/auth/social-user');
    let nicknameLookupCount = 0;
    supabaseMocks.supabaseRequest.mockImplementation(async (_env, query: string) => {
      if (String(query).startsWith('user_identity?')) {
        return [];
      }
      if (String(query) === 'user?select=user_id,nickname') {
        const nickname = nicknameLookupCount === 0 ? 'Taken' : `Taken${nicknameLookupCount + 1}`;
        nicknameLookupCount += 1;
        return [{ user_id: `existing-${nicknameLookupCount}`, nickname }];
      }
      return [];
    });

    await expect(upsertSocialUser(env, {
      id: 'provider-exhausted',
      email: null,
      name: null,
      nickname: 'Taken',
      profile_image: null,
    }, 'kakao')).rejects.toThrow(/\S+/u);
  });
});
