/*
 * File: MapBottomSheet.tsx
 * Purpose: Provide the shared map bottom-sheet shell used by map detail surfaces.
 * Primary Responsibility: Own the common section, handle, explicit minimize control, state classes, and scrollable content slot.
 * Design Intent: Keep place, festival, and tourism sheets visually consistent while preserving domain-specific body content.
 * Non-Goals: This component does not fetch data, own selection state, or render domain-specific copy/actions.
 * Dependencies: React children, DrawerState, and map sheet state class helper.
 */
import type { PointerEvent, ReactNode } from 'react';
import type { DrawerState } from '../../types/core';
import { buildMapSheetClassName, type MapSheetState } from './mapSheetState';

interface MapBottomSheetProps {
  ariaLabel: string;
  children: ReactNode;
  drawerState: DrawerState;
  handlePointerHandlers?: {
    onPointerDown: (event: PointerEvent<HTMLButtonElement>) => void;
    onPointerUp: (event: PointerEvent<HTMLButtonElement>) => void;
  };
  onHandleClick?: () => void;
  sheetState: MapSheetState;
  onCollapse: () => void;
  onExpand: () => void;
}

export function MapBottomSheet({
  ariaLabel,
  children,
  drawerState,
  handlePointerHandlers,
  onHandleClick,
  sheetState,
  onCollapse,
  onExpand,
}: MapBottomSheetProps) {
  const sheetClassName = buildMapSheetClassName('place-drawer', sheetState, drawerState);
  const isFull = sheetState === 'full' || drawerState === 'full';
  const handleClick = onHandleClick ?? (drawerState === 'partial' ? onExpand : undefined);

  return (
    <section className={sheetClassName} data-map-sheet-state={sheetState} aria-label={ariaLabel}>
      <button
        type="button"
        className="place-drawer__handle"
        aria-label={isFull ? '시트 확장됨' : '시트 확장'}
        onPointerDown={handlePointerHandlers?.onPointerDown}
        onPointerUp={handlePointerHandlers?.onPointerUp}
        onClick={handleClick}
      >
        <span />
      </button>
      {isFull ? (
        <button type="button" className="place-drawer__minimize" aria-label="시트 최소화" onClick={onCollapse}>
          최소화
        </button>
      ) : null}
      <div className="place-drawer__content map-bottom-sheet__content">
        {children}
      </div>
    </section>
  );
}
