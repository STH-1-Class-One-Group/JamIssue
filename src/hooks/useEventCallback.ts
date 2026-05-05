import { useCallback, useLayoutEffect, useRef } from 'react';

/**
 * A custom hook that creates a stable callback that always has access to the
 * latest state and props, without triggering re-renders when they change.
 * Useful for passing callbacks to optimized child components (React.memo).
 */

export function useEventCallback<T extends (...args: any[]) => any>(fn: T): T {
  const ref = useRef<T>(fn);

  useLayoutEffect(() => {
    ref.current = fn;
  });

  return useCallback(

    (...args: any[]) => {
      const f = ref.current;
      return f ? f(...args) : undefined;
    },
    [],
  ) as unknown as T;
}
