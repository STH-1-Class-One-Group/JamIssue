import { describe, expect, it } from 'vitest';
import {
  APP_PREFERENCES_STORAGE_KEY,
  DEFAULT_APP_PREFERENCES,
  normalizeAppPreferences,
  readAppPreferences,
  shouldShowCuratedMapItems,
  writeAppPreferences,
} from '../../src/lib/appPreferences';

function createMemoryStorage(initialValue?: string) {
  let value = initialValue ?? null;

  return {
    getItem: (key: string) => (key === APP_PREFERENCES_STORAGE_KEY ? value : null),
    setItem: (key: string, nextValue: string) => {
      if (key === APP_PREFERENCES_STORAGE_KEY) {
        value = nextValue;
      }
    },
  };
}

describe('app display preferences', () => {
  it('keeps curated map items visible by default', () => {
    expect(DEFAULT_APP_PREFERENCES.showCuratedWithTourism).toBe(true);
    expect(shouldShowCuratedMapItems({
      showTourismInfo: false,
      showCuratedWithTourism: DEFAULT_APP_PREFERENCES.showCuratedWithTourism,
    })).toBe(true);
    expect(shouldShowCuratedMapItems({
      showTourismInfo: true,
      showCuratedWithTourism: DEFAULT_APP_PREFERENCES.showCuratedWithTourism,
    })).toBe(true);
  });

  it('hides curated map items only when KTO is ON and the user disables mixed display', () => {
    expect(shouldShowCuratedMapItems({
      showTourismInfo: false,
      showCuratedWithTourism: false,
    })).toBe(true);
    expect(shouldShowCuratedMapItems({
      showTourismInfo: true,
      showCuratedWithTourism: false,
    })).toBe(false);
  });

  it('normalizes invalid persisted app preferences back to defaults', () => {
    expect(normalizeAppPreferences(null)).toEqual(DEFAULT_APP_PREFERENCES);
    expect(normalizeAppPreferences({ showCuratedWithTourism: 'false' })).toEqual(DEFAULT_APP_PREFERENCES);
    expect(normalizeAppPreferences({ showCuratedWithTourism: false })).toEqual({ showCuratedWithTourism: false });
  });

  it('reads and writes app preferences without throwing on bad storage values', () => {
    const storage = createMemoryStorage('not-json');

    expect(readAppPreferences(storage)).toEqual(DEFAULT_APP_PREFERENCES);

    writeAppPreferences(storage, { showCuratedWithTourism: false });

    expect(readAppPreferences(storage)).toEqual({ showCuratedWithTourism: false });
  });
});
