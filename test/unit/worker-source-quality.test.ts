import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const workspaceRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const maxWorkerLineLength = 3_500;

function collectTrackedWorkerTsFiles(): string[] {
  const output = execFileSync(
    'git',
    ['ls-files', 'deploy/api-worker-shell/*.ts', 'deploy/api-worker-shell/**/*.ts'],
    { cwd: workspaceRoot, encoding: 'utf8' },
  );

  return output
    .split(/\r?\n/)
    .filter(Boolean)
    .map((path) => join(workspaceRoot, path));
}

describe('worker source quality gates', () => {
  it('keeps tracked Worker TypeScript files from regressing into one-line blobs', () => {
    const workerFiles = collectTrackedWorkerTsFiles();

    expect(workerFiles.length).toBeGreaterThan(0);
    for (const file of workerFiles) {
      const source = readFileSync(file, 'utf8');
      const lines = source.split(/\r?\n/);
      const longestLine = Math.max(...lines.map((line) => line.length));
      const relativePath = relative(workspaceRoot, file);

      expect(relativePath, 'worker quality gate must inspect tracked source only').not.toContain('.wrangler');
      if (source.length > 1_000) {
        expect(lines.length, `${relativePath} should stay reviewable`).toBeGreaterThan(1);
      }
      expect(longestLine, `${relativePath} has a suspiciously long line`).toBeLessThanOrEqual(maxWorkerLineLength);
    }
  });
});
