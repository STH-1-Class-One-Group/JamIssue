import { useRef } from 'react';
import type { DrawerState } from '../../types';

interface UsePlaceDrawerHandleOptions {
  drawerState: DrawerState;
  onClose: () => void;
  onExpand: () => void;
  onCollapse: () => void;
}

export function usePlaceDrawerHandle({
  drawerState,
  onClose,
  onExpand,
  onCollapse,
}: UsePlaceDrawerHandleOptions) {
  const dragStartYRef = useRef<number | null>(null);

  function handlePointerDown(event: React.PointerEvent<HTMLButtonElement>) {
    dragStartYRef.current = event.clientY;
  }

  function handlePointerUp(event: React.PointerEvent<HTMLButtonElement>) {
    if (dragStartYRef.current === null) {
      return;
    }

    const delta = event.clientY - dragStartYRef.current;
    dragStartYRef.current = null;

    if (delta > 72) {
      if (drawerState === 'full') {
        onCollapse();
        return;
      }
      onClose();
      return;
    }

    if (delta < -48) {
      onExpand();
    }
  }

  return {
    handlePointerDown,
    handlePointerUp,
    handleClick: drawerState === 'partial' ? onExpand : onCollapse,
  };
}
