import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useEventCallback } from '../../src/hooks/useEventCallback';

describe('useEventCallback', () => {
  it('returns a stable function reference across renders', () => {
    const callback1 = vi.fn();
    const callback2 = vi.fn();

    const { result, rerender } = renderHook(({ cb }) => useEventCallback(cb), {
      initialProps: { cb: callback1 },
    });

    const ref1 = result.current;

    rerender({ cb: callback2 });

    const ref2 = result.current;

    // Function reference must remain exactly the same
    expect(ref1).toBe(ref2);
  });

  it('calls the latest callback passed to it', () => {
    const callback1 = vi.fn().mockReturnValue('first');
    const callback2 = vi.fn().mockReturnValue('second');

    const { result, rerender } = renderHook(({ cb }) => useEventCallback(cb), {
      initialProps: { cb: callback1 },
    });

    expect(result.current()).toBe('first');
    expect(callback1).toHaveBeenCalled();
    expect(callback2).not.toHaveBeenCalled();

    rerender({ cb: callback2 });

    expect(result.current()).toBe('second');
    expect(callback1).toHaveBeenCalledTimes(1);
    expect(callback2).toHaveBeenCalledTimes(1);
  });

  it('correctly passes arguments to the callback', () => {
    const callback = vi.fn();

    const { result } = renderHook(() => useEventCallback(callback));

    result.current('arg1', 42, { test: true });

    expect(callback).toHaveBeenCalledWith('arg1', 42, { test: true });
  });
});
