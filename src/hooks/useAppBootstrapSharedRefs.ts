import { useEffect, useRef } from 'react';
import type { MutableRefObject } from 'react';
import type { MyPageResponse, SessionUser, Tab } from '../types';

type RefreshMyPageForUser = (user: SessionUser | null, force?: boolean) => Promise<MyPageResponse | null>;
type ResetReviewCaches = () => void;
type GoToTab = (tab: Tab, historyMode?: 'push' | 'replace') => void;
type FormatErrorMessage = (error: unknown) => string;
type ReportBackgroundError = (error: unknown) => void;

export interface AppBootstrapSharedRefs {
  refreshMyPageForUserRef: MutableRefObject<RefreshMyPageForUser>;
  resetReviewCachesRef: MutableRefObject<ResetReviewCaches>;
  goToTabRef: MutableRefObject<GoToTab>;
  formatErrorMessageRef: MutableRefObject<FormatErrorMessage>;
  reportBackgroundErrorRef: MutableRefObject<ReportBackgroundError>;
}

export function useAppBootstrapSharedRefs({
  refreshMyPageForUser,
  resetReviewCaches,
  goToTab,
  formatErrorMessage,
  reportBackgroundError,
}: {
  refreshMyPageForUser: RefreshMyPageForUser;
  resetReviewCaches: ResetReviewCaches;
  goToTab: GoToTab;
  formatErrorMessage: FormatErrorMessage;
  reportBackgroundError: ReportBackgroundError;
}): AppBootstrapSharedRefs {
  const refreshMyPageForUserRef = useRef(refreshMyPageForUser);
  const resetReviewCachesRef = useRef(resetReviewCaches);
  const goToTabRef = useRef(goToTab);
  const formatErrorMessageRef = useRef(formatErrorMessage);
  const reportBackgroundErrorRef = useRef(reportBackgroundError);

  useEffect(() => {
    refreshMyPageForUserRef.current = refreshMyPageForUser;
  }, [refreshMyPageForUser]);

  useEffect(() => {
    resetReviewCachesRef.current = resetReviewCaches;
  }, [resetReviewCaches]);

  useEffect(() => {
    goToTabRef.current = goToTab;
  }, [goToTab]);

  useEffect(() => {
    formatErrorMessageRef.current = formatErrorMessage;
  }, [formatErrorMessage]);

  useEffect(() => {
    reportBackgroundErrorRef.current = reportBackgroundError;
  }, [reportBackgroundError]);

  return {
    refreshMyPageForUserRef,
    resetReviewCachesRef,
    goToTabRef,
    formatErrorMessageRef,
    reportBackgroundErrorRef,
  };
}
