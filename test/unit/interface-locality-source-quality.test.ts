/*
 * File: interface-locality-source-quality.test.ts
 * Purpose: Guard the current interface-locality baseline before ownership splits.
 * Primary Responsibility: Fail when central type surfaces grow beyond the TSK-003-01 baseline.
 * Design Intent: Keep the first PR as an audit/gate slice, then let child PRs lower thresholds as locality improves.
 * Non-Goals: This test does not move interfaces, classify every import, or change product behavior.
 * Dependencies: Vitest, Git CLI, and repository-relative source paths.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const workspaceRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

/**
 * Counts repository matches through Git so ignore rules and tracked path semantics
 * stay aligned with the source-quality checks used in the repo.
 */
function gitGrepCount(pattern: string, paths: string[]) {
  try {
    const output = execFileSync('git', ['grep', '-n', pattern, '--', ...paths], {
      cwd: workspaceRoot,
      encoding: 'utf8',
    });
    return output.split(/\r?\n/).filter(Boolean).length;
  } catch {
    return 0;
  }
}

/**
 * Counts matches in a single source file when a regex is clearer than a Git grep
 * expression, especially for export-surface baselines.
 */
function countSourceMatches(file: string, pattern: RegExp) {
  const source = readFileSync(join(workspaceRoot, file), 'utf8');
  return [...source.matchAll(pattern)].length;
}

describe('interface locality source quality baseline', () => {
  it('keeps Worker central type surface from growing before locality splits', () => {
    expect(countSourceMatches('deploy/api-worker-shell/types.ts', /^export (type|interface) /gm)).toBeLessThanOrEqual(28);
    expect(
      gitGrepCount(
        'WorkerReviewReadService\\|WorkerCommunityRouteService\\|WorkerMyService\\|WorkerAdminService\\|WorkerStampService\\|WorkerReviewInteractionDeps\\|RouteRuntime',
        ['deploy/api-worker-shell/types.ts'],
      ),
    ).toBeLessThanOrEqual(13);
  });

  it('keeps frontend root type barrel usage from growing before locality splits', () => {
    const rootTypeImportPattern = "from '../types\\|from '../../types";

    expect(gitGrepCount(rootTypeImportPattern, ['src'])).toBeLessThanOrEqual(106);
    expect(gitGrepCount(rootTypeImportPattern, ['src/components'])).toBeLessThanOrEqual(44);
    expect(gitGrepCount(rootTypeImportPattern, ['src/hooks'])).toBeLessThanOrEqual(43);
  });

  it('keeps wide stage prop coupling from growing before stage-local props are split', () => {
    expect(
      gitGrepCount('Pick<AppPageStageProps\\|AppPageStageProps', [
        'src/components/page-stage',
        'src/components/AppPageStage.tsx',
        'src/hooks/usePageStageProps.ts',
      ]),
    ).toBeLessThanOrEqual(11);
  });

  it('keeps FastAPI compatibility model facade imports from growing', () => {
    expect(gitGrepCount('from \\.models import', ['backend/app'])).toBeLessThanOrEqual(5);
  });
});
