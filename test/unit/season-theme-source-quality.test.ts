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
    maxCount: 195,
    reason: 'legacy app chrome and component CSS seasonal tokenization backlog for TSK-019-02~04',
  },
  'src/styles/refinements.css': {
    maxCount: 140,
    reason: 'legacy refinement overrides to migrate behind seasonal semantic tokens',
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

      expect(count).toBeGreaterThan(100);
      expect(allowedRawColorOwners[repoPath].reason).toContain('seasonal');
    }
  });

  it('does not expose a production season switcher in source', () => {
    const source = listSourceFiles(join(workspaceRoot, 'src'))
      .map((file) => readFileSync(file, 'utf8'))
      .join('\n');

    expect(source).not.toMatch(/SeasonSwitcher|season-switcher|data-season-switcher/);
  });
});
