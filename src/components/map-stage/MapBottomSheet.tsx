/*
 * File: MapBottomSheet.tsx
 * Purpose: Provide the shared map bottom-sheet shell used by map detail surfaces.
 * Primary Responsibility: Own the common section, drag handle, state classes, and scrollable content slot.
 * Design Intent: Keep place, festival, and tourism sheets visually consistent while preserving domain-specific body content.
 * Non-Goals: This component does not fetch data, own selection state, or render domain-specific copy/actions.
 * Dependencies: React children, DrawerState, and map sheet state class helper.
 */
import type { ReactNode } from 'react';
import type { DrawerState } from '../../types/core';
import { buildMapSheetClassName, type MapSheetState } from './mapSheetState';

interface MapBottomSheetProps {
  ariaLabel: string;
  children: ReactNode;
  drawerState: DrawerState;
  sheetState: MapSheetState;
  onCollapse: () => void;
  onExpand: () => void;
}

export function MapBottomSheet({
  ariaLabel,
  children,
  drawerState,
  sheetState,
  onCollapse,
  onExpand,
}: MapBottomSheetProps) {
  const sheetClassName = buildMapSheetClassName('place-drawer', sheetState, drawerState);

  return (
    <section className={sheetClassName} data-map-sheet-state={sheetState} aria-label={ariaLabel}>
      <button
        type="button"
        className="place-drawer__handle"
        aria-label="시트 높이 조절"
        onClick={drawerState === 'partial' ? onExpand : onCollapse}
      >
        <span />
      </button>
      <div className="place-drawer__content map-bottom-sheet__content">
        {children}
      </div>
    </section>
  );
}
