import { describe, expect, it } from 'vitest';
import { buildMapSheetClassName, resolveMapSheetState } from '../../src/components/map-stage/mapSheetState';

describe('mapSheetState', () => {
  it('keeps route drawer states compatible while exposing app sheet states', () => {
    expect(resolveMapSheetState(false, 'partial')).toBe('hidden');
    expect(resolveMapSheetState(true, 'closed')).toBe('hidden');
    expect(resolveMapSheetState(true, 'partial')).toBe('peek');
    expect(resolveMapSheetState(true, 'full')).toBe('full');
  });

  it('adds app sheet state classes without dropping legacy route classes', () => {
    expect(buildMapSheetClassName('place-drawer', 'peek', 'partial')).toBe(
      'place-drawer place-drawer--peek place-drawer--partial place-drawer--route-partial',
    );
    expect(buildMapSheetClassName('place-drawer', 'full', 'full')).toBe(
      'place-drawer place-drawer--full place-drawer--route-full',
    );
  });
});
