import { describe, expect, it } from 'vitest';
import { resolveViewportMetrics } from '../../src/lib/viewportMetrics';

describe('resolveViewportMetrics', () => {
  it('keeps stable app height when an editable field opens the iOS keyboard', () => {
    const previous = resolveViewportMetrics({
      innerHeight: 844,
      innerWidth: 390,
      visualViewportHeight: 844,
      visualViewportWidth: 390,
    });

    const next = resolveViewportMetrics({
      innerHeight: 844,
      innerWidth: 390,
      visualViewportHeight: 512,
      visualViewportWidth: 390,
      activeElementTagName: 'textarea',
    }, previous);

    expect(next.isKeyboardResize).toBe(true);
    expect(next.appHeight).toBe(844);
    expect(next.visualHeight).toBe(512);
  });

  it('updates stable app height for normal viewport resize', () => {
    const previous = resolveViewportMetrics({
      innerHeight: 844,
      innerWidth: 390,
      visualViewportHeight: 844,
      visualViewportWidth: 390,
    });

    const next = resolveViewportMetrics({
      innerHeight: 700,
      innerWidth: 390,
      visualViewportHeight: 700,
      visualViewportWidth: 390,
    }, previous);

    expect(next.isKeyboardResize).toBe(false);
    expect(next.appHeight).toBe(700);
  });

  it('restores stable metrics when the keyboard closes', () => {
    const keyboardState = resolveViewportMetrics({
      innerHeight: 844,
      innerWidth: 390,
      visualViewportHeight: 512,
      visualViewportWidth: 390,
      activeElementTagName: 'input',
    }, { appHeight: 844, appWidth: 390 });

    const next = resolveViewportMetrics({
      innerHeight: 844,
      innerWidth: 390,
      visualViewportHeight: 844,
      visualViewportWidth: 390,
      activeElementTagName: 'input',
    }, keyboardState);

    expect(next.isKeyboardResize).toBe(false);
    expect(next.appHeight).toBe(844);
  });
});
