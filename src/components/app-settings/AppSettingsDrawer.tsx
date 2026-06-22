import type { ReactNode } from 'react';
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
  if (!isOpen) {
    return null;
  }

  return (
    <div className="app-settings-drawer" data-app-settings-drawer="root">
      <button
        type="button"
        className="app-settings-drawer__overlay"
        aria-label="앱 설정 닫기"
        onClick={onClose}
      />
      <aside
        className="app-settings-drawer__panel"
        role="dialog"
        aria-modal="true"
        aria-label="앱 설정"
      >
        <header className="app-settings-drawer__header">
          <div>
            <p className="section-eyebrow">SETTINGS</p>
            <h2>설정</h2>
          </div>
          <button
            type="button"
            className="app-settings-drawer__close"
            aria-label="앱 설정 닫기"
            onClick={onClose}
          >
            <span aria-hidden="true">×</span>
          </button>
        </header>
        <div className="app-settings-drawer__content">
          {accountSettings ? (
            <section className="app-settings-drawer__section" data-app-settings-section="account">
              <span className="app-settings-drawer__section-label">계정 관리</span>
              {accountSettings}
            </section>
          ) : null}
          {mapDisplayPreferences ? (
            <section className="app-settings-drawer__section" data-app-settings-section="map-display">
              <span className="app-settings-drawer__section-label">지도 표시</span>
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
        </div>
        <footer className="app-settings-drawer__footer">
          <a className="secondary-button app-settings-drawer__feedback" href={FEEDBACK_FORM_URL} target="_blank" rel="noreferrer">
            피드백
          </a>
        </footer>
      </aside>
    </div>
  );
}
