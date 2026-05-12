import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const workspaceRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const maxWorkerLineLength = 3_500;
const maxWorkerSemicolonsPerLine = 6;

function countSourceMatches(file: string, pattern: RegExp): number {
  const source = readFileSync(join(workspaceRoot, file), 'utf8');
  return [...source.matchAll(pattern)].length;
}

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
      const mostSemicolonsOnLine = Math.max(...lines.map((line) => [...line.matchAll(/;/g)].length));
      const relativePath = relative(workspaceRoot, file);

      expect(relativePath, 'worker quality gate must inspect tracked source only').not.toContain('.wrangler');
      if (source.length > 1_000) {
        expect(lines.length, `${relativePath} should stay reviewable`).toBeGreaterThan(1);
      }
      expect(longestLine, `${relativePath} has a suspiciously long line`).toBeLessThanOrEqual(maxWorkerLineLength);
      expect(mostSemicolonsOnLine, `${relativePath} has too many statements on one line`).toBeLessThanOrEqual(
        maxWorkerSemicolonsPerLine,
      );
    }
  });

  it('keeps the TSK-004 residual Worker boundary audit from worsening before child splits', () => {
    const residualBoundaryBaseline = [
      {
        file: 'deploy/api-worker-shell/services/festivals.ts',
        limits: {
          any: 3,
          envAny: 1,
          anyArray: 1,
          supabaseRequest: 9,
          exportedHandlers: 3,
        },
      },
      {
        file: 'deploy/api-worker-shell/services/admin.ts',
        limits: {
          any: 0,
          envAny: 0,
          categoryAny: 0,
        },
      },
      {
        file: 'deploy/api-worker-shell/services/reviews.ts',
        limits: {
          supabaseRequest: 23,
        },
      },
      {
        file: 'deploy/api-worker-shell/services/notifications.ts',
        limits: {
          supabaseRequest: 11,
          exportedHandlers: 5,
          implicitEnvSignatures: 0,
        },
      },
      {
        file: 'deploy/api-worker-shell/services/stamps.ts',
        limits: {
          supabaseRequest: 10,
          implicitRequestBodyReaders: 0,
          implicitEnvSignatures: 0,
        },
      },
      {
        file: 'deploy/api-worker-shell/services/auth.ts',
        limits: {
          promiseAny: 0,
          exportedHandlers: 8,
        },
      },
      {
        file: 'deploy/api-worker-shell/services/review-interactions.ts',
        limits: {
          promiseAny: 0,
          exportedHandlers: 8,
        },
      },
      {
        file: 'deploy/api-worker-shell/services/review-domain/mapper.ts',
        limits: {
          any: 0,
          mapAny: 0,
          anyArray: 0,
        },
      },
      {
        file: 'deploy/api-worker-shell/services/community-domain/mapper.ts',
        limits: {
          any: 0,
          mapAny: 0,
          anyArray: 0,
        },
      },
      {
        file: 'deploy/api-worker-shell/services/my-domain/mapper.ts',
        limits: {
          any: 0,
          mapAny: 0,
          anyArray: 0,
        },
      },
      {
        file: 'deploy/api-worker-shell/services/community-domain/repository.ts',
        limits: {
          any: 0,
          mapAny: 0,
          anyArray: 0,
        },
      },
      {
        file: 'deploy/api-worker-shell/services/my-domain/repository.ts',
        limits: {
          any: 0,
          mapAny: 0,
          anyArray: 0,
        },
      },
    ];

    for (const { file, limits } of residualBoundaryBaseline) {
      const expectLimit = (key: keyof typeof limits, pattern: RegExp, label: string) => {
        const limit = limits[key];
        if (limit === undefined) {
          return;
        }
        expect(countSourceMatches(file, pattern), `${file} ${label}`).toBeLessThanOrEqual(limit);
      };

      expectLimit('any', /\bany\b/g, 'any count');
      expectLimit('envAny', /env:\s*any/g, 'env:any count');
      expectLimit('categoryAny', /category:\s*any/g, 'category:any count');
      expectLimit('promiseAny', /Promise<any>/g, 'Promise<any> count');
      expectLimit('mapAny', /Map<any/g, 'Map<any count');
      expectLimit('anyArray', /any\[\]/g, 'any[] count');
      expectLimit('supabaseRequest', /\bsupabaseRequest\b/g, 'supabaseRequest count');
      expectLimit('exportedHandlers', /^export\s+async\s+function\s+handle/gm, 'exported handler count');
      expectLimit(
        'implicitEnvSignatures',
        /export\s+async\s+function\s+\w+\([^)]*\benv\b(?!\s*:)/g,
        'implicit env signature count',
      );
      expectLimit(
        'implicitRequestBodyReaders',
        /async\s+function\s+readJsonBody\(request\)/g,
        'implicit request body reader count',
      );
    }
  });

  it('keeps the Worker route runtime contract owned by the runtime layer', () => {
    const routingSource = readFileSync(join(workspaceRoot, 'deploy/api-worker-shell/runtime/routing.ts'), 'utf8');
    const runtimeContractSource = readFileSync(join(workspaceRoot, 'deploy/api-worker-shell/runtime/route-runtime.ts'), 'utf8');
    const globalTypesSource = readFileSync(join(workspaceRoot, 'deploy/api-worker-shell/types.ts'), 'utf8');

    expect(routingSource).toContain("import type { RouteRuntime } from './route-runtime';");
    expect(routingSource).not.toContain('interface RouteRuntime');
    expect(runtimeContractSource).toContain('export interface RouteRuntime');
    expect(runtimeContractSource).toContain('loadCuratedCourses');
    expect(runtimeContractSource).not.toContain('Supabase');
    expect(runtimeContractSource).not.toContain('loadStaticBaseRows');
    expect(runtimeContractSource).not.toContain('mapCourses');
    expect(runtimeContractSource).not.toContain('mapPlace');
    expect(globalTypesSource).not.toContain('interface RouteRuntime');
    expect(globalTypesSource).not.toContain('WorkerReviewReadService');
    expect(globalTypesSource).not.toContain('WorkerReviewInteractionDeps');
  });

  it('keeps routing dispatch separate from route registry and proxy helpers', () => {
    const routingSource = readFileSync(join(workspaceRoot, 'deploy/api-worker-shell/runtime/routing.ts'), 'utf8');
    const routeRegistrySource = readFileSync(join(workspaceRoot, 'deploy/api-worker-shell/runtime/route-registry.ts'), 'utf8');
    const proxySource = readFileSync(join(workspaceRoot, 'deploy/api-worker-shell/runtime/proxy.ts'), 'utf8');

    expect(routingSource).toContain('createExactRoutes');
    expect(routingSource).toContain('createPatternRoutes');
    expect(routingSource).not.toContain('const exactRoutes');
    expect(routingSource).not.toContain('const patternRoutes');
    expect(routingSource).not.toContain('function handleHealth');
    expect(routingSource).not.toContain('APP_ORIGIN_API_URL');
    expect(routeRegistrySource).toContain('export function createExactRoutes');
    expect(routeRegistrySource).toContain('export function createPatternRoutes');
    expect(proxySource).toContain('export async function proxyToOrigin');
  });

  it('keeps base-data facade separated from repository and mapper responsibilities', () => {
    const facadeSource = readFileSync(join(workspaceRoot, 'deploy/api-worker-shell/runtime/base-data.ts'), 'utf8');
    const assemblerSource = readFileSync(join(workspaceRoot, 'deploy/api-worker-shell/runtime/base-data-assembler.ts'), 'utf8');
    const repositorySource = readFileSync(join(workspaceRoot, 'deploy/api-worker-shell/runtime/base-data-repository.ts'), 'utf8');

    expect(facadeSource).toContain("from './base-data-repository'");
    expect(facadeSource).toContain("from './base-data-mappers'");
    expect(facadeSource).not.toContain('supabaseRequest');
    expect(facadeSource).not.toContain('function mapPlace');
    expect(assemblerSource).not.toContain('supabaseRequest');
    expect(repositorySource).toContain('supabaseRequest');
  });

  it('keeps review interaction persistence behind the review repository boundary', () => {
    const interactionSource = readFileSync(join(workspaceRoot, 'deploy/api-worker-shell/services/review-interactions.ts'), 'utf8');
    const repositorySource = readFileSync(join(workspaceRoot, 'deploy/api-worker-shell/services/review-domain/repository.ts'), 'utf8');
    const reviewReadSource = readFileSync(join(workspaceRoot, 'deploy/api-worker-shell/services/reviews.ts'), 'utf8');

    expect(interactionSource).not.toContain('supabaseRequest');
    expect(interactionSource).not.toContain('feed?select=');
    expect(reviewReadSource).toContain("import { createReviewMapper } from './review-domain/mapper';");
    expect(reviewReadSource).not.toContain('function mapReviewRows');
    expect(repositorySource).toContain('supabaseRequest');
  });

  it('keeps account, community, and admin service persistence behind domain repositories', () => {
    const serviceFiles = [
      'deploy/api-worker-shell/services/admin.ts',
      'deploy/api-worker-shell/services/community-routes.ts',
      'deploy/api-worker-shell/services/my.ts',
    ];

    for (const file of serviceFiles) {
      const source = readFileSync(join(workspaceRoot, file), 'utf8');
      expect(source, file).not.toContain('supabaseRequest');
    }

    expect(readFileSync(join(workspaceRoot, 'deploy/api-worker-shell/services/admin-domain/repository.ts'), 'utf8')).toContain('supabaseRequest');
    expect(readFileSync(join(workspaceRoot, 'deploy/api-worker-shell/services/community-domain/repository.ts'), 'utf8')).toContain('supabaseRequest');
    expect(readFileSync(join(workspaceRoot, 'deploy/api-worker-shell/services/my-domain/repository.ts'), 'utf8')).toContain('supabaseRequest');
  });

  it('keeps Worker tests from importing local contracts from the global type barrel', () => {
    const testImportSource = execFileSync('git', ['grep', '-n', 'deploy/api-worker-shell/types', '--', 'test/unit'], {
      cwd: workspaceRoot,
      encoding: 'utf8',
    })
      .split(/\r?\n/)
      .filter((line) => line.includes('import type'))
      .join('\n');

    expect(testImportSource).not.toMatch(
      /RouteRuntime|WorkerBaseData|WorkerStaticBaseRows|WorkerReviewInteractionDeps|Supabase[A-Za-z]+Row/,
    );
  });

  it('keeps Worker service constructor dependency contracts explicit', () => {
    const serviceFiles = [
      'deploy/api-worker-shell/services/reviews.ts',
      'deploy/api-worker-shell/services/my.ts',
      'deploy/api-worker-shell/services/community-routes.ts',
    ];

    for (const file of serviceFiles) {
      const source = readFileSync(join(workspaceRoot, file), 'utf8');
      expect(source, file).not.toMatch(/export function create[A-Za-z]+Service\([^)]*\bany\b/s);
    }
  });
});
