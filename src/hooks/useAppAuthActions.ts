import { deleteProfileAvatar, getProviderLinkUrl, getProviderLoginUrl, logout, updateProfile, uploadProfileAvatar } from '../api/authClient';
import { getLoginReturnUrl } from './app-route/useAppRouteState';
import type { Dispatch, SetStateAction } from 'react';
import { useAuthStore } from '../store/auth-store';
import { useAppPageRuntimeStore } from '../store/app-page-runtime-store';
import { useAppShellRuntimeStore } from '../store/app-shell-runtime-store';
import type { AuthProvider, AuthSessionResponse } from '../types/auth';
import type { MyPageResponse } from '../types/my-page';

type SetState<T> = Dispatch<SetStateAction<T>>;

interface UseAppAuthActionsParams {
  setMyPage: SetState<MyPageResponse | null>;
  formatErrorMessage: (error: unknown) => string;
}

export function useAppAuthActions({
  setMyPage,
  formatErrorMessage,
}: UseAppAuthActionsParams) {
  const setSessionUser = useAuthStore((state) => state.setSessionUser);
  const setProviders = useAuthStore((state) => state.setProviders);
  const setNotice = useAppShellRuntimeStore((state) => state.setNotice);
  const setIsLoggingOut = useAppPageRuntimeStore((state) => state.setIsLoggingOut);
  const setProfileSaving = useAppPageRuntimeStore((state) => state.setProfileSaving);
  const setProfileError = useAppPageRuntimeStore((state) => state.setProfileError);

  function startProviderLogin(provider: AuthProvider) {
    const loginUrl = getProviderLoginUrl(provider, getLoginReturnUrl());
    if (loginUrl) {
      window.location.assign(loginUrl);
    }
  }

  function startProviderLink(provider: AuthProvider) {
    const linkUrl = getProviderLinkUrl(provider, getLoginReturnUrl());
    if (linkUrl) {
      window.location.assign(linkUrl);
    }
  }

  function applyAuthResponse(auth: AuthSessionResponse) {
    const nextUser = auth.user;
    setSessionUser(nextUser);
    setProviders(auth.providers);
    if (nextUser) {
      setMyPage((current) => (current ? { ...current, user: nextUser } : current));
    }
  }

  async function handleUpdateProfile(nextNickname: string) {
    if (!nextNickname || nextNickname.length < 2) {
      setProfileError('닉네임은 두 글자 이상으로 입력해 주세요.');
      return;
    }

    setProfileSaving(true);
    setProfileError(null);
    try {
      const auth = await updateProfile({ nickname: nextNickname });
      applyAuthResponse(auth);
      setNotice('닉네임을 저장했어요.');
    } catch (error) {
      setProfileError(formatErrorMessage(error));
    } finally {
      setProfileSaving(false);
    }
  }

  async function handleUploadAvatar(file: File) {
    setProfileSaving(true);
    setProfileError(null);
    try {
      const auth = await uploadProfileAvatar(file);
      applyAuthResponse(auth);
      setNotice('프로필 사진을 저장했어요.');
    } catch (error) {
      setProfileError(formatErrorMessage(error));
    } finally {
      setProfileSaving(false);
    }
  }

  async function handleDeleteAvatar() {
    setProfileSaving(true);
    setProfileError(null);
    try {
      const auth = await deleteProfileAvatar();
      applyAuthResponse(auth);
      setNotice('프로필 사진을 삭제했어요.');
    } catch (error) {
      setProfileError(formatErrorMessage(error));
    } finally {
      setProfileSaving(false);
    }
  }

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      const auth = await logout();
      applyAuthResponse(auth);
      setMyPage(null);
      setNotice('로그아웃했어요.');
    } catch (error) {
      setNotice(formatErrorMessage(error));
    } finally {
      setIsLoggingOut(false);
    }
  }

  return {
    startProviderLogin,
    startProviderLink,
    handleUpdateProfile,
    handleUploadAvatar,
    handleDeleteAvatar,
    handleLogout,
  };
}
