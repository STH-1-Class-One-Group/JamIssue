import { useState } from 'react';
import type { ComponentProps, ReactNode } from 'react';
import type { Tab } from '../../types/core';
import { AppHeader } from './AppHeader';
import { BottomNav } from '../BottomNav';
import { GlobalStatusBanner } from '../GlobalStatusBanner';
import { SplashScreen } from '../SplashScreen';

interface AppShellProps {
  activeTab: Tab;
  canNavigateBack: boolean;
  children: ReactNode;
  chrome?: ReactNode;
  globalStatus: ComponentProps<typeof GlobalStatusBanner> | null;
  headerUtilityAction?: ReactNode;
  onBottomTabChange: (nextTab: Tab) => void;
  onNavigateBack: () => void;
  headerMode?: 'default' | 'hidden';
  showEntrySplash?: boolean;
  subNav?: ReactNode;
}

export function AppShell({
  activeTab,
  canNavigateBack,
  children,
  chrome,
  globalStatus,
  headerUtilityAction,
  headerMode = 'default',
  onBottomTabChange,
  onNavigateBack,
  showEntrySplash = false,
  subNav,
}: AppShellProps) {
  const [showSplash, setShowSplash] = useState(showEntrySplash);
  const isMapStage = activeTab === 'map';
  const hasSubNav = Boolean(subNav);
  const isHeaderHidden = headerMode === 'hidden';

  return (
    <div className="map-app-shell" data-app-shell="root">
      {showSplash && <SplashScreen onDone={() => setShowSplash(false)} />}
      <div
        className={[
          'phone-shell',
          isMapStage ? 'phone-shell--map' : '',
          isHeaderHidden ? 'app-shell--header-hidden' : '',
          hasSubNav ? 'app-shell--with-subnav' : 'app-shell--no-subnav',
        ].filter(Boolean).join(' ')}
        data-app-shell="phone"
        data-testid="app-shell-phone"
      >
        {chrome}
        {globalStatus && (
          <div className="phone-shell__status-slot app-shell__status-safe-area" data-app-shell-slot="status">
            <GlobalStatusBanner
              tone={globalStatus.tone}
              message={globalStatus.message}
              layout={globalStatus.layout}
            />
          </div>
        )}
        {!isHeaderHidden && (
          <AppHeader
            canNavigateBack={canNavigateBack}
            utilityAction={headerUtilityAction}
            onNavigateBack={onNavigateBack}
          />
        )}
        {hasSubNav && (
          <div
            className="app-shell__sub-nav-slot"
            data-app-shell-slot="sub-nav"
            data-testid="app-shell-sub-nav"
          >
            {subNav}
          </div>
        )}
        <div className="phone-shell__body" data-app-shell-slot="body">
          <div
            className="app-shell__content-slot"
            data-app-shell-slot="content"
            data-testid="app-shell-content"
          >
            {children}
          </div>
          <div className="app-shell__bottom-tab-slot" data-app-shell-slot="bottom-tab">
            <BottomNav activeTab={activeTab} onChange={onBottomTabChange} />
          </div>
        </div>
      </div>
    </div>
  );
}
