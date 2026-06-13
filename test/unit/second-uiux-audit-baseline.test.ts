/*
 * File: second-uiux-audit-baseline.test.ts
 * Purpose: Pin the current source baseline for the TSK-012 second UI/UX implementation axis.
 * Primary Responsibility: Verify the pre-implementation facts that child issues must preserve or intentionally change.
 * Design Intent: Keep issue #405 grounded in repository code instead of screenshots or assumptions.
 * Non-Goals: This test does not approve the current UI as final or validate browser layout behavior.
 * Dependencies: Vitest and repository-relative source files.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const workspaceRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

function readSource(path: string) {
  return readFileSync(join(workspaceRoot, path), 'utf8');
}

function sourceExists(path: string) {
  return existsSync(join(workspaceRoot, path));
}

describe('TSK-012-01 second UI/UX audit baseline', () => {
  it('records that TSK-011 is not the second UI/UX implementation axis', () => {
    expect(sourceExists('docs/GOVERNANCE_INDEX.md')).toBe(true);

    const governanceIndex = readSource('docs/GOVERNANCE_INDEX.md');

    expect(governanceIndex).not.toContain('TSK-011-00 Epic: 2차 UI/UX');
  });

  it('records that AppShell has moved header ownership to the app header slice', () => {
    const appShell = readSource('src/components/app-shell/AppShell.tsx');

    expect(appShell).toContain('AppHeader');
    expect(appShell).not.toContain('FloatingBackButton');
    expect(appShell).not.toContain('phone-shell__utility-slot');
  });

  it('records that EventTab is already festival-only on the current main baseline', () => {
    const eventTab = readSource('src/components/EventTab.tsx');

    expect(eventTab).not.toContain('EventTabTourismSection');
    expect(eventTab).not.toContain('getTourismPlaces');
    expect(eventTab).not.toContain('event-segment');
  });

  it('records that the KTO tourism consumer contract is not present on current main', () => {
    expect(sourceExists('src/api/tourismClient.ts')).toBe(false);
    expect(sourceExists('src/tourismTypes.ts')).toBe(false);
  });

  it('records the remaining map overlay and surface CSS cleanup debt', () => {
    const css = `${readSource('src/index.css')}\n${readSource('src/styles/refinements.css')}`;

    expect(css.match(/\.map-filter-strip/g)?.length ?? 0).toBeGreaterThan(1);
    expect(css.match(/\.map-surface-frame/g)?.length ?? 0).toBeGreaterThan(1);
    expect(css).toContain('.phone-shell--map .phone-shell__utility-slot');
  });
});
