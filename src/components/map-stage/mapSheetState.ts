import type { DrawerState } from '../../types/core';

export type MapSheetState = 'hidden' | 'peek' | 'half' | 'full';

export function resolveMapSheetState(hasSelection: boolean, drawerState: DrawerState): MapSheetState {
  if (!hasSelection || drawerState === 'closed') {
    return 'hidden';
  }

  return drawerState;
}

export function buildMapSheetClassName(baseClassName: string, sheetState: MapSheetState, drawerState: DrawerState) {
  return Array.from(new Set([
    baseClassName,
    `${baseClassName}--${sheetState}`,
    `${baseClassName}--${drawerState}`,
    `${baseClassName}--route-${drawerState}`,
  ])).join(' ');
}

export function getExpandedDrawerState(drawerState: DrawerState): DrawerState {
  if (drawerState === 'closed') {
    return 'peek';
  }
  if (drawerState === 'peek') {
    return 'half';
  }
  return 'full';
}

export function getCollapsedDrawerState(drawerState: DrawerState): DrawerState {
  if (drawerState === 'full') {
    return 'half';
  }
  if (drawerState === 'half') {
    return 'peek';
  }
  if (drawerState === 'peek') {
    return 'closed';
  }
  return 'closed';
}
