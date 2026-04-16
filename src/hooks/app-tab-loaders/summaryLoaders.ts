import type { Dispatch, SetStateAction } from 'react';
import { getAdminSummary } from '../../api/adminClient';
import { getMySummary } from '../../api/myClient';
import { toReviewSummaryList } from '../../lib/reviews';
import type { AdminSummaryResponse, MyPageResponse, SessionUser, Tab } from '../../types';

interface CreateAdminSummaryLoaderParams {
  activeTab: Tab;
  adminSummary: AdminSummaryResponse | null;
  sessionUser: SessionUser | null;
  setAdminLoading: Dispatch<SetStateAction<boolean>>;
  setAdminSummary: Dispatch<SetStateAction<AdminSummaryResponse | null>>;
}

export function createAdminSummaryLoader({
  activeTab,
  adminSummary,
  sessionUser,
  setAdminLoading,
  setAdminSummary,
}: CreateAdminSummaryLoaderParams) {
  return async function refreshAdminSummary(force = false) {
    if (!sessionUser?.isAdmin) {
      setAdminSummary(null);
      return null;
    }

    if (!force && activeTab !== 'my' && adminSummary !== null) {
      return adminSummary;
    }

    setAdminLoading(true);
    try {
      const nextSummary = await getAdminSummary();
      setAdminSummary(nextSummary);
      return nextSummary;
    } finally {
      setAdminLoading(false);
    }
  };
}

interface CreateMyPageSummaryLoaderParams {
  activeTab: Tab;
  myPage: MyPageResponse | null;
  setMyPage: Dispatch<SetStateAction<MyPageResponse | null>>;
  setMyPageError: (value: string | null) => void;
}

export function createMyPageSummaryLoader({
  activeTab,
  myPage,
  setMyPage,
  setMyPageError,
}: CreateMyPageSummaryLoaderParams) {
  return async function refreshMyPageForUser(user: SessionUser | null, force = false) {
    if (!user) {
      setMyPage(null);
      setMyPageError(null);
      return null;
    }

    if (!force && activeTab !== 'my' && myPage === null) {
      return null;
    }

    try {
      const nextMyPage = await getMySummary();
      const nextMyPageSummary = {
        ...nextMyPage,
        reviews: toReviewSummaryList(nextMyPage.reviews),
      };
      setMyPage(nextMyPageSummary);
      setMyPageError(null);
      return nextMyPageSummary;
    } catch (error) {
      setMyPage(null);
      setMyPageError(error instanceof Error ? error.message : '마이페이지 정보를 불러오지 못했어요.');
      if (activeTab !== 'my') {
        return null;
      }
      throw error;
    }
  };
}
