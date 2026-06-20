import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Avatar } from '../../src/components/Avatar';
import { deleteProfileAvatar, updateProfile, uploadProfileAvatar } from '../../src/api/authClient';
import type { AuthSessionResponse } from '../../src/types/auth';

vi.mock('../../src/lib/profileAvatarUpload', () => ({
  prepareProfileAvatarUpload: vi.fn(async (_file: File) =>
    new File([new Uint8Array([1, 2, 3])], 'avatar.webp', { type: 'image/webp' }),
  ),
}));

const authResponse: AuthSessionResponse = {
  isAuthenticated: true,
  providers: [],
  user: {
    id: 'user-1',
    nickname: '대전러',
    email: null,
    provider: 'kakao',
    linkedProviders: ['kakao'],
    profileImage: 'https://cdn.example.test/avatar.webp',
    isAdmin: false,
    profileCompletedAt: '2026-06-20T00:00:00.000Z',
  },
};

beforeEach(() => {
  vi.restoreAllMocks();
  window.__JAMISSUE_CONFIG__ = {
    apiBaseUrl: 'https://api.example.test',
  };
});

describe('profile avatar API contract', () => {
  it('uploads preprocessed avatar with the file form-data field', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ auth: authResponse }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await uploadProfileAvatar(new File(['raw'], 'raw.png', { type: 'image/png' }));

    expect(result.user?.profileImage).toBe('https://cdn.example.test/avatar.webp');
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.test/api/me/avatar',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        body: expect.any(FormData),
      }),
    );
    const body = fetchMock.mock.calls[0][1].body as FormData;
    expect(body.get('file')).toBeInstanceOf(File);
    expect((body.get('file') as File).name).toBe('avatar.webp');
  });

  it('deletes the current avatar through the dedicated endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(authResponse), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await deleteProfileAvatar();

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.test/api/me/avatar',
      expect.objectContaining({ method: 'DELETE', credentials: 'include' }),
    );
  });

  it('keeps profile updates nickname-only and never sends avatarUrl fields', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(authResponse), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await updateProfile({ nickname: '새닉네임' });

    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string) as Record<string, unknown>;
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.test/api/auth/profile',
      expect.objectContaining({ method: 'PATCH' }),
    );
    expect(body).toEqual({ nickname: '새닉네임' });
    expect(body).not.toHaveProperty('avatarUrl');
    expect(body).not.toHaveProperty('avatar_url');
  });
});

describe('Avatar', () => {
  it('falls back to an initial when no image is available', () => {
    render(<Avatar src={null} name="대전러" />);

    expect(screen.getByLabelText('대전러 프로필 이미지')).toHaveTextContent('대');
  });

  it('falls back after an image load error', () => {
    const { container } = render(<Avatar src="https://cdn.example.test/avatar.webp" name="JamIssue" />);

    const image = container.querySelector('img');
    expect(image).not.toBeNull();
    fireEvent.error(image);

    expect(screen.getByLabelText('JamIssue 프로필 이미지')).toHaveTextContent('J');
  });
});
