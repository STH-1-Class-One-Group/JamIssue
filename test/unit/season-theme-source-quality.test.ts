/*
 * File: season-theme-source-quality.test.ts
 * Purpose: Record the TSK-019 seasonal-theme hardcoded color baseline.
 * Primary Responsibility: Fail when new unclassified theme-affecting color literals are added.
 * Design Intent: Keep the first seasonal-theme slice as an audit/gate baseline before migration.
 * Non-Goals: This test does not require every existing color to be tokenized in this slice.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const workspaceRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const rawColorPattern =
  /#[0-9a-fA-F]{3,8}|rgba?\([^)]*\)|(?:linear|radial)-gradient\([^;\n]*\)|color-mix\([^;\n]*\)/g;

type ColorOwner = {
  maxCount: number;
  reason: string;
};

const allowedRawColorOwners: Record<string, ColorOwner> = {
  'src/index.css': {
    maxCount: 124,
    reason: 'remaining legacy app chrome CSS seasonal tokenization backlog after TSK-019-04 migration',
  },
  'src/styles/refinements.css': {
    maxCount: 100,
    reason: 'remaining seasonal refinement overrides after TSK-019-04 semantic token migration',
  },
  'src/styles/semantic.css': {
    maxCount: 24,
    reason: 'component-facing semantic token aliases may compose seasonal palette values with color-mix',
  },
  'src/styles/themes/autumn.css': {
    maxCount: 17,
    reason: 'seasonal palette token file allowed to own autumn raw color values',
  },
  'src/styles/themes/spring.css': {
    maxCount: 17,
    reason: 'seasonal palette token file allowed to own spring raw color values',
  },
  'src/styles/themes/summer.css': {
    maxCount: 17,
    reason: 'seasonal palette token file allowed to own summer raw color values',
  },
  'src/styles/themes/winter.css': {
    maxCount: 17,
    reason: 'seasonal palette token file allowed to own winter raw color values',
  },
  'src/lib/categories.ts': {
    maxCount: 8,
    reason: 'category-owned semantic marker palette, not a seasonal app chrome token',
  },
  'src/config/uiTokenConfig.ts': {
    maxCount: 9,
    reason: 'Naver marker visual config boundary with SDK HTML marker colors',
  },
  'src/components/map-stage/MapStageCategoryStrip.tsx': {
    maxCount: 2,
    reason: 'category chip inline style bridge to category-owned palette',
  },
  'src/components/place/PlaceBadgeRow.tsx': {
    maxCount: 1,
    reason: 'badge inline style bridge to category-owned palette',
  },
  'src/components/naver-map/markerContent.ts': {
    maxCount: 21,
    reason: 'Naver SDK HTML marker content boundary and map marker semantics',
  },
  'src/components/RoadmapBannerPreview.tsx': {
    maxCount: 2,
    reason: 'roadmap preview accent state, not part of production seasonal app chrome',
  },
  'src/components/naver-map/useNaverRoutePreviewOverlay.ts': {
    maxCount: 1,
    reason: 'Naver route preview overlay stroke color',
  },
};

function toRepoPath(path: string) {
  return relative(workspaceRoot, path).split(sep).join('/');
}

function listSourceFiles(root: string): string[] {
  if (!existsSync(root)) {
    return [];
  }

  return readdirSync(root).flatMap((entry) => {
    const absolutePath = join(root, entry);
    const stats = statSync(absolutePath);

    if (stats.isDirectory()) {
      return listSourceFiles(absolutePath);
    }

    if (/\.(css|ts|tsx)$/.test(entry)) {
      return [absolutePath];
    }

    return [];
  });
}

function countRawColors(repoPath: string) {
  const source = readFileSync(join(workspaceRoot, repoPath), 'utf8');
  return source.match(rawColorPattern)?.length ?? 0;
}

describe('season theme source quality baseline', () => {
  it('keeps every raw seasonal color literal under a classified owner', () => {
    const sourceFiles = listSourceFiles(join(workspaceRoot, 'src'));
    const rawColorFiles = sourceFiles
      .map((file) => toRepoPath(file))
      .filter((file) => countRawColors(file) > 0)
      .sort();

    expect(rawColorFiles).toEqual(Object.keys(allowedRawColorOwners).sort());
  });

  it('prevents classified raw color owner budgets from increasing before token migration', () => {
    for (const [repoPath, owner] of Object.entries(allowedRawColorOwners)) {
      expect(owner.reason.length).toBeGreaterThan(12);
      expect(countRawColors(repoPath), repoPath).toBeLessThanOrEqual(owner.maxCount);
    }
  });

  it('documents the current app chrome seasonal-theme migration backlog', () => {
    const migrationBacklog = [
      'src/index.css',
      'src/styles/refinements.css',
    ];

    for (const repoPath of migrationBacklog) {
      const count = countRawColors(repoPath);

      expect(count).toBeGreaterThanOrEqual(100);
      expect(allowedRawColorOwners[repoPath].reason).toContain('seasonal');
    }
  });

  it('keeps the seasonal semantic token boundary in source', () => {
    const expectedTokenFiles = [
      'src/styles/semantic.css',
      'src/styles/themes/autumn.css',
      'src/styles/themes/spring.css',
      'src/styles/themes/summer.css',
      'src/styles/themes/winter.css',
    ];

    for (const repoPath of expectedTokenFiles) {
      expect(existsSync(join(workspaceRoot, repoPath)), repoPath).toBe(true);
    }

    const indexCss = readFileSync(join(workspaceRoot, 'src/index.css'), 'utf8');

    expect(indexCss).toContain("@import './styles/semantic.css';");
    expect(indexCss).toContain('--pink: var(--color-accent);');
    expect(indexCss).toContain('--pink-deep: var(--color-accent-strong);');
    expect(indexCss).toContain('--app-surface-background:\n    var(--surface-app);');
  });

  it('routes migrated app chrome surfaces through semantic component tokens', () => {
    const indexCss = readFileSync(join(workspaceRoot, 'src/index.css'), 'utf8');
    const refinementsCss = readFileSync(join(workspaceRoot, 'src/styles/refinements.css'), 'utf8');
    const semanticCss = readFileSync(join(workspaceRoot, 'src/styles/semantic.css'), 'utf8');

    expect(semanticCss).toContain('--nav-surface:');
    expect(semanticCss).toContain('--sheet-surface:');
    expect(semanticCss).toContain('--feed-avatar-bg:');
    expect(indexCss).toContain('background: var(--nav-surface);');
    expect(indexCss).toContain('background: var(--sheet-surface);');
    expect(indexCss).toContain('background: var(--page-panel-surface);');
    expect(refinementsCss).toContain('--ui-control-bg: var(--control-bg);');
    expect(refinementsCss).toContain('background: var(--feed-avatar-bg) !important;');
  });

  it('does not expose a production season switcher in source', () => {
    const source = listSourceFiles(join(workspaceRoot, 'src'))
      .map((file) => readFileSync(file, 'utf8'))
      .join('\n');

    expect(source).not.toMatch(/SeasonSwitcher|season-switcher|data-season-switcher/);
  });
});
