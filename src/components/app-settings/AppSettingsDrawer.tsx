import type { ReactNode } from 'react';
import { ChromeDrawerShell } from '../app-shell/ChromeDrawerShell';
import { DrawerSection, DrawerStack } from '../app-shell/drawer-kit';
import { ToggleSwitch } from '../common/ToggleSwitch';
import { FEEDBACK_FORM_URL } from '../GlobalFeedbackButton';
import { AppSurface, SectionHeader } from '../ui-kit';

export type AppSettingsDrawerProps = {
  accountSettings?: ReactNode;
  isOpen: boolean;
  mapDisplayPreferences?: {
    showCuratedWithTourism: boolean;
    onShowCuratedWithTourismChange: (checked: boolean) => void;
  };
  onClose: () => void;
};

export function AppSettingsDrawer({
  accountSettings,
  isOpen,
  mapDisplayPreferences,
  onClose,
}: AppSettingsDrawerProps) {
  return (
    <ChromeDrawerShell
      ariaLabel="앱 설정"
      isOpen={isOpen}
      onClose={onClose}
      side="right"
      title={<SectionHeader eyebrow="SETTINGS" title="설정" />}
    >
      <DrawerStack className="app-settings-drawer__content">
        {mapDisplayPreferences ? (
          <AppSurface variant="subtle" data-app-settings-section="map-display">
            <SectionHeader eyebrow="MAP DISPLAY" title="지도 표시" />
            <ToggleSwitch
              checked={mapDisplayPreferences.showCuratedWithTourism}
              className="app-settings-drawer__switch"
              data-app-setting="show-curated-with-tourism"
              label="관광정보와 큐레이션 함께 보기"
              onChange={mapDisplayPreferences.onShowCuratedWithTourismChange}
              size="sm"
            />
          </AppSurface>
        ) : null}
        {accountSettings ? (
          <AppSurface variant="subtle" data-app-settings-section="account">
            <SectionHeader eyebrow="ACCOUNT" title="계정 관리" />
            {accountSettings}
          </AppSurface>
        ) : null}
        <DrawerSection
          eyebrow="FEEDBACK"
          title="피드백"
          className="app-settings-drawer__section--feedback"
          data-app-settings-section="feedback"
        >
          <a
            className="ui-action-button ui-action-button--secondary ui-action-button--md app-settings-drawer__feedback"
            href={FEEDBACK_FORM_URL}
            target="_blank"
            rel="noreferrer"
          >
            피드백
          </a>
        </DrawerSection>
      </DrawerStack>
    </ChromeDrawerShell>
  );
}
