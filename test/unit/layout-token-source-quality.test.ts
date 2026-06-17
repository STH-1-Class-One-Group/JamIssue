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

    expect(indexCss).toContain('--bottom-nav-base-height: 56px;');
    expect(indexCss).toContain('--bottom-nav-offset: calc(var(--bottom-nav-base-height) + env(safe-area-inset-bottom));');
    expect(indexCss).toContain('--phone-shell-height-gap: 0px;');
    expect(indexCss).toContain('--phone-shell-radius: 0px;');
    expect(indexCss).toContain('--map-sheet-tab-gap: 5px;');
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

  it('keeps map overlay z-index policy owned by semantic CSS tokens', () => {
    const indexCss = readSource('src/index.css');
    const css = `${indexCss}\n${readSource('src/styles/refinements.css')}`;

    for (const token of [
      '--z-map-sheet: 110;',
      '--z-speed-dial: 118;',
      '--z-bottom-nav: 120;',
      '--z-floating-nav: 130;',
      '--z-floating-nav-dropdown: 140;',
      '--z-notification-panel: 150;',
      '--z-side-drawer: 160;',
    ]) {
      expect(indexCss).toContain(token);
    }
    expect(indexCss).toContain('--map-sheet-full-control-top: calc(var(--shell-capsule-height) + 72px);');

    expect(css).toContain('z-index: var(--z-map-sheet)');
    expect(css).toContain('z-index: var(--z-speed-dial)');
    expect(css).toContain('z-index: var(--z-bottom-nav)');
    expect(css).toContain('z-index: var(--z-notification-panel)');
    expect(css).toContain('top: var(--map-sheet-full-control-top)');
    expect(css).not.toMatch(/\.place-drawer\s*\{[^}]*z-index:\s*\d+/s);
    expect(css).not.toMatch(/\.place-drawer--full\s*\{[^}]*z-index:\s*\d+/s);
    expect(css).not.toMatch(/\.bottom-nav\s*\{[^}]*z-index:\s*\d+/s);
    expect(css).not.toMatch(/\.speed-dial-fab\s*\{[^}]*z-index:\s*(?:\d+|calc\()/s);
  });

  it('keeps bottom navigation outside shared pink chip/button outline groups', () => {
    const css = `${readSource('src/index.css')}\n${readSource('src/styles/refinements.css')}`;

    expect(css).not.toMatch(/\.bottom-nav__item,\s*\n\.chip,\s*\n\.map-filter-chip/);
    expect(css).not.toMatch(/\.bottom-nav__item\.is-active,\s*\n\.chip\.is-active/);
    expect(css).not.toContain('.tourism-toggle-chip');
    expect(css).toContain('.tourism-toggle-switch');
    expect(css).toContain('border: 0 !important;');
  });

  it('keeps map drawer media information visible instead of cropping source images', () => {
    const css = `${readSource('src/index.css')}\n${readSource('src/styles/refinements.css')}`;

    expect(css).toContain('.map-bottom-sheet__media-image');
    expect(css).toContain('object-fit: contain');
    expect(css).not.toMatch(/\.map-bottom-sheet__media-image\s*\{[^}]*object-fit:\s*cover/s);
  });
});
