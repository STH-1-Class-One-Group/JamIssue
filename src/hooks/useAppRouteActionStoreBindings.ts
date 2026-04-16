import { useAuthStore } from '../store/auth-store';
import { useAppPageRuntimeStore } from '../store/app-page-runtime-store';
import { useAppShellRuntimeStore } from '../store/app-shell-runtime-store';
import { useMyPageStore } from '../store/my-page-store';

export function useAppRouteActionStoreBindings() {
  const sessionUser = useAuthStore((state) => state.sessionUser);
  const setRouteLikeUpdatingId = useAppPageRuntimeStore((state) => state.setRouteLikeUpdatingId);
  const setRouteSubmitting = useAppPageRuntimeStore((state) => state.setRouteSubmitting);
  const setRouteError = useAppPageRuntimeStore((state) => state.setRouteError);
  const setNotice = useAppShellRuntimeStore((state) => state.setNotice);
  const setMyPageTab = useMyPageStore((state) => state.setMyPageTab);

  return {
    sessionUser,
    setRouteLikeUpdatingId,
    setRouteSubmitting,
    setRouteError,
    setNotice,
    setMyPageTab,
  };
}
