import type { useAppShellCoordinator } from './useAppShellCoordinator';

type AppShellCoordinatorState = ReturnType<typeof useAppShellCoordinator>;

export function useAppShellStageProps(state: AppShellCoordinatorState) {
  const {
    activeTab,
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
  };
}
