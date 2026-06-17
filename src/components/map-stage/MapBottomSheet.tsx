/*
 * File: MapBottomSheet.tsx
 * Purpose: Provide the shared map bottom-sheet shell used by map detail surfaces.
 * Primary Responsibility: Own the common chrome row, handle, close/minimize controls,
 * media frame, state classes, and scrollable content slot.
 * Design Intent: Keep place, festival, and tourism sheets visually consistent while
 * separating app-level navigation from drawer-level controls and domain content.
 * Non-Goals: This component does not fetch data, own selection state, or render
 * domain-specific copy/actions.
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
  media?: ReactNode;
  onClose: () => void;
  onCollapse: () => void;
  onExpand: () => void;
  onHandleClick?: () => void;
  media?: ReactNode;
  sheetState: MapSheetState;
}

export function MapBottomSheet({
  ariaLabel,
  children,
  drawerState,
  handlePointerHandlers,
  media,
  onClose,
  onCollapse,
  onExpand,
  onHandleClick,
  media,
  sheetState,
}: MapBottomSheetProps) {
  const sheetClassName = buildMapSheetClassName('place-drawer', sheetState, drawerState);
  const isFull = sheetState === 'full' || drawerState === 'full';
  const handleClick = onHandleClick ?? (drawerState === 'peek' || drawerState === 'half' ? onExpand : undefined);

  return (
    <section className={sheetClassName} data-map-sheet-state={sheetState} aria-label={ariaLabel}>
      <div className="place-drawer__chrome">
        <div className="place-drawer__chrome-spacer" aria-hidden="true" />
        <button
          type="button"
          className="place-drawer__handle"
          aria-label={isFull ? '시트 확장 유지' : '시트 확장'}
          onPointerDown={handlePointerHandlers?.onPointerDown}
          onPointerUp={handlePointerHandlers?.onPointerUp}
          onClick={handleClick}
        >
          <span />
        </button>
        <div className="place-drawer__control-rail" aria-label="시트 제어">
          {isFull ? (
            <button
              type="button"
              className="place-drawer__control-btn place-drawer__minimize"
              aria-label="시트 최소화"
              onClick={onCollapse}
            >
              <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                <path d="M4 8h8" />
              </svg>
            </button>
          ) : null}
          <button
            type="button"
            className="place-drawer__control-btn place-drawer__shell-close"
            aria-label="시트 닫기"
            onClick={onClose}
          >
            <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
              <path d="M5 5l6 6M11 5 5 11" />
            </svg>
          </button>
        </div>
      </div>

      <div className="place-drawer__surface">
        {media ? <div className="map-bottom-sheet__media-frame">{media}</div> : null}
        <div className="place-drawer__content map-bottom-sheet__content">{children}</div>
      </div>
    </section>
  );
}
