import type { ComponentProps, ReactNode } from 'react';
import type { Tab } from '../../types/core';
import { AppHeader } from './AppHeader';
import { BottomNav } from '../BottomNav';
import { GlobalSettingsMenu } from '../GlobalSettingsMenu';
import { GlobalStatusBanner } from '../GlobalStatusBanner';

interface AppShellProps {
  activeTab: Tab;
  bottomTabHidden?: boolean;
  canNavigateBack: boolean;
  children: ReactNode;
  globalStatus: ComponentProps<typeof GlobalStatusBanner> | null;
  globalUtility: ComponentProps<typeof GlobalSettingsMenu>;
  onBottomTabChange: (nextTab: Tab) => void;
  onNavigateBack: () => void;
}

export function AppShell({
  activeTab,
  bottomTabHidden = false,
  canNavigateBack,
  children,
  globalStatus,
  globalUtility,
  onBottomTabChange,
  onNavigateBack,
}: AppShellProps) {
  const isMapStage = activeTab === 'map';

  return (
    <div className="map-app-shell" data-app-shell="root">
      <div
        className={[
          'phone-shell',
          isMapStage ? 'phone-shell--map' : '',
        ].filter(Boolean).join(' ')}
        data-app-shell="phone"
      >
        {globalStatus && (
          <div className="phone-shell__status-slot app-shell__status-safe-area" data-app-shell-slot="status">
            <GlobalStatusBanner
              tone={globalStatus.tone}
              message={globalStatus.message}
              layout={globalStatus.layout}
            />
          </div>
        )}
        <AppHeader
          canNavigateBack={canNavigateBack}
          globalUtility={globalUtility}
          onNavigateBack={onNavigateBack}
        />
        <div className="phone-shell__body" data-app-shell-slot="body">
          <div className="app-shell__content-slot" data-app-shell-slot="content">
            {children}
          </div>
          <div
            className={[
              'app-shell__bottom-tab-slot',
              bottomTabHidden ? 'app-shell__bottom-tab-slot--hidden' : '',
            ].filter(Boolean).join(' ')}
            data-app-shell-slot="bottom-tab"
          >
            <BottomNav activeTab={activeTab} onChange={onBottomTabChange} />
          </div>
        </div>
      </div>
    </div>
  );
}
