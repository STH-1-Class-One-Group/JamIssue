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

  it('validates profile nickname length and duplicate ownership through ensureUniqueNickname', async () => {
    const { ensureUniqueNickname } = await import('../../deploy/api-worker-shell/services/auth/social-user');

    await expect(ensureUniqueNickname(env, ' a ')).rejects.toMatchObject({ status: 400 });

    supabaseMocks.supabaseRequest.mockResolvedValueOnce([{ user_id: 'other-user', nickname: 'Taken' }]);
    await expect(ensureUniqueNickname(env, 'Taken')).rejects.toMatchObject({ status: 409 });

    supabaseMocks.supabaseRequest.mockResolvedValueOnce([{ user_id: 'user-1', nickname: 'Taken' }]);
    await expect(ensureUniqueNickname(env, ' Taken ', 'user-1')).resolves.toBe('Taken');
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
});
