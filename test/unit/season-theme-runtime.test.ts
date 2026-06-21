import { describe, expect, it } from 'vitest';
import {
  applySeasonThemeToRoot,
  getSeasonForMonth,
  isSeasonThemeOverrideAllowed,
  readSeasonThemeOverride,
  resolveSeasonTheme,
  type SeasonTheme,
} from '../../src/lib/seasonTheme';

describe('season theme runtime contract', () => {
  it.each([
    [3, 'spring'],
    [4, 'spring'],
    [5, 'spring'],
    [6, 'summer'],
    [7, 'summer'],
    [8, 'summer'],
    [9, 'autumn'],
    [10, 'autumn'],
    [11, 'autumn'],
    [12, 'winter'],
    [1, 'winter'],
    [2, 'winter'],
  ] satisfies Array<[number, SeasonTheme]>)('maps month %s to %s', (month, season) => {
    expect(getSeasonForMonth(month)).toBe(season);
  });

  it('falls back to the current month when override is invalid', () => {
    expect(resolveSeasonTheme(new Date('2026-06-21T00:00:00+09:00'), 'monsoon', { allowOverride: true }))
      .toBe('summer');
  });

  it('ignores user query override when production override is not allowed', () => {
    expect(resolveSeasonTheme(new Date('2026-06-21T00:00:00+09:00'), 'winter', { allowOverride: false }))
      .toBe('summer');
  });

  it('uses valid override only when dev/test override is allowed', () => {
    expect(resolveSeasonTheme(new Date('2026-06-21T00:00:00+09:00'), 'winter', { allowOverride: true }))
      .toBe('winter');
  });

  it('reads query override before env override for dev and test harnesses', () => {
    expect(readSeasonThemeOverride('?seasonTheme=autumn', 'winter')).toBe('autumn');
    expect(readSeasonThemeOverride('?season-theme=summer', 'winter')).toBe('summer');
    expect(readSeasonThemeOverride('', 'winter')).toBe('winter');
  });

  it('allows query override only for local development hosts', () => {
    expect(isSeasonThemeOverrideAllowed('localhost')).toBe(true);
    expect(isSeasonThemeOverrideAllowed('127.0.0.1')).toBe(true);
    expect(isSeasonThemeOverrideAllowed('[::1]')).toBe(true);
    expect(isSeasonThemeOverrideAllowed('daejeon.jamissue.com')).toBe(false);
  });

  it('applies the resolved season to the document root dataset', () => {
    const root = document.createElement('html');

    applySeasonThemeToRoot(root, 'autumn');

    expect(root.dataset.seasonTheme).toBe('autumn');
  });
});
