import { useState } from 'react';
import { AppSettingsButton } from './AppSettingsButton';
import { AppSettingsDrawer } from './AppSettingsDrawer';

export type AppSettingsPanelProps = {
  mapDisplayPreferences?: {
    showCuratedWithTourism: boolean;
    onShowCuratedWithTourismChange: (checked: boolean) => void;
  };
};

export function AppSettingsPanel({
  mapDisplayPreferences,
}: AppSettingsPanelProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <div className="global-settings-menu" data-app-settings-panel="root">
      <AppSettingsButton isOpen={isDrawerOpen} onOpen={() => setIsDrawerOpen(true)} />
      <AppSettingsDrawer
        isOpen={isDrawerOpen}
        mapDisplayPreferences={mapDisplayPreferences}
        onClose={() => setIsDrawerOpen(false)}
      />
    </div>
  );
}
