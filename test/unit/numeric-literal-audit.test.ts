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
});
