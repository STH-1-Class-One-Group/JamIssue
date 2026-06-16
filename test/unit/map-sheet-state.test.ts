import { describe, expect, it } from 'vitest';
import {
  buildMapSheetClassName,
  getCollapsedDrawerState,
  getExpandedDrawerState,
  resolveMapSheetState,
} from '../../src/components/map-stage/mapSheetState';

describe('mapSheetState', () => {
  it('maps canonical route drawer states to app sheet states', () => {
    expect(resolveMapSheetState(false, 'peek')).toBe('hidden');
    expect(resolveMapSheetState(true, 'closed')).toBe('hidden');
    expect(resolveMapSheetState(true, 'peek')).toBe('peek');
    expect(resolveMapSheetState(true, 'half')).toBe('half');
    expect(resolveMapSheetState(true, 'full')).toBe('full');
  });

  it('adds app sheet state classes from canonical route states', () => {
    expect(buildMapSheetClassName('place-drawer', 'peek', 'peek')).toBe(
      'place-drawer place-drawer--peek place-drawer--route-peek',
    );
    expect(buildMapSheetClassName('place-drawer', 'half', 'half')).toBe(
      'place-drawer place-drawer--half place-drawer--route-half',
    );
    expect(buildMapSheetClassName('place-drawer', 'full', 'full')).toBe(
      'place-drawer place-drawer--full place-drawer--route-full',
    );
  });

  it('keeps drawer expansion and collapse as one-step state transitions', () => {
    expect(getExpandedDrawerState('closed')).toBe('peek');
    expect(getExpandedDrawerState('peek')).toBe('half');
    expect(getExpandedDrawerState('half')).toBe('full');
    expect(getExpandedDrawerState('full')).toBe('full');

    expect(getCollapsedDrawerState('full')).toBe('half');
    expect(getCollapsedDrawerState('half')).toBe('peek');
    expect(getCollapsedDrawerState('peek')).toBe('closed');
    expect(getCollapsedDrawerState('closed')).toBe('closed');
  });
});
