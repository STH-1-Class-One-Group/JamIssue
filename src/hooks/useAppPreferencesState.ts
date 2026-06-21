import { useEffect, useState } from 'react';
import {
  readAppPreferences,
  writeAppPreferences,
} from '../lib/appPreferences';

function getLocalStorage() {
  return typeof window === 'undefined' ? null : window.localStorage;
}

export function useAppPreferencesState() {
  const [preferences, setPreferences] = useState(() => readAppPreferences(getLocalStorage()));

  useEffect(() => {
    writeAppPreferences(getLocalStorage(), preferences);
  }, [preferences]);

  return {
    showCuratedWithTourism: preferences.showCuratedWithTourism,
    setShowCuratedWithTourism: (showCuratedWithTourism: boolean) => {
      setPreferences((current) => ({
        ...current,
        showCuratedWithTourism,
      }));
    },
  };
}
