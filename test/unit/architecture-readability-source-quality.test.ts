/*
 * File: architecture-readability-source-quality.test.ts
 * Purpose: Guard the current human-readable architecture baseline before readability refactors.
 * Primary Responsibility: Fail when directory depth, hook sprawl, large internal files, or import hot spots regress.
 * Design Intent: TSK-006-01 records the baseline first so later child issues can lower thresholds with evidence.
 * Non-Goals: This test does not move files, rename modules, or change product behavior.
 * Dependencies: Vitest, Git CLI, and repository-relative tracked source paths.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const workspaceRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const trackedSourceExtensions = /\.(ts|tsx)$/;
const trackedFrontendExtensions = /\.(ts|tsx)$/;

function collectTrackedFiles(paths: string[]) {
  const output = execFileSync('git', ['ls-files', ...paths], {
    cwd: workspaceRoot,
    encoding: 'utf8',
  });

  return output
    .split(/\r?\n/)
    .filter(Boolean)
    .filter((path) => existsSync(join(workspaceRoot, path)));
}

function countLines(path: string) {
  return readFileSync(join(workspaceRoot, path), 'utf8').split(/\r?\n/).length;
}

function countImportStatements(path: string) {
  return [...readFileSync(join(workspaceRoot, path), 'utf8').matchAll(/^import\s/gm)].length;
}

function pathDepth(path: string) {
  return path.split('/').length - 1;
}

describe('architecture readability source quality baseline', () => {
  it('keeps src/hooks root sprawl from growing before owner-folder grouping', () => {
    const hookFiles = collectTrackedFiles(['src/hooks']).filter((path) => trackedFrontendExtensions.test(path));
    const directRootHookFiles = hookFiles.filter((path) => path.split('/').length === 3);
    const tinyDirectRootHookFiles = directRootHookFiles.filter((path) => countLines(path) <= 15);

    expect(hookFiles.length).toBeLessThanOrEqual(90);
    expect(directRootHookFiles.length).toBeLessThanOrEqual(35);
    expect(tinyDirectRootHookFiles.length).toBeLessThanOrEqual(9);
  });

  it('keeps large production TypeScript files explicit before business-language slicing', () => {
    const largeFiles = collectTrackedFiles(['src'])
      .filter((path) => trackedFrontendExtensions.test(path))
      .filter((path) => countLines(path) > 250)
      .sort();

    expect(largeFiles).toEqual([]);
  });

  it('keeps import hot spots explicit after app-shell composition moves out of App', () => {
    const hotSpots = collectTrackedFiles(['src'])
      .filter((path) => trackedFrontendExtensions.test(path))
      .map((path) => ({ path, imports: countImportStatements(path) }))
      .filter(({ imports }) => imports > 10)
      .sort((left, right) => left.path.localeCompare(right.path));

    expect(hotSpots).toEqual([
      { path: 'src/App.tsx', imports: 16 },
      { path: 'src/components/MyPagePanel.tsx', imports: 11 },
      { path: 'src/hooks/app-bootstrap/useAppBootstrapLifecycle.ts', imports: 11 },
      { path: 'src/hooks/app-tab-loaders/useAppTabDataLoaders.ts', imports: 11 },
    ]);
  });

  it('records current area depth without allowing new tracked source depth spikes', () => {
    const sourceFiles = collectTrackedFiles(['src', 'test/unit']).filter(
      (path) => trackedSourceExtensions.test(path),
    );
    const depthLimits = new Map([
      ['src', 3],
      ['test/unit', 2],
    ]);

    for (const [area, limit] of depthLimits) {
      const files = sourceFiles.filter((path) => path.startsWith(`${area}/`));
      const maxDepth = Math.max(...files.map(pathDepth));

      expect(files.length, `${area} must have tracked source files`).toBeGreaterThan(0);
      expect(maxDepth, `${area} max tracked source depth`).toBeLessThanOrEqual(limit);
    }
  });
});
