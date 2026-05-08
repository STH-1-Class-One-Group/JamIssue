import { act, render } from '@testing-library/react';
import { useRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAutoLoadMore } from '../../src/hooks/useAutoLoadMore';

class IntersectionObserverRecorder {
  static instances: IntersectionObserverRecorder[] = [];

  readonly disconnect = vi.fn();
  readonly observe = vi.fn();
  readonly root = null;
  readonly rootMargin = '';
  readonly thresholds = [];
  readonly unobserve = vi.fn();

  constructor(private readonly callback: IntersectionObserverCallback) {
    IntersectionObserverRecorder.instances.push(this);
  }

  takeRecords() {
    return [];
  }

  trigger(isIntersecting = true) {
    this.callback([{ isIntersecting } as IntersectionObserverEntry], this as unknown as IntersectionObserver);
  }
}

interface HarnessProps {
  loading?: boolean;
  onLoadMore: () => void;
}

function Harness({ loading = false, onLoadMore }: HarnessProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useAutoLoadMore({
    enabled: true,
    loading,
    onLoadMore,
    rootRef,
  });

  return (
    <div ref={rootRef}>
      <div data-testid="sentinel" ref={sentinelRef} />
    </div>
  );
}

describe('useAutoLoadMore', () => {
  beforeEach(() => {
    IntersectionObserverRecorder.instances = [];
    vi.stubGlobal('IntersectionObserver', IntersectionObserverRecorder);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('keeps the observer stable across onLoadMore identity changes and calls the latest callback', () => {
    const firstLoadMore = vi.fn();
    const secondLoadMore = vi.fn();

    const { rerender } = render(<Harness onLoadMore={firstLoadMore} />);

    expect(IntersectionObserverRecorder.instances).toHaveLength(1);

    rerender(<Harness onLoadMore={secondLoadMore} />);

    expect(IntersectionObserverRecorder.instances).toHaveLength(1);
    expect(IntersectionObserverRecorder.instances[0].disconnect).not.toHaveBeenCalled();

    act(() => {
      IntersectionObserverRecorder.instances[0].trigger();
    });

    expect(firstLoadMore).not.toHaveBeenCalled();
    expect(secondLoadMore).toHaveBeenCalledTimes(1);
  });
});
