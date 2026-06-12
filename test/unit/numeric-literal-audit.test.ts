import { describe, expect, it } from 'vitest';
import {
  auditNumericLiterals,
  compareAuditToBaseline,
  loadNumericLiteralBaseline,
} from '../../scripts/numeric-literal-audit';

describe('numeric literal config audit', () => {
  it('keeps production numeric literals classified by config-hardening owner', () => {
    const baseline = loadNumericLiteralBaseline();

    expect(baseline.version).toBe(1);
    expect(baseline.files.length).toBeGreaterThan(0);
    expect(baseline.files.every((file) => file.owner && file.category && file.scopeId && file.reason)).toBe(true);
    expect(baseline.files.filter((file) => file.category === 'unclassified-production-literal')).toEqual([]);
  });

  it('fails when production numeric literal counts drift without updating the baseline', () => {
    const current = auditNumericLiterals();
    const baseline = loadNumericLiteralBaseline();

    expect(compareAuditToBaseline(current, baseline)).toEqual([]);
  });

  it('reports missing, changed, and stale baseline entries', () => {
    const current = [{
      path: 'src/example.ts',
      count: 2,
      owner: 'frontend-ui',
      category: 'frontend-ui-inline-token-baseline',
      scopeId: 'TSK-002-03-FRONTEND-UI-TOKEN-CONFIG',
      reason: 'test',
      examples: [],
    }];
    const baseline = {
      version: 1,
      generatedFrom: 'test',
      policy: 'test',
      files: [{
        path: 'src/example.ts',
        count: 1,
        owner: 'frontend-ui',
        category: 'frontend-ui-inline-token-baseline',
        scopeId: 'TSK-002-03-FRONTEND-UI-TOKEN-CONFIG',
        reason: 'test',
        examples: [],
      }, {
        path: 'src/stale.ts',
        count: 1,
        owner: 'frontend-ui',
        category: 'frontend-ui-inline-token-baseline',
        scopeId: 'TSK-002-03-FRONTEND-UI-TOKEN-CONFIG',
        reason: 'test',
        examples: [],
      }],
    };

    expect(compareAuditToBaseline(current, baseline)).toEqual([
      'src/example.ts: expected 1 numeric literals, found 2',
      'src/stale.ts: exists in baseline but is no longer audited',
    ]);
    expect(compareAuditToBaseline([
      ...current,
      { ...current[0], path: 'src/new.ts' },
    ], { ...baseline, files: [] })).toEqual([
      'src/example.ts: has 2 numeric literals but is missing from the baseline',
      'src/new.ts: has 2 numeric literals but is missing from the baseline',
    ]);
  });
});
