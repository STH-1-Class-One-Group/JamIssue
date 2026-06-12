import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { WorkerEnv } from '../../deploy/api-worker-shell/types';

const env = {
  APP_CORS_ORIGINS: '',
  APP_FRONTEND_URL: 'https://daejeon.jamissue.com',
  APP_SUPABASE_SERVICE_ROLE_KEY: 'service-key',
  APP_SUPABASE_STORAGE_BUCKET: 'review-images',
  APP_SUPABASE_URL: 'https://supabase.test',
} as WorkerEnv;

describe('worker review upload boundary', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  function installUploadMocks(sessionResponse: unknown) {
    vi.doMock('../../deploy/api-worker-shell/services/review-interaction-shared', () => ({
      requireSessionUser: vi.fn(async () => sessionResponse),
    }));
    vi.doMock('../../deploy/api-worker-shell/lib/supabase', () => ({
      getSupabaseKey: vi.fn(() => 'anon-key'),
    }));
  }

  it('rejects upload requests without an image file before touching storage', async () => {
    installUploadMocks({ sessionUser: { id: 'user-1' } });
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const { handleReviewUpload } = await import('../../deploy/api-worker-shell/services/review-upload-handler');
    const request = new Request('https://api.test/api/reviews/upload', {
      method: 'POST',
      body: new FormData(),
    });
    vi.spyOn(request, 'formData').mockResolvedValue(new FormData());

    const response = await handleReviewUpload(request, env, {} as never);

    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('uploads sanitized image objects and returns the public storage URL', async () => {
    installUploadMocks({ sessionUser: { id: 'user/1' } });
    const fetchMock = vi.fn(async () => new Response('', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(Date, 'now').mockReturnValue(1_763_000_000_000);
    const { handleReviewUpload } = await import('../../deploy/api-worker-shell/services/review-upload-handler');
    const formData = new FormData();
    formData.set('file', new File(['image-bytes'], 'my review image.png', { type: 'image/png' }));
    const request = new Request('https://api.test/api/reviews/upload', {
      method: 'POST',
      body: formData,
    });
    vi.spyOn(request, 'formData').mockResolvedValue(formData);

    const response = await handleReviewUpload(request, env, {} as never);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://supabase.test/storage/v1/object/review-images/reviews/user_1/1763000000000-my-review-image.png',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer service-key',
          'content-type': 'image/png',
          'x-upsert': 'true',
        }),
      }),
    );
    expect(payload).toEqual({
      url: 'https://supabase.test/storage/v1/object/public/review-images/reviews/user_1/1763000000000-my-review-image.png',
      fileName: 'my-review-image.png',
      contentType: 'image/png',
    });
  });

  it('rejects unauthorized, non-image, and oversized upload requests before storage upload', async () => {
    installUploadMocks({ response: new Response('unauthorized', { status: 401 }) });
    const { handleReviewUpload } = await import('../../deploy/api-worker-shell/services/review-upload-handler');
    const unauthorized = await handleReviewUpload(new Request('https://api.test/api/reviews/upload'), env, {} as never);
    expect(unauthorized.status).toBe(401);

    vi.resetModules();
    installUploadMocks({ sessionUser: { id: 'user-1' } });
    const upload = await import('../../deploy/api-worker-shell/services/review-upload-handler');
    const textFormData = new FormData();
    textFormData.set('file', new File(['text'], 'note.txt', { type: 'text/plain' }));
    const textRequest = new Request('https://api.test/api/reviews/upload', { method: 'POST', body: textFormData });
    vi.spyOn(textRequest, 'formData').mockResolvedValue(textFormData);
    expect((await upload.handleReviewUpload(textRequest, env, {} as never)).status).toBe(400);

    const largeFormData = new FormData();
    largeFormData.set('file', new File(['large'], 'large.jpg', { type: 'image/jpeg' }));
    const largeRequest = new Request('https://api.test/api/reviews/upload', { method: 'POST', body: largeFormData });
    vi.spyOn(largeRequest, 'formData').mockResolvedValue(largeFormData);
    expect((await upload.handleReviewUpload(largeRequest, { ...env, APP_MAX_UPLOAD_SIZE_BYTES: '1' }, {} as never)).status).toBe(413);
  });

  it('uses fallback storage keys and surfaces storage configuration or upload failures', async () => {
    installUploadMocks({ sessionUser: { id: 'user-1' } });
    const fetchMock = vi.fn(async () => new Response('failed', { status: 503 }));
    vi.stubGlobal('fetch', fetchMock);
    const { handleReviewUpload } = await import('../../deploy/api-worker-shell/services/review-upload-handler');
    const formData = new FormData();
    formData.set('file', new File(['image-bytes'], 'upload.jpg', { type: 'image/jpeg' }));
    const request = new Request('https://api.test/api/reviews/upload', { method: 'POST', body: formData });
    vi.spyOn(request, 'formData').mockResolvedValue(formData);

    await expect(handleReviewUpload(request, { ...env, APP_SUPABASE_SERVICE_ROLE_KEY: '' }, {} as never)).rejects.toThrow('503');
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/storage/v1/object/review-images/reviews/user-1/'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer anon-key',
          'content-type': 'image/jpeg',
        }),
      }),
    );

    await expect(handleReviewUpload(request, { ...env, APP_SUPABASE_URL: '' }, {} as never)).rejects.toThrow();

    vi.resetModules();
    vi.doMock('../../deploy/api-worker-shell/services/review-interaction-shared', () => ({
      requireSessionUser: vi.fn(async () => ({ sessionUser: { id: 'user-1' } })),
    }));
    vi.doMock('../../deploy/api-worker-shell/lib/supabase', () => ({
      getSupabaseKey: vi.fn(() => ''),
    }));
    const noKeyUpload = await import('../../deploy/api-worker-shell/services/review-upload-handler');
    await expect(noKeyUpload.handleReviewUpload(request, {
      ...env,
      APP_SUPABASE_SERVICE_ROLE_KEY: '',
    }, {} as never)).rejects.toThrow();
  });
});

describe('worker social user persistence boundary', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
  });

  function installSupabaseMock(responses: unknown[]) {
    const supabaseRequest = vi.fn(async () => responses.shift() ?? []);
    vi.doMock('../../deploy/api-worker-shell/lib/supabase', () => ({
      encodeFilterValue: (value: unknown) => encodeURIComponent(String(value)),
      supabaseRequest,
    }));
    return supabaseRequest;
  }

  it('rejects short or duplicate nicknames through the social user boundary', async () => {
    installSupabaseMock([]);
    const { ensureUniqueNickname } = await import('../../deploy/api-worker-shell/services/auth/social-user');

    await expect(ensureUniqueNickname(env, 'a')).rejects.toMatchObject({ status: 400 });

    vi.resetModules();
    const supabaseRequest = installSupabaseMock([[{ user_id: 'other-user', nickname: 'Taken' }]]);
    const socialUser = await import('../../deploy/api-worker-shell/services/auth/social-user');

    await expect(socialUser.ensureUniqueNickname(env, 'Taken')).rejects.toMatchObject({ status: 409 });
    expect(supabaseRequest).toHaveBeenCalledWith(env, 'user?select=user_id,nickname');
  });

  it('updates existing social identities and preserves the stored profile completion state', async () => {
    const supabaseRequest = installSupabaseMock([
      [{ identity_id: 'identity-1', user_id: 'user-1', email: 'old@example.com', profile_image: null }],
      [],
      [],
      [{ user_id: 'user-1', nickname: 'Known User', email: 'new@example.com', provider: 'kakao', profile_completed_at: '2026-05-14T00:00:00Z' }],
    ]);
    const { upsertSocialUser } = await import('../../deploy/api-worker-shell/services/auth/social-user');

    const user = await upsertSocialUser(
      { ...env, APP_ADMIN_USER_IDS: 'user-1' },
      { id: 'provider-1', email: 'new@example.com', nickname: 'Social Nick', profile_image: 'https://image.test/a.png' },
      'kakao',
    );

    expect(user).toMatchObject({
      id: 'user-1',
      nickname: 'Known User',
      email: 'new@example.com',
      provider: 'kakao',
      profileImage: 'https://image.test/a.png',
      isAdmin: true,
      profileCompletedAt: '2026-05-14T00:00:00Z',
    });
    expect(supabaseRequest.mock.calls.map(([, query]) => query)).toEqual([
      expect.stringContaining('user_identity?select=identity_id'),
      expect.stringContaining('user?user_id=eq.user-1'),
      expect.stringContaining('user_identity?identity_id=eq.identity-1'),
      expect.stringContaining('user?select=user_id,nickname,email,provider,profile_completed_at'),
    ]);
  });

  it('creates new social users with a unique nickname and identity row', async () => {
    const supabaseRequest = installSupabaseMock([[], [], [], []]);
    const randomUuidSpy = vi.spyOn(crypto, 'randomUUID').mockReturnValue('00000000-0000-4000-8000-000000000001');
    const { upsertSocialUser } = await import('../../deploy/api-worker-shell/services/auth/social-user');

    const user = await upsertSocialUser(
      env,
      { id: 'provider-new', email: null, name: 'New User', profile_image: null },
      'naver',
    );

    expect(user).toMatchObject({
      id: '00000000-0000-4000-8000-000000000001',
      nickname: 'New User',
      provider: 'naver',
      profileCompletedAt: null,
    });
    expect(randomUuidSpy).toHaveBeenCalled();
    expect(supabaseRequest.mock.calls.map(([, query, options]) => ({ query, method: options?.method }))).toEqual([
      { query: expect.stringContaining('user_identity?select=identity_id'), method: undefined },
      { query: 'user?select=user_id,nickname', method: undefined },
      { query: 'user', method: 'POST' },
      { query: 'user_identity', method: 'POST' },
    ]);
  });
});

describe('worker admin repository boundary', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  function installAdminSupabaseMock(responses: unknown[]) {
    const supabaseRequest = vi.fn(async () => responses.shift() ?? []);
    vi.doMock('../../deploy/api-worker-shell/lib/supabase', () => ({
      encodeFilterValue: (value: unknown) => encodeURIComponent(String(value)),
      getSupabaseKey: vi.fn(() => 'anon-key'),
      supabaseRequest,
    }));
    return supabaseRequest;
  }

  it('counts Supabase tables through HEAD requests and parses content-range totals', async () => {
    installAdminSupabaseMock([]);
    const fetchMock = vi.fn(async () => new Response(null, {
      status: 200,
      headers: { 'content-range': '0-0/42' },
    }));
    vi.stubGlobal('fetch', fetchMock);
    const { supabaseCount } = await import('../../deploy/api-worker-shell/services/admin-domain/repository');

    await expect(supabaseCount(env, 'feed')).resolves.toBe(42);
    expect(fetchMock).toHaveBeenCalledWith('https://supabase.test/rest/v1/feed?select=*', {
      method: 'HEAD',
      headers: { apikey: 'anon-key', Authorization: 'Bearer anon-key', Prefer: 'count=exact' },
    });
  });

  it('loads summary rows and place review rows behind admin-domain repository functions', async () => {
    const supabaseRequest = installAdminSupabaseMock([
      [{ position_id: 101, slug: 'place-1' }],
      [{ position_id: 101 }],
      [{ feed_id: 7 }],
    ]);
    vi.stubGlobal('fetch', vi.fn(async () => new Response(null, {
      status: 200,
      headers: { 'content-range': '0-0/3' },
    })));
    const {
      loadAdminSummaryRows,
      loadPlaceReviewRows,
      updateAdminPlaceVisibility,
      loadPublicDataSource,
    } = await import('../../deploy/api-worker-shell/services/admin-domain/repository');

    const summary = await loadAdminSummaryRows(env);
    const updated = await updateAdminPlaceVisibility(env, 'place-1', { is_active: false });
    const reviewRows = await loadPlaceReviewRows(env, 101);
    await loadPublicDataSource(env, 'daejeon-events');

    expect(summary).toMatchObject({
      userCount: 3,
      placeCount: 3,
      reviewCount: 3,
      commentCount: 3,
      stampCount: 3,
      placeRows: [{ position_id: 101, slug: 'place-1' }],
      feedRows: [{ position_id: 101 }],
    });
    expect(updated).toEqual({ feed_id: 7 });
    expect(reviewRows).toEqual([]);
    expect(supabaseRequest.mock.calls.map(([, query]) => query)).toEqual([
      expect.stringContaining('map?select=position_id'),
      'feed?select=position_id',
      'map?slug=eq.place-1',
      'feed?select=feed_id&position_id=eq.101',
      expect.stringContaining('public_data_source?select=name,last_imported_at'),
    ]);
  });
});
