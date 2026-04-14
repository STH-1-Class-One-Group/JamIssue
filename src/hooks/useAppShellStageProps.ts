import type { useAppShellCoordinator } from './useAppShellCoordinator';

type AppShellCoordinatorState = ReturnType<typeof useAppShellCoordinator>;

export function useAppShellStageProps(state: AppShellCoordinatorState) {
  const {
    activeTab,
    handleDeleteNotification,
    handleMarkAllNotificationsRead,
    handleOpenGlobalNotification,
    sessionUser,
    shellNavigation: {
      canNavigateBack,
      handleNavigateBack,
      handleBottomNavChange,
    },
    viewModels,
  } = state;

  return {
    activeTab,
    canNavigateBack,
    handleNavigateBack,
    handleBottomNavChange,
    globalStatus: viewModels.globalStatus,
    hydratedMyPage: viewModels.hydratedMyPage,
    sessionUser,
    handleOpenGlobalNotification,
    handleMarkAllNotificationsRead,
    handleDeleteNotification,
  };
}
