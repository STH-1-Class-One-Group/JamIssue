import { useState } from 'react';
import { FEEDBACK_FORM_URL } from '../GlobalFeedbackButton';
import { ToggleSwitch } from '../common/ToggleSwitch';

export type AppSettingsPanelProps = {
  mapDisplayPreferences?: {
    showCuratedWithTourism: boolean;
    onShowCuratedWithTourismChange: (checked: boolean) => void;
  };
};

function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" className="review-action-button__svg" aria-hidden="true">
      <path
        d="M10.23 4.23a1 1 0 0 1 1-.73h1.54a1 1 0 0 1 1 .73l.24.85a6.9 6.9 0 0 1 1.43.59l.78-.43a1 1 0 0 1 1.2.18l1.08 1.08a1 1 0 0 1 .18 1.2l-.43.78c.24.45.44.92.59 1.43l.85.24a1 1 0 0 1 .73 1v1.54a1 1 0 0 1-.73 1l-.85.24a6.9 6.9 0 0 1-.59 1.43l.43.78a1 1 0 0 1-.18 1.2l-1.08 1.08a1 1 0 0 1-1.2.18l-.78-.43a6.9 6.9 0 0 1-1.43.59l-.24.85a1 1 0 0 1-1 .73h-1.54a1 1 0 0 1-1-.73l-.24-.85a6.9 6.9 0 0 1-1.43-.59l-.78.43a1 1 0 0 1-1.2-.18l-1.08-1.08a1 1 0 0 1-.18-1.2l.43-.78a6.9 6.9 0 0 1-.59-1.43l-.85-.24a1 1 0 0 1-.73-1v-1.54a1 1 0 0 1 .73-1l.85-.24a6.9 6.9 0 0 1 .59-1.43l-.43-.78a1 1 0 0 1 .18-1.2l1.08-1.08a1 1 0 0 1 1.2-.18l.78.43c.45-.24.92-.44 1.43-.59z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="2.75" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

export function AppSettingsPanel({
  mapDisplayPreferences,
}: AppSettingsPanelProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="global-settings-menu" data-app-settings-panel="root">
      <button
        type="button"
        className={isMenuOpen ? 'secondary-button icon-button global-settings-menu__trigger is-complete' : 'secondary-button icon-button global-settings-menu__trigger'}
        onClick={() => setIsMenuOpen((current) => !current)}
        aria-label="설정 열기"
        title="설정 열기"
        aria-expanded={isMenuOpen}
      >
        <GearIcon />
      </button>

      {isMenuOpen && (
        <div className="global-settings-menu__menu">
          <a className="secondary-button global-settings-menu__item" href={FEEDBACK_FORM_URL} target="_blank" rel="noreferrer">
            <span>피드백</span>
          </a>
          {mapDisplayPreferences ? (
            <div className="global-settings-menu__section" data-app-settings-section="map-display">
              <span className="global-settings-menu__section-label">지도 표시</span>
              <ToggleSwitch
                checked={mapDisplayPreferences.showCuratedWithTourism}
                className="global-settings-menu__switch"
                data-app-setting="show-curated-with-tourism"
                label="관광정보와 큐레이션 함께 보기"
                onChange={mapDisplayPreferences.onShowCuratedWithTourismChange}
                size="sm"
              />
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
