import type { ApiStatus, MyPageResponse } from '../../types';

export function getHydratedMyPage({
  myPage,
  notifications,
  unreadNotificationCount,
}: {
  myPage: MyPageResponse | null;
  notifications: MyPageResponse['notifications'];
  unreadNotificationCount: number;
}) {
  return myPage ? {
    ...myPage,
    notifications,
    unreadNotificationCount,
  } : myPage;
}

export function getGlobalStatus({
  notice,
  bootstrapStatus,
  bootstrapError,
  mapLocationStatus,
  mapLocationMessage,
}: {
  notice: string | null;
  bootstrapStatus: ApiStatus;
  bootstrapError: string | null;
  mapLocationStatus: ApiStatus;
  mapLocationMessage: string | null;
}) {
  if (notice) {
    return { tone: 'info' as const, message: notice };
  }
  if (bootstrapStatus === 'error' && bootstrapError) {
    return { tone: 'error' as const, message: bootstrapError };
  }
  if (mapLocationMessage) {
    return {
      tone: mapLocationStatus === 'error' ? ('error' as const) : ('info' as const),
      message: mapLocationMessage,
    };
  }
  return null;
}
