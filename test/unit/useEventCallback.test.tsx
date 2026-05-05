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
    const callback = vi.fn((label: string, count: number, meta: { test: boolean }) => `${label}-${count}-${meta.test}`);

    const { result } = renderHook(() => useEventCallback(callback));

    const value = result.current('arg1', 42, { test: true });

    expect(callback).toHaveBeenCalledWith('arg1', 42, { test: true });
    expect(value).toBe('arg1-42-true');
  });

  it('keeps the stable function wired to the latest rendered state', () => {
    const { result, rerender } = renderHook(
      ({ prefix }) => useEventCallback((value: string) => `${prefix}:${value}`),
      { initialProps: { prefix: 'first' } },
    );

    const stableCallback = result.current;

    expect(stableCallback('value')).toBe('first:value');

    rerender({ prefix: 'second' });

    expect(result.current).toBe(stableCallback);
    expect(stableCallback('value')).toBe('second:value');
  });
});
