import type { DrawerState } from '../../types/core';

export type MapSheetState = 'hidden' | 'peek' | 'half' | 'full';

export function resolveMapSheetState(hasSelection: boolean, drawerState: DrawerState): MapSheetState {
  if (!hasSelection || drawerState === 'closed') {
    return 'hidden';
  }

  return drawerState === 'full' ? 'full' : 'peek';
}

export function buildMapSheetClassName(baseClassName: string, sheetState: MapSheetState, drawerState: DrawerState) {
  return Array.from(new Set([
    baseClassName,
    `${baseClassName}--${sheetState}`,
    `${baseClassName}--${drawerState}`,
    `${baseClassName}--route-${drawerState}`,
  ])).join(' ');
}
