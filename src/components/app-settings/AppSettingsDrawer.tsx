import type { ReactNode } from 'react';
import { ChromeDrawerShell } from '../app-shell/ChromeDrawerShell';
import { FEEDBACK_FORM_URL } from '../GlobalFeedbackButton';
import { ToggleSwitch } from '../common/ToggleSwitch';

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
      title={(
        <div>
          <p className="section-eyebrow">SETTINGS</p>
          <h2>설정</h2>
        </div>
      )}
    >
      <div className="app-settings-drawer__content chrome-drawer-stack">
        {mapDisplayPreferences ? (
          <section className="chrome-drawer-section" data-app-settings-section="map-display">
            <div className="chrome-drawer-section__heading">
              <span className="chrome-drawer-section__label">MAP DISPLAY</span>
              <h3>지도 표시</h3>
            </div>
            <ToggleSwitch
              checked={mapDisplayPreferences.showCuratedWithTourism}
              className="app-settings-drawer__switch"
              data-app-setting="show-curated-with-tourism"
              label="관광정보와 큐레이션 함께 보기"
              onChange={mapDisplayPreferences.onShowCuratedWithTourismChange}
              size="sm"
            />
          </section>
        ) : null}
        {accountSettings ? (
          <details
            className="chrome-drawer-section app-settings-drawer__details"
            data-app-settings-section="account"
            open
          >
            <summary className="app-settings-drawer__summary">
              <span className="chrome-drawer-section__label">ACCOUNT</span>
              <span className="app-settings-drawer__summary-title">계정 관리</span>
            </summary>
            <div className="app-settings-drawer__details-content chrome-drawer-stack">
              {accountSettings}
            </div>
          </details>
        ) : null}
        <section
          className="chrome-drawer-section app-settings-drawer__section--feedback"
          data-app-settings-section="feedback"
        >
          <div className="chrome-drawer-section__heading">
            <span className="chrome-drawer-section__label">FEEDBACK</span>
            <h3>피드백</h3>
          </div>
          <a
            className="secondary-button app-settings-drawer__feedback"
            href={FEEDBACK_FORM_URL}
            target="_blank"
            rel="noreferrer"
          >
            피드백
          </a>
        </section>
      </div>
    </ChromeDrawerShell>
  );
}
