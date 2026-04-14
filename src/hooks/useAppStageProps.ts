import type { useAppShellCoordinator } from './useAppShellCoordinator';
import { useAppShellStageProps } from './useAppShellStageProps';
import { useMapStageProps } from './useMapStageProps';
import { usePageStageProps } from './usePageStageProps';

type AppShellCoordinatorState = ReturnType<typeof useAppShellCoordinator>;

export function useAppStageProps(state: AppShellCoordinatorState) {
  const shellStageProps = useAppShellStageProps(state);
  const mapStageProps = useMapStageProps(state);
  const pageStageProps = usePageStageProps(state);

  return {
    ...shellStageProps,
    mapStageProps,
    pageStageProps,
  };
}
