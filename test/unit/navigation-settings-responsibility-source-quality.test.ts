import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = process.cwd();

function readRepoFile(pathFromRoot: string) {
  return readFileSync(join(repoRoot, pathFromRoot), 'utf8');
}

describe('TSK-021 navigation and settings responsibility audit', () => {
  it('keeps BottomNav limited to the five primary product tabs', () => {
    const bottomNav = readRepoFile('src/components/BottomNav.tsx');
    const tabKeys = [...bottomNav.matchAll(/key:\s*'([^']+)'/g)].map((match) => match[1]);

    expect(tabKeys).toEqual(['map', 'event', 'feed', 'course', 'my']);
    expect(bottomNav).toContain('onChange(item.key)');
    expect(bottomNav).not.toMatch(/\bsettings\b/i);
    expect(bottomNav).not.toMatch(/\badmin\b/i);
    expect(bottomNav).not.toContain('GlobalSettingsMenu');
    expect(bottomNav).not.toContain('SideDrawer');
  });

  it('keeps AppChrome as the only owner of capsule, side drawer, and settings drawer composition', () => {
    const app = readRepoFile('src/App.tsx');
    const appShell = readRepoFile('src/components/app-shell/AppShell.tsx');
    const appHeader = readRepoFile('src/components/app-shell/AppHeader.tsx');
    const appCapsule = readRepoFile('src/components/app-shell/AppCapsule.tsx');
    const appChrome = readRepoFile('src/components/app-shell/AppChrome.tsx');
    const secondaryMenu = readRepoFile('src/components/app-shell/secondaryMenu.ts');

    expect(app).toContain("import { AppChrome, AppShell } from './components/app-shell'");
    expect(app).toContain("import { MapFloatingNav } from './components/map-stage/MapFloatingNav'");
    expect(app).toContain('appChromeCenter');
    expect(app).toContain('chrome={(');
    expect(app).not.toContain('topNavigation={(');
    expect(app).not.toContain('AppTopNavigation');

    expect(appShell).toContain('chrome?: ReactNode');
    expect(appShell).not.toContain('topNavigation?: ReactNode');
    expect(appShell).not.toContain('AppSettingsPanel');
    expect(appHeader).toContain('utilityAction?: ReactNode');
    expect(appHeader).not.toContain('AppSettingsPanel');

    expect(appCapsule).not.toContain('AppSettingsPanel');
    expect(appCapsule).not.toContain('AppSettingsDrawer');
    expect(appCapsule).not.toContain('SideDrawer');
    expect(appCapsule).not.toContain('NotificationDrawerContent');
    expect(appCapsule).not.toContain('MapFloatingNav');
    expect(appCapsule).toContain('canNavigateBack');
    expect(appCapsule).toContain('onNavigateBack');
    expect(appCapsule).toContain('menuBadgeCount');
    expect(appCapsule).toContain('settingsAction');
    expect(appCapsule).not.toContain('/settings');
    expect(appCapsule).not.toContain('BellIcon');
    expect(appCapsule).not.toContain('onOpenNotifications');
    expect(appCapsule).not.toContain('notificationUnreadCount');

    expect(appChrome).toContain("import { AppCapsule } from './AppCapsule'");
    expect(appChrome).toContain("import { SideDrawer } from './SideDrawer'");
    expect(appChrome).toContain("import { AppSettingsButton } from '../app-settings/AppSettingsButton'");
    expect(appChrome).toContain("import { AppSettingsDrawer } from '../app-settings/AppSettingsDrawer'");
    expect(appChrome).toContain('NotificationDrawerContent');
    expect(appChrome).toContain('resolveSecondaryMenuItems');
    expect(appChrome).not.toContain('MapFloatingNav');
    expect(appChrome).not.toContain('mapActions');
    expect(appChrome).not.toContain('mapData');
    expect(appChrome).not.toContain('bottomNavItems');

    expect(secondaryMenu).not.toContain('bottomNavItems');
    expect(secondaryMenu).not.toContain('AppSettingsPanel');
    expect(secondaryMenu).not.toContain('ProfileAccountSettings');
  });

  it('keeps AppSettingsPanel scoped to right drawer app settings entry points', () => {
    const appSettingsPanel = readRepoFile('src/components/app-settings/AppSettingsPanel.tsx');
    const appSettingsButton = readRepoFile('src/components/app-settings/AppSettingsButton.tsx');
    const appSettingsDrawer = readRepoFile('src/components/app-settings/AppSettingsDrawer.tsx');
    const globalSettingsMenu = readRepoFile('src/components/GlobalSettingsMenu.tsx');

    expect(appSettingsPanel).toContain('AppSettingsButton');
    expect(appSettingsPanel).toContain('AppSettingsDrawer');
    expect(appSettingsPanel).not.toContain('global-settings-menu__menu');
    expect(appSettingsPanel).not.toContain('NotificationPanel');
    expect(appSettingsPanel).not.toContain('useNotificationPanelActions');
    expect(appSettingsPanel).not.toContain('notifications');
    expect(appSettingsPanel).not.toContain('unreadCount');
    expect(appSettingsPanel).not.toContain('ProfileAvatarEditor');
    expect(appSettingsPanel).not.toContain('ProfileAccountSettings');
    expect(appSettingsPanel).not.toContain('SideDrawer');

    expect(appSettingsButton).toContain('설정 열기');
    expect(appSettingsButton).not.toContain('AppSettingsDrawer');
    expect(appSettingsButton).not.toContain('NotificationPanel');

    expect(appSettingsDrawer).toContain('FEEDBACK_FORM_URL');
    expect(appSettingsDrawer).toContain('showCuratedWithTourism');
    expect(appSettingsDrawer).toContain('data-app-setting="show-curated-with-tourism"');
    expect(appSettingsDrawer).toContain('지도 표시');
    expect(appSettingsDrawer).toContain('피드백');
    expect(appSettingsDrawer).not.toContain('NotificationPanel');
    expect(appSettingsDrawer).not.toContain('useNotificationPanelActions');
    expect(appSettingsDrawer).not.toContain('notifications');
    expect(appSettingsDrawer).not.toContain('unreadCount');
    expect(globalSettingsMenu).toContain('AppSettingsPanel');
    expect(globalSettingsMenu).not.toContain('NotificationPanel');
    expect(globalSettingsMenu).not.toContain('FEEDBACK_FORM_URL');
  });

  it('keeps notification content inside SideDrawer instead of capsule or settings', () => {
    const appCapsule = readRepoFile('src/components/app-shell/AppCapsule.tsx');
    const appChrome = readRepoFile('src/components/app-shell/AppChrome.tsx');
    const notificationContent = readRepoFile('src/components/notifications/NotificationDrawerContent.tsx');
    const appSettingsDrawer = readRepoFile('src/components/app-settings/AppSettingsDrawer.tsx');
    const sideDrawer = readRepoFile('src/components/app-shell/SideDrawer.tsx');

    expect(appCapsule).not.toContain('onOpenNotifications');
    expect(appCapsule).not.toContain('notificationUnreadCount');
    expect(appChrome).toContain('NotificationDrawerContent');
    expect(appChrome).toContain('<SideDrawer');
    expect(appChrome).toContain("itemId === 'notification'");
    expect(notificationContent).toContain('NotificationPanel');
    expect(notificationContent).toContain('aria-label="알림"');
    expect(notificationContent).not.toContain('showCuratedWithTourism');
    expect(notificationContent).not.toContain('FEEDBACK_FORM_URL');
    expect(sideDrawer).toContain('renderItemContent');
    expect(appSettingsDrawer).not.toContain('NotificationPanel');
    expect(appSettingsDrawer).not.toContain('notifications');
    expect(appSettingsDrawer).not.toContain('unreadCount');
    expect(existsSync(join(repoRoot, 'src/components/notifications/NotificationDrawer.tsx'))).toBe(false);
  });

  it('keeps My Page as a dashboard with account settings delegated to my-page components', () => {
    const myPagePanel = readRepoFile('src/components/MyPagePanel.tsx');
    const myPageAccountSection = readRepoFile('src/components/my-page/MyPageAccountSection.tsx');
    const myPageSettingsSection = readRepoFile('src/components/my-page/MyPageSettingsSection.tsx');
    const profileAccountSettings = readRepoFile('src/components/my-page/ProfileAccountSettings.tsx');
    const myPageOverviewSection = readRepoFile('src/components/my-page/MyPageOverviewSection.tsx');
    const myPageTabContent = readRepoFile('src/components/my-page/MyPageTabContent.tsx');

    expect(myPagePanel).toContain('MyPageHeader');
    expect(myPagePanel).toContain('MyPageOverviewSection');
    expect(myPagePanel).toContain('MyPageTabContent');
    expect(myPagePanel).toContain('MyPageAccountSection');
    expect(myPagePanel).toContain('MyPageSettingsSection');
    expect(myPagePanel).not.toContain('GlobalSettingsMenu');

    expect(myPageAccountSection).toContain('onToggleSettings');
    expect(myPageAccountSection).not.toContain('onLogout');
    expect(myPageSettingsSection).toContain('ProfileAccountSettings');
    expect(myPageSettingsSection).not.toContain('ProfileAvatarEditor');
    expect(profileAccountSettings).toContain('ProfileAvatarEditor');
    expect(profileAccountSettings).toContain('onLinkProvider');
    expect(profileAccountSettings).toContain('onDeleteAvatar');
    expect(profileAccountSettings).toContain('onLogout');
    expect(profileAccountSettings).not.toContain('GlobalSettingsMenu');
    expect(profileAccountSettings).not.toContain('AppSettingsPanel');
    expect(profileAccountSettings).not.toMatch(/tourism|curated|kto/i);
    expect(myPageOverviewSection).toContain('uniquePlaceCount');
    expect(myPageOverviewSection).toContain('stampCount');
    expect(myPageTabContent).toContain('MyStampTabSection');
    expect(myPageTabContent).toContain('MyFeedTabSection');
    expect(myPageTabContent).toContain('MyCommentsTabSection');
    expect(myPageTabContent).toContain('MyRoutesTabSection');
  });

  it('keeps the hamburger side drawer as secondary support, not a duplicate app/settings/account menu', () => {
    const appChrome = readRepoFile('src/components/app-shell/AppChrome.tsx');
    const sideDrawer = readRepoFile('src/components/app-shell/SideDrawer.tsx');
    const secondaryMenu = readRepoFile('src/components/app-shell/secondaryMenu.ts');

    expect(appChrome).toContain('<SideDrawer');
    expect(appChrome).toContain('resolveSecondaryMenuItems');
    expect(sideDrawer).not.toContain('메뉴 준비 중');
    expect(secondaryMenu).not.toContain('지도 / 행사 / 피드 / 코스 / 마이');
    expect(secondaryMenu).not.toContain("label: '로그아웃'");
  });

  it('keeps drawer coordinates tied to safe shell insets', () => {
    const css = readRepoFile('src/index.css');

    expect(css).toContain('--drawer-inline-inset');
    expect(css).toContain('--drawer-trailing-gap');
    expect(css).toContain('left: var(--drawer-inline-inset)');
    expect(css).toContain('right: max(var(--drawer-inline-inset)');
    expect(css).not.toContain('left: 0;\n  width: min(312px, calc(100% - 56px))');
  });

  it('keeps touched navigation and settings shell files UTF-8 readable', () => {
    const files = [
      'src/components/app-shell/AppCapsule.tsx',
      'src/components/app-shell/AppChrome.tsx',
      'src/components/app-shell/SideDrawer.tsx',
      'src/components/app-shell/secondaryMenu.ts',
      'src/components/app-settings/AppSettingsButton.tsx',
      'src/components/app-settings/AppSettingsPanel.tsx',
      'src/components/app-settings/AppSettingsDrawer.tsx',
      'src/components/notifications/NotificationDrawerContent.tsx',
    ];

    for (const file of files) {
      const source = readRepoFile(file);
      expect(source).not.toContain('\uFFFD');
      expect(source).not.toContain(String.fromCodePoint(0xfffd));
      expect(source).not.toContain('???');
      for (const fragment of ['吏', '蹂댁', '횞']) {
        expect(source).not.toContain(fragment);
      }
    }
  });
});
