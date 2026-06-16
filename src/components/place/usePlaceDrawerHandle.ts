import { useRef } from 'react';
import type { DrawerState } from '../../types/core';

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
  const suppressNextClickRef = useRef(false);

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
      suppressNextClickRef.current = true;
      if (drawerState === 'full' || drawerState === 'half') {
        onCollapse();
        return;
      }
      onClose();
      return;
    }

    if (delta < -48) {
      suppressNextClickRef.current = true;
      onExpand();
    }
  }

  function handleClick() {
    if (suppressNextClickRef.current) {
      suppressNextClickRef.current = false;
      return;
    }

    if (drawerState === 'peek' || drawerState === 'half') {
      onExpand();
    }
  }

  return {
    handlePointerDown,
    handlePointerUp,
    handleClick,
  };
}
