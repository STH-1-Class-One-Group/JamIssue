import type { RefObject } from 'react';
import { useEffect, useRef } from 'react';
import { useEventCallback } from './useEventCallback';

interface UseAutoLoadMoreOptions {
  enabled: boolean;
  loading: boolean;
  onLoadMore: () => Promise<void> | void;
  rootRef: RefObject<HTMLElement | null>;
  rootMargin?: string;
}

export function useAutoLoadMore({
  enabled,
  loading,
  onLoadMore,
  rootRef,
  rootMargin = '160px 0px',
}: UseAutoLoadMoreOptions) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Performance optimization: stabilize onLoadMore callback to prevent unnecessary
  // IntersectionObserver teardown and recreation if parent re-renders with a new inline function.
  const stableOnLoadMore = useEventCallback(onLoadMore);

  useEffect(() => {
    if (!enabled || loading || typeof IntersectionObserver === 'undefined') {
      return;
    }

    const sentinel = sentinelRef.current;
    if (!sentinel) {
      return;
    }

    let requested = false;
    const observer = new IntersectionObserver(
      (entries) => {
        if (requested) {
          return;
        }

        if (entries.some((entry) => entry.isIntersecting)) {
          requested = true;
          void stableOnLoadMore();
        }
      },
      {
        root: rootRef.current,
        rootMargin,
        threshold: 0.01,
      },
    );

    observer.observe(sentinel);

    return () => {
      requested = true;
      observer.disconnect();
    };
  }, [enabled, loading, stableOnLoadMore, rootMargin, rootRef]);

  return sentinelRef;
}
