/*
 * File: visible-theme-hardcoding-audit.test.ts
 * Purpose: Record the TSK-023 visible theme hardcoding audit boundary.
 * Primary Responsibility: Keep visible scrollbar, form, and drawer theme gaps classified before migration.
 * Design Intent: Prevent unowned CSS override drift while TSK-023 follow-up children migrate tokens.
 * Non-Goals: This audit does not complete the token migration; TSK-023-02 and TSK-023-03 own that work.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const workspaceRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

function readRepoFile(repoPath: string) {
  return readFileSync(join(workspaceRoot, repoPath), 'utf8').replace(/\r\n/g, '\n');
}

function extractBlock(source: string, selector: string) {
  const start = source.indexOf(`${selector} {`);

  expect(start, `${selector} block should exist`).toBeGreaterThanOrEqual(0);

  const bodyStart = source.indexOf('{', start);
  const bodyEnd = source.indexOf('\n}', bodyStart);

  expect(bodyStart, `${selector} block should have an opening brace`).toBeGreaterThanOrEqual(0);
  expect(bodyEnd, `${selector} block should have a closing brace`).toBeGreaterThan(bodyStart);

  return source.slice(bodyStart + 1, bodyEnd);
}

describe('visible theme hardcoding audit', () => {
  it('keeps visible scrollable app surfaces explicitly classified for TSK-023 migration', () => {
    const indexCss = readRepoFile('src/index.css');
    const visibleScrollableSurfaces = [
      '.app-settings-drawer__content',
      '.tab-overlay--scrollable',
      '.place-drawer__content',
      '.page-panel--scrollable',
      '.feed-comment-sheet__content',
      '.side-drawer__content',
    ];

    for (const selector of visibleScrollableSurfaces) {
      const block = extractBlock(indexCss, selector);

      expect(block, `${selector} should be an explicitly scrollable app surface`).toMatch(/overflow-y:\s*auto/);
    }
  });

  it('keeps hidden scrollbar exceptions scoped to horizontal navigation rows', () => {
    const indexCss = readRepoFile('src/index.css');
    const refinementsCss = readRepoFile('src/styles/refinements.css');
    const combinedCss = `${indexCss}\n${refinementsCss}`;
    const hiddenScrollbarSelectors = Array.from(
      combinedCss.matchAll(/(?:^|\n)([^\n{]+)\s*\{\s*[^}]*scrollbar-width:\s*none[^}]*\}/g),
      (match) => match[1].trim(),
    ).sort();

    expect(hiddenScrollbarSelectors).toEqual([
      '.app-shell__sub-nav-slot .map-filter-strip .chip-row',
      '.feed-comment-sheet__content',
      '.map-filter-strip .chip-row',
      '.my-page-tab-strip',
      '.page-panel--scrollable',
      '.place-drawer__content',
      '.side-drawer__menu',
      '.tab-overlay--scrollable',
    ]);
  });

  it('records visible scrollbar surfaces that currently bypass the common token contract', () => {
    const indexCss = readRepoFile('src/index.css');
    const surfacesNeedingThemedScrollbar = [
      '.page-panel--scrollable',
      '.place-drawer__content',
      '.tab-overlay--scrollable',
      '.feed-comment-sheet__content',
    ];

    for (const selector of surfacesNeedingThemedScrollbar) {
      const block = extractBlock(indexCss, selector);

      expect(block, `${selector} should be migrated in TSK-023-02`).toContain('scrollbar-width: none');
    }

    expect(indexCss).toContain('.app-settings-drawer__content');
    expect(indexCss).toContain('.side-drawer__content');
  });

  it('keeps app textarea native resize affordance disabled', () => {
    const indexCss = readRepoFile('src/index.css');
    const textareaBlock = extractBlock(indexCss, '.review-composer__textarea');

    expect(textareaBlock).toContain('resize: none');
  });

  it('keeps refinements visible hardcoded override backlog classified for follow-up token migration', () => {
    const refinementsCss = readRepoFile('src/styles/refinements.css');
    const visibleBacklogSnippets = [
      'color: #ff6f9f !important;',
      'background: #ff557d !important;',
      'background: rgba(250, 247, 255, 0.82) !important;',
      'background: rgba(255, 246, 249, 0.98) !important;',
      'border: 1px solid rgba(255, 196, 215, 0.36) !important;',
    ];

    for (const snippet of visibleBacklogSnippets) {
      expect(refinementsCss, `${snippet} should be migrated in TSK-023-03/04`).toContain(snippet);
    }
  });
});
