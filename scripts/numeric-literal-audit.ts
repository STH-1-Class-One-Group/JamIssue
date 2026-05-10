import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

export interface NumericLiteralFinding {
  value: string;
  line: number;
  column: number;
}

export interface NumericLiteralFileAudit {
  path: string;
  count: number;
  owner: string;
  category: string;
  scopeId: string;
  reason: string;
  examples: NumericLiteralFinding[];
}

export interface NumericLiteralBaseline {
  version: number;
  generatedFrom: string;
  policy: string;
  files: NumericLiteralFileAudit[];
}

const workspaceRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const baselinePath = join(workspaceRoot, 'scripts', 'numeric-literal-baseline.json');
const numericLiteralPattern = /(^|[^\w.])([-+]?\d[\d_]*(?:\.\d+)?(?:px|rem|em|vh|vw|%|ms|s|m|deg)?)(?![\w])/g;
const maxExamplesPerFile = 6;

function isAuditedProductionFile(path: string) {
  const normalized = path.replace(/\\/g, '/');
  if (normalized === 'scripts/numeric-literal-audit.ts') {
    return false;
  }
  if (normalized.startsWith('test/') || normalized.startsWith('backend/tests/')) {
    return false;
  }
  if (normalized.startsWith('backend/data/')) {
    return false;
  }

  return (
    /^src\/.+\.(ts|tsx|css)$/.test(normalized)
    || /^deploy\/api-worker-shell\/.+\.ts$/.test(normalized)
    || /^backend\/app\/.+\.py$/.test(normalized)
    || normalized === 'backend/run_appserver.py'
    || /^scripts\/.+\.(ts|mjs|ps1)$/.test(normalized)
  );
}

function listTrackedProductionFiles() {
  const output = execFileSync('git', ['ls-files'], { cwd: workspaceRoot, encoding: 'utf8' });
  return output
    .split(/\r?\n/)
    .filter(Boolean)
    .filter(isAuditedProductionFile)
    .sort();
}

function locateOffset(source: string, offset: number) {
  const before = source.slice(0, offset);
  const lines = before.split(/\r?\n/);
  return {
    line: lines.length,
    column: lines[lines.length - 1].length + 1,
  };
}

function inferClassification(path: string): Pick<NumericLiteralFileAudit, 'owner' | 'category' | 'scopeId' | 'reason'> {
  if (path.endsWith('.css')) {
    return {
      owner: 'frontend-ui',
      category: 'css-layout-token-baseline',
      scopeId: 'TSK-002-03-FRONTEND-UI-TOKEN-CONFIG',
      reason: 'CSS layout, spacing, radius, color, shadow, or motion values are migrated through UI token work.',
    };
  }
  if (path === 'src/config/mapConfig.ts') {
    return {
      owner: 'frontend-map',
      category: 'map-geo-config-baseline',
      scopeId: 'TSK-002-02-FRONTEND-MAP-GEO-CONFIG',
      reason: 'Map viewport, marker layer, selection-motion, geolocation, and distance values are owned by map config.',
    };
  }
  if (path === 'src/config/uiTokenConfig.ts') {
    return {
      owner: 'frontend-ui',
      category: 'frontend-ui-token-config-baseline',
      scopeId: 'TSK-002-03-FRONTEND-UI-TOKEN-CONFIG',
      reason: 'Inline review image frame layout and transform values are owned by UI token config.',
    };
  }
  if (path === 'src/config/runtimeLimitConfig.ts') {
    return {
      owner: 'frontend-runtime',
      category: 'frontend-runtime-limit-config-baseline',
      scopeId: 'TSK-002-04-FRONTEND-RUNTIME-LIMIT-CONFIG',
      reason: 'API cache TTL, upload compression, autoload, pagination, feedback, and floating-button runtime values are owned by runtime limit config.',
    };
  }
  if (path.includes('/naver-map/') || path.includes('mapViewportState')) {
    return {
      owner: 'frontend-map',
      category: 'map-coordinate-marker-baseline',
      scopeId: 'TSK-002-02-FRONTEND-MAP-GEO-CONFIG',
      reason: 'Map center, zoom, marker, overlay, or selection-motion values are migrated through map config work.',
    };
  }
  if (path.includes('geolocation') || path.includes('visits')) {
    return {
      owner: 'frontend-map',
      category: 'geolocation-threshold-baseline',
      scopeId: 'TSK-002-02-FRONTEND-MAP-GEO-CONFIG',
      reason: 'Distance, radius, accuracy, and timeout values are migrated through geolocation config work.',
    };
  }
  if (path.includes('imageUpload') || path.includes('/api/') || path.includes('useAutoLoadMore') || path.includes('floating-back-button')) {
    return {
      owner: 'frontend-runtime',
      category: 'frontend-runtime-limit-baseline',
      scopeId: 'TSK-002-04-FRONTEND-RUNTIME-LIMIT-CONFIG',
      reason: 'Upload limits, cache TTLs, autoload margins, and interaction delays are migrated through runtime config work.',
    };
  }
  if (path.startsWith('deploy/api-worker-shell/')) {
    return {
      owner: 'worker-backend',
      category: 'worker-runtime-limit-baseline',
      scopeId: 'TSK-002-05-WORKER-RUNTIME-CONFIG',
      reason: 'Worker TTL, limit, status, session, route, and adapter values are migrated through Worker config work.',
    };
  }
  if (path.startsWith('backend/')) {
    return {
      owner: 'fastapi-backend',
      category: 'fastapi-runtime-config-baseline',
      scopeId: 'TSK-002-06-FASTAPI-RUNTIME-CONFIG-REVIEW',
      reason: 'FastAPI settings, model limits, service thresholds, and repository constants are reviewed through FastAPI config work.',
    };
  }
  if (path.startsWith('src/')) {
    return {
      owner: 'frontend-ui',
      category: 'frontend-ui-inline-token-baseline',
      scopeId: 'TSK-002-03-FRONTEND-UI-TOKEN-CONFIG',
      reason: 'Frontend component, hook, store, and UI-domain numeric values are classified for token or config review.',
    };
  }
  if (path.startsWith('scripts/')) {
    return {
      owner: 'tooling',
      category: 'tooling-script-baseline',
      scopeId: 'TSK-002-01-HARDCODED-VALUE-AUDIT',
      reason: 'Build, smoke, sync, and data scripts are tracked by the audit baseline before later extraction decisions.',
    };
  }
  return {
    owner: 'unknown',
    category: 'unclassified-production-literal',
    scopeId: 'TSK-002-01-HARDCODED-VALUE-AUDIT',
    reason: 'This file must be assigned to a concrete config hardening child issue before implementation proceeds.',
  };
}

export function auditNumericLiterals() {
  return listTrackedProductionFiles()
    .map((path): NumericLiteralFileAudit | null => {
      const source = readFileSync(join(workspaceRoot, path), 'utf8');
      const findings: NumericLiteralFinding[] = [];
      let match: RegExpExecArray | null;

      numericLiteralPattern.lastIndex = 0;
      while ((match = numericLiteralPattern.exec(source)) !== null) {
        const value = match[2];
        const offset = match.index + match[1].length;
        const location = locateOffset(source, offset);
        findings.push({ value, ...location });
      }

      if (findings.length === 0) {
        return null;
      }

      return {
        path,
        count: findings.length,
        ...inferClassification(path),
        examples: findings.slice(0, maxExamplesPerFile),
      };
    })
    .filter((entry): entry is NumericLiteralFileAudit => entry !== null)
    .sort((a, b) => a.path.localeCompare(b.path));
}

export function createNumericLiteralBaseline(generatedFrom: string): NumericLiteralBaseline {
  return {
    version: 1,
    generatedFrom,
    policy: 'TSK-002 requires every production numeric literal file to be classified before config extraction work starts.',
    files: auditNumericLiterals(),
  };
}

export function loadNumericLiteralBaseline(): NumericLiteralBaseline {
  if (!existsSync(baselinePath)) {
    throw new Error(`Numeric literal baseline is missing: ${relative(workspaceRoot, baselinePath)}`);
  }
  return JSON.parse(readFileSync(baselinePath, 'utf8')) as NumericLiteralBaseline;
}

export function compareAuditToBaseline(current: NumericLiteralFileAudit[], baseline: NumericLiteralBaseline) {
  const baselineCounts = new Map(baseline.files.map((file) => [file.path, file.count]));
  const currentCounts = new Map(current.map((file) => [file.path, file.count]));
  const failures: string[] = [];

  for (const file of current) {
    const expectedCount = baselineCounts.get(file.path);
    if (expectedCount === undefined) {
      failures.push(`${file.path}: has ${file.count} numeric literals but is missing from the baseline`);
      continue;
    }
    if (expectedCount !== file.count) {
      failures.push(`${file.path}: expected ${expectedCount} numeric literals, found ${file.count}`);
    }
  }

  for (const file of baseline.files) {
    if (!currentCounts.has(file.path)) {
      failures.push(`${file.path}: exists in baseline but is no longer audited`);
    }
  }

  return failures;
}

function currentMainSha() {
  return execFileSync('git', ['rev-parse', 'HEAD'], { cwd: workspaceRoot, encoding: 'utf8' }).trim();
}

function writeBaseline() {
  const baseline = createNumericLiteralBaseline(currentMainSha());
  writeFileSync(baselinePath, `${JSON.stringify(baseline, null, 2)}\n`, 'utf8');
  return baseline;
}

if (process.argv.includes('--write')) {
  const baseline = writeBaseline();
  console.log(`Wrote ${relative(workspaceRoot, baselinePath)} with ${baseline.files.length} classified files.`);
} else if (process.argv.includes('--check')) {
  const failures = compareAuditToBaseline(auditNumericLiterals(), loadNumericLiteralBaseline());
  if (failures.length > 0) {
    console.error(failures.join('\n'));
    process.exit(1);
  }
  console.log('Numeric literal baseline is current.');
}
