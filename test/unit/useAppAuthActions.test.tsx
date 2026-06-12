import { renderHook, act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAppAuthActions } from '../../src/hooks/useAppAuthActions';
import type { MyPageResponse, SessionUser } from '../../src/types';

const authClientMocks = vi.hoisted(() => ({
  getProviderLoginUrl: vi.fn(),
  logout: vi.fn(),
  updateProfile: vi.fn(),
}));

const routeMocks = vi.hoisted(() => ({
  getLoginReturnUrl: vi.fn(),
}));

const authStoreState = vi.hoisted(() => ({
  setSessionUser: vi.fn(),
  setProviders: vi.fn(),
}));

const pageRuntimeState = vi.hoisted(() => ({
  setIsLoggingOut: vi.fn(),
  setProfileSaving: vi.fn(),
  setProfileError: vi.fn(),
}));

const shellRuntimeState = vi.hoisted(() => ({
  setNotice: vi.fn(),
}));

vi.mock('../../src/api/authClient', () => ({
  getProviderLoginUrl: authClientMocks.getProviderLoginUrl,
  logout: authClientMocks.logout,
  updateProfile: authClientMocks.updateProfile,
}));

vi.mock('../../src/hooks/app-route/useAppRouteState', () => ({
  getLoginReturnUrl: routeMocks.getLoginReturnUrl,
}));

vi.mock('../../src/store/auth-store', () => ({
  useAuthStore: (selector: (state: typeof authStoreState) => unknown) => selector(authStoreState),
}));

vi.mock('../../src/store/app-page-runtime-store', () => ({
  useAppPageRuntimeStore: (selector: (state: typeof pageRuntimeState) => unknown) => selector(pageRuntimeState),
}));

vi.mock('../../src/store/app-shell-runtime-store', () => ({
  useAppShellRuntimeStore: (selector: (state: typeof shellRuntimeState) => unknown) => selector(shellRuntimeState),
}));

const user: SessionUser = {
  id: 'user-1',
  nickname: 'User',
  email: null,
  provider: 'kakao',
  profileImage: null,
  isAdmin: false,
  profileCompletedAt: null,
};

function createMyPage(): MyPageResponse {
  return {
    user,
    stats: {},
    reviews: [],
    comments: [],
    notifications: [],
    unreadNotificationCount: 0,
    stampLogs: [],
    travelSessions: [],
    visitedPlaces: [],
    unvisitedPlaces: [],
    collectedPlaces: [],
    routes: [],
  } as MyPageResponse;
}

describe('useAppAuthActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authClientMocks.getProviderLoginUrl.mockReturnValue('https://auth.test/login');
    authClientMocks.updateProfile.mockResolvedValue({ user, providers: [], isAuthenticated: true });
    authClientMocks.logout.mockResolvedValue({ user: null, providers: [{ key: 'kakao' }], isAuthenticated: false });
    routeMocks.getLoginReturnUrl.mockReturnValue('https://front.test/return');
    vi.stubGlobal('location', { assign: vi.fn() });
  });

  it('starts provider login with the current return URL', () => {
    const { result } = renderHook(() => useAppAuthActions({
      setMyPage: vi.fn(),
      formatErrorMessage: () => 'formatted error',
    }));

    result.current.startProviderLogin('kakao');

    expect(authClientMocks.getProviderLoginUrl).toHaveBeenCalledWith('kakao', 'https://front.test/return');
    expect(window.location.assign).toHaveBeenCalledWith('https://auth.test/login');
  });

  it('rejects invalid profile nicknames before calling the API', async () => {
    const { result } = renderHook(() => useAppAuthActions({
      setMyPage: vi.fn(),
      formatErrorMessage: () => 'formatted error',
    }));

    await act(async () => {
      await result.current.handleUpdateProfile('a');
    });

    expect(pageRuntimeState.setProfileError).toHaveBeenCalled();
    expect(authClientMocks.updateProfile).not.toHaveBeenCalled();
  });

  it('updates profile state and patches an existing my-page user', async () => {
    const setMyPage = vi.fn((updater: (current: MyPageResponse | null) => MyPageResponse | null) => updater(createMyPage()));
    const { result } = renderHook(() => useAppAuthActions({
      setMyPage,
      formatErrorMessage: () => 'formatted error',
    }));

    await act(async () => {
      await result.current.handleUpdateProfile('New Nick');
    });

    expect(pageRuntimeState.setProfileSaving).toHaveBeenNthCalledWith(1, true);
    expect(authClientMocks.updateProfile).toHaveBeenCalledWith({ nickname: 'New Nick' });
    expect(authStoreState.setSessionUser).toHaveBeenCalledWith(user);
    expect(setMyPage).toHaveBeenCalled();
    expect(shellRuntimeState.setNotice).toHaveBeenCalled();
    expect(pageRuntimeState.setProfileSaving).toHaveBeenLastCalledWith(false);
  });

  it('reports profile update and logout failures', async () => {
    authClientMocks.updateProfile.mockRejectedValueOnce(new Error('profile failed'));
    authClientMocks.logout.mockRejectedValueOnce(new Error('logout failed'));
    const { result } = renderHook(() => useAppAuthActions({
      setMyPage: vi.fn(),
      formatErrorMessage: (error) => error instanceof Error ? error.message : 'formatted error',
    }));

    await act(async () => {
      await result.current.handleUpdateProfile('Valid Nick');
    });
    await act(async () => {
      await result.current.handleLogout();
    });

    expect(pageRuntimeState.setProfileError).toHaveBeenCalledWith('profile failed');
    expect(shellRuntimeState.setNotice).toHaveBeenCalledWith('logout failed');
    expect(pageRuntimeState.setProfileSaving).toHaveBeenLastCalledWith(false);
    expect(pageRuntimeState.setIsLoggingOut).toHaveBeenLastCalledWith(false);
  });

  it('clears auth state on logout success', async () => {
    const setMyPage = vi.fn();
    const { result } = renderHook(() => useAppAuthActions({
      setMyPage,
      formatErrorMessage: () => 'formatted error',
    }));

    await act(async () => {
      await result.current.handleLogout();
    });

    expect(pageRuntimeState.setIsLoggingOut).toHaveBeenNthCalledWith(1, true);
    expect(authStoreState.setSessionUser).toHaveBeenCalledWith(null);
    expect(authStoreState.setProviders).toHaveBeenCalledWith([{ key: 'kakao' }]);
    expect(setMyPage).toHaveBeenCalledWith(null);
    expect(pageRuntimeState.setIsLoggingOut).toHaveBeenLastCalledWith(false);
  });
});
