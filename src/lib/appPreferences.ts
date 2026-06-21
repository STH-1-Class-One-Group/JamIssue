export type AppPreferences = {
  showCuratedWithTourism: boolean;
};

export const DEFAULT_APP_PREFERENCES: AppPreferences = {
  showCuratedWithTourism: true,
};

export const APP_PREFERENCES_STORAGE_KEY = 'jamissue:app-preferences:v1';

type AppPreferencesStorage = Pick<Storage, 'getItem' | 'setItem'>;

export function normalizeAppPreferences(value: unknown): AppPreferences {
  if (!value || typeof value !== 'object') {
    return DEFAULT_APP_PREFERENCES;
  }

  const candidate = value as Partial<AppPreferences>;

  return {
    showCuratedWithTourism: typeof candidate.showCuratedWithTourism === 'boolean'
      ? candidate.showCuratedWithTourism
      : DEFAULT_APP_PREFERENCES.showCuratedWithTourism,
  };
}

export function readAppPreferences(storage: AppPreferencesStorage | null): AppPreferences {
  if (!storage) {
    return DEFAULT_APP_PREFERENCES;
  }

  try {
    const rawValue = storage.getItem(APP_PREFERENCES_STORAGE_KEY);
    return rawValue ? normalizeAppPreferences(JSON.parse(rawValue)) : DEFAULT_APP_PREFERENCES;
  } catch {
    return DEFAULT_APP_PREFERENCES;
  }
}

export function writeAppPreferences(storage: AppPreferencesStorage | null, preferences: AppPreferences) {
  if (!storage) {
    return;
  }

  try {
    storage.setItem(APP_PREFERENCES_STORAGE_KEY, JSON.stringify(normalizeAppPreferences(preferences)));
  } catch {
    // Preference persistence must not break primary map interactions.
  }
}

export function shouldShowCuratedMapItems({
  showTourismInfo,
  showCuratedWithTourism,
}: {
  showTourismInfo: boolean;
  showCuratedWithTourism: boolean;
}) {
  return !showTourismInfo || showCuratedWithTourism;
}
