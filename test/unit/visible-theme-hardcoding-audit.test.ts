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

const rawColorPattern =
  /#[0-9a-fA-F]{3,8}|rgba?\([^)]*\)|(?:linear|radial)-gradient\([^;\n]*\)|color-mix\([^;\n]*\)/;

function extractBlocksIncludingSelector(source: string, selector: string) {
  const blocks = Array.from(source.matchAll(/([^{}]+)\{([^{}]*)\}/g))
    .map((match) => ({
      prelude: match[1].trim(),
      body: match[2],
    }))
    .filter(({ prelude }) => prelude.split(',').some((part) => part.trim() === selector));

  expect(blocks.length, `${selector} should have at least one CSS block`).toBeGreaterThan(0);

  return blocks;
}

function expectSelectorBlocksUseTokens(source: string, selectors: string[]) {
  for (const selector of selectors) {
    const blocks = extractBlocksIncludingSelector(source, selector);

    expect(
      blocks.some(({ body }) => body.includes('var(')),
      `${selector} should consume semantic tokens in at least one block`,
    ).toBe(true);

    for (const { body } of blocks) {
      expect(body, `${selector} should not contain raw visible color literals`).not.toMatch(rawColorPattern);
    }
  }
}

function expectSelectorBlocksAvoidRawColors(source: string, selectors: string[]) {
  for (const selector of selectors) {
    const blocks = extractBlocksIncludingSelector(source, selector);

    for (const { body } of blocks) {
      expect(body, `${selector} should not contain raw visible color literals`).not.toMatch(rawColorPattern);
    }
  }
}

describe('visible theme hardcoding audit', () => {
  const visibleScrollableSurfaces = [
    '.chrome-drawer__content',
    '.app-settings-drawer__content',
    '.tab-overlay--scrollable',
    '.place-drawer__content',
    '.feed-comment-sheet__content',
    '.side-drawer__content',
  ];

  it('keeps visible scrollable app surfaces explicitly classified for TSK-023 migration', () => {
    const indexCss = readRepoFile('src/index.css');
    const chromeDrawerContentBlock = extractBlock(indexCss, '.chrome-drawer__content');

    expect(chromeDrawerContentBlock, '.chrome-drawer__content should own drawer scrolling').toMatch(/overflow-y:\s*auto/);

    for (const selector of visibleScrollableSurfaces) {
      const block = extractBlock(indexCss, selector);

      if (selector === '.app-settings-drawer__content' || selector === '.side-drawer__content') {
        expect(block, `${selector} should delegate scrolling to .chrome-drawer__content`).toMatch(/overflow:\s*visible/);
      } else {
        expect(block, `${selector} should be an explicitly scrollable app surface`).toMatch(/overflow-y:\s*auto/);
      }
    }

    const pagePanelBlock = extractBlock(indexCss, '.page-panel--scrollable');
    expect(pagePanelBlock, '.page-panel--scrollable should remain a primary page scroll container').toMatch(
      /overflow-y:\s*auto/,
    );
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
      '.map-filter-strip .chip-row',
      '.my-page-tab-strip',
      '.side-drawer__menu',
    ]);

    const hiddenWebkitScrollbarSelectors = Array.from(
      combinedCss.matchAll(/(?:^|\n)([^\n{]+::-webkit-scrollbar)\s*\{\s*[^}]*display:\s*none[^}]*\}/g),
      (match) => match[1].trim().replace(/::-webkit-scrollbar$/, ''),
    ).sort();

    expect(hiddenWebkitScrollbarSelectors).toEqual([
      '.app-shell__sub-nav-slot .map-filter-strip .chip-row',
      '.map-filter-strip .chip-row',
      '.map-filter-strip .chip-row',
      '.my-page-tab-strip',
      '.side-drawer__menu',
    ]);
  });

  it('keeps visible scrollbar surfaces on the common token contract', () => {
    const indexCss = readRepoFile('src/index.css');

    for (const selector of visibleScrollableSurfaces) {
      const hiddenScrollbarPattern = new RegExp(
        `${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{[^}]*scrollbar-width:\\s*none`,
      );

      expect(indexCss, `${selector} must not hide its visible scrollbar`).not.toMatch(hiddenScrollbarPattern);
      expect(indexCss, `${selector} should participate in the common scrollbar selector`).toContain(selector);
    }

    const commonScrollbarPrelude = indexCss.slice(
      indexCss.indexOf('.chrome-drawer__content,'),
      indexCss.indexOf('.chrome-drawer__content.is-scrolling'),
    );
    expect(commonScrollbarPrelude).not.toContain('.page-panel--scrollable');

    expect(indexCss).toContain('scrollbar-gutter: stable;');
    expect(indexCss).toContain('scrollbar-width: thin;');
    expect(indexCss).toContain('scrollbar-color: transparent transparent;');
    expect(indexCss).toContain('scrollbar-color: var(--scrollbar-thumb) transparent;');
    expect(indexCss).toContain('width: var(--scrollbar-size);');
    expect(indexCss).toContain('background: transparent;');
    expect(indexCss).toContain('background: var(--scrollbar-track);');
    expect(indexCss).toContain('background: var(--scrollbar-thumb);');
    expect(indexCss).toContain('background: var(--scrollbar-thumb-hover);');
    expect(indexCss).toContain('border: 2px solid transparent;');
    expect(indexCss).toContain('border-color: var(--scrollbar-border);');
  });

  it('keeps drawer scrollbars transient instead of permanently visible', () => {
    const indexCss = readRepoFile('src/index.css');
    const chromeDrawerContentBlock = extractBlock(indexCss, '.chrome-drawer__content');
    const drawerActiveStates = [
      '.chrome-drawer__content.is-scrolling',
      '.chrome-drawer__content:hover',
      '.chrome-drawer__content:focus-within',
      '.chrome-drawer__content.is-scrolling::-webkit-scrollbar-track',
      '.chrome-drawer__content:hover::-webkit-scrollbar-track',
      '.chrome-drawer__content:focus-within::-webkit-scrollbar-track',
      '.chrome-drawer__content.is-scrolling::-webkit-scrollbar-thumb',
      '.chrome-drawer__content:hover::-webkit-scrollbar-thumb',
      '.chrome-drawer__content:focus-within::-webkit-scrollbar-thumb',
    ];

    expect(chromeDrawerContentBlock).toContain('scrollbar-color: transparent transparent');

    for (const selector of drawerActiveStates) {
      expect(indexCss, `${selector} should opt in to visible themed scrollbar styling`).toContain(selector);
    }
  });

  it('keeps scrollbar and form semantic tokens declared at the semantic boundary', () => {
    const semanticCss = readRepoFile('src/styles/semantic.css');
    const requiredTokens = [
      '--scrollbar-size:',
      '--scrollbar-track:',
      '--scrollbar-thumb:',
      '--scrollbar-thumb-hover:',
      '--scrollbar-border:',
      '--control-placeholder-text:',
      '--control-focus-ring:',
      '--control-error-text:',
      '--control-hover-surface:',
      '--surface-field:',
      '--sheet-handle:',
      '--image-placeholder-bg:',
    ];

    for (const token of requiredTokens) {
      expect(semanticCss, `${token} should stay in the semantic token contract`).toContain(token);
    }
  });

  it('keeps app textarea native resize affordance disabled', () => {
    const indexCss = readRepoFile('src/index.css');
    const textareaBlock = extractBlock(indexCss, '.review-composer__textarea');

    expect(textareaBlock).toContain('resize: none');
  });

  it('keeps migrated form and drawer selectors off raw visible colors', () => {
    const indexCss = readRepoFile('src/index.css');
    const refinementsCss = readRepoFile('src/styles/refinements.css');

    expectSelectorBlocksUseTokens(indexCss, [
      '.review-composer__textarea',
      '.review-composer__textarea::placeholder',
      '.review-composer__textarea:focus',
      '.file-picker',
      '.place-drawer__handle span',
      '.place-drawer__close:hover',
      '.feed-comment-sheet__handle span',
      '.feed-comment-sheet__close:hover',
    ]);

    expectSelectorBlocksUseTokens(refinementsCss, [
      '.feed-comment-sheet__header',
    ]);

    expectSelectorBlocksAvoidRawColors(refinementsCss, [
      '.file-picker.is-disabled',
    ]);
  });

  it('keeps disabled app textareas on semantic tokens instead of hardcoded fallback colors', () => {
    const refinementsCss = readRepoFile('src/styles/refinements.css');
    const disabledBlock = extractBlock(refinementsCss, '.review-composer textarea:disabled');

    expect(disabledBlock).not.toMatch(rawColorPattern);
    expect(disabledBlock).toContain('var(--control-muted-bg)');
    expect(disabledBlock).toContain('var(--control-muted-text)');
  });

  it('keeps migrated refinements visible overrides on semantic tokens', () => {
    const refinementsCss = readRepoFile('src/styles/refinements.css');
    const migratedRawSnippets = [
      'color: #ff6f9f !important;',
      'background: #ff557d !important;',
      'background: rgba(250, 247, 255, 0.82) !important;',
      'background: rgba(186, 150, 168, 0.4) !important;',
      'box-shadow: 0 -14px 28px rgba(60, 32, 48, 0.08) !important;',
    ];

    for (const snippet of migratedRawSnippets) {
      expect(refinementsCss, `${snippet} should stay migrated to semantic tokens`).not.toContain(snippet);
    }

    expect(refinementsCss).toContain('color: var(--color-accent) !important;');
    expect(refinementsCss).toContain('background: var(--color-accent) !important;');
    expect(refinementsCss).toContain('background: var(--surface-muted) !important;');
    expect(refinementsCss).toContain('background: var(--sheet-handle) !important;');
    expect(refinementsCss).toContain('box-shadow: var(--shadow-soft) !important;');
  });
});
