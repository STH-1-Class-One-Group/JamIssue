/*
 * File: AppHeader.tsx
 * Purpose: Render the shared app header used by the Web Front shell.
 * Primary Responsibility: Own the header brand, leading back action, and global utility action slot.
 * Design Intent: Keep navigation and utility controls in the shell flow instead of separate floating overlays.
 * Non-Goals: This component does not own sub-navigation, map filters, or page-specific content layout.
 * Dependencies: React component props, JamIssue logo asset, and GlobalSettingsMenu.
 */
import type { ComponentProps } from 'react';
import jamissueLogo from '../../assets/jamissue-logo.png';
import { GlobalSettingsMenu } from '../GlobalSettingsMenu';

interface AppHeaderProps {
  canNavigateBack: boolean;
  globalUtility: ComponentProps<typeof GlobalSettingsMenu>;
  onNavigateBack: () => void;
}

function AppHeaderBrand() {
  return (
    <div className="app-header__brand" data-app-header-slot="brand">
      <span className="app-header__brand-mark" aria-hidden="true">
        <img src={jamissueLogo} alt="" className="app-header__brand-mark-image" />
      </span>
      <span className="app-header__brand-copy">
        <span className="app-header__brand-kicker">DAEJEON LOCAL GUIDE</span>
        <span className="app-header__brand-title">JAM ISSUE</span>
      </span>
    </div>
  );
}

/**
 * Renders the full-width shell header.
 *
 * The leading slot switches between brand-first and back-navigation states, while
 * the utility slot keeps notification and feedback entry points inside the
 * header boundary.
 */
export function AppHeader({
  canNavigateBack,
  globalUtility,
  onNavigateBack,
}: AppHeaderProps) {
  return (
    <header className="app-header" aria-label="Jam Issue app header" data-app-shell-slot="header">
      <div className="app-header__leading" data-app-header-slot="leading">
        {canNavigateBack && (
          <button
            type="button"
            className="app-header__back-button"
            onClick={onNavigateBack}
            aria-label="이전 화면으로 돌아가기"
          >
            <span aria-hidden="true">{'\u2190'}</span>
          </button>
        )}
        <AppHeaderBrand />
      </div>
      <div
        className="app-header__actions"
        data-app-header-slot="actions"
        data-app-shell-slot="header-actions"
      >
        <GlobalSettingsMenu {...globalUtility} />
      </div>
    </header>
  );
}
