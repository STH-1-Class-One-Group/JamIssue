/*
 * File: layout-token-source-quality.test.ts
 * Purpose: Guard the app-shell layout token boundary introduced for TSK-012-06.
 * Primary Responsibility: Fail when bottom tab and map sheet spacing return to raw repeated literals.
 * Design Intent: Keep UI layout numbers owned by CSS tokens without changing public behavior.
 * Non-Goals: This test does not classify every CSS number or enforce visual redesign.
 * Dependencies: Vitest and repository-relative CSS source files.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const workspaceRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

function readSource(path: string) {
  return readFileSync(join(workspaceRoot, path), 'utf8');
}

describe('layout token source quality baseline', () => {
  it('keeps app shell and map sheet spacing owned by root CSS tokens', () => {
    const indexCss = readSource('src/index.css');

    expect(indexCss).toContain('--bottom-nav-base-height: 76px;');
    expect(indexCss).toContain('--bottom-nav-offset: calc(var(--bottom-nav-base-height) + env(safe-area-inset-bottom));');
    expect(indexCss).toContain('--map-sheet-tab-gap: 12px;');
    expect(indexCss).toContain('--map-sheet-peek-height: 31%;');
    expect(indexCss).toContain('--map-sheet-half-height: 50%;');
    expect(indexCss).toContain('--map-sheet-full-height: 60%;');
  });

  it('prevents repeated bottom tab and sheet gap literals from returning', () => {
    const css = `${readSource('src/index.css')}\n${readSource('src/styles/refinements.css')}`;

    expect(css).not.toMatch(/bottom-nav-offset\)\s*\+\s*12px/);
    expect(css).not.toContain('calc(76px + env(safe-area-inset-bottom))');
    expect(css).not.toContain('calc(72px + env(safe-area-inset-bottom))');
    expect(css).not.toMatch(/padding:\s*10px\s+1[24]px\s+calc\(12px\s*\+\s*env\(safe-area-inset-bottom\)\)/);
  });

  it('keeps bottom navigation visible instead of reintroducing hidden drawer-era policy', () => {
    const css = `${readSource('src/index.css')}\n${readSource('src/styles/refinements.css')}`;
    const appShellSource = readSource('src/components/app-shell/AppShell.tsx');
    const appSource = readSource('src/App.tsx');

    expect(css).not.toContain('app-shell__bottom-tab-slot--hidden');
    expect(css).not.toContain('bottom-nav--hidden');
    expect(appShellSource).not.toContain('bottomTabHidden');
    expect(appSource).not.toContain('bottomTabHidden');
  });
});
