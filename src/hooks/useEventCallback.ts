import { useCallback, useLayoutEffect, useRef } from 'react';

type AnyCallback = (...args: never[]) => unknown;

/**
 * A custom hook that creates a stable callback that always has access to the
 * latest state and props, without triggering re-renders when they change.
 * Useful for passing callbacks to optimized child components (React.memo).
 */
export function useEventCallback<T extends AnyCallback>(fn: T): (...args: Parameters<T>) => ReturnType<T> {
  const ref = useRef<T>(fn);

  useLayoutEffect(() => {
    ref.current = fn;
  }, [fn]);

  return useCallback(
    (...args: Parameters<T>) => ref.current(...args) as ReturnType<T>,
    [],
  );
}
