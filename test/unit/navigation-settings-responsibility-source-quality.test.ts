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
    expect(appSettingsDrawer).toContain('계정 관리');
    expect(appSettingsDrawer).toContain('피드백');
    expect(appSettingsDrawer).toContain('DrawerSection');
    expect(appSettingsDrawer).not.toContain('footer={');
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

  it('keeps My Page as a dashboard while account settings live in the app settings drawer', () => {
    const myPagePanel = readRepoFile('src/components/MyPagePanel.tsx');
    const appChrome = readRepoFile('src/components/app-shell/AppChrome.tsx');
    const appSettingsDrawer = readRepoFile('src/components/app-settings/AppSettingsDrawer.tsx');
    const appAccountSettingsSlot = readRepoFile('src/components/app-settings/AppAccountSettingsSlot.tsx');
    const profileAccountSettings = readRepoFile('src/components/my-page/ProfileAccountSettings.tsx');
    const myPageOverviewSection = readRepoFile('src/components/my-page/MyPageOverviewSection.tsx');
    const myPageTabContent = readRepoFile('src/components/my-page/MyPageTabContent.tsx');

    expect(myPagePanel).toContain('MyPageHeader');
    expect(myPagePanel).toContain('MyPageOverviewSection');
    expect(myPagePanel).toContain('MyPageTabContent');
    expect(myPagePanel).not.toContain('MyPageAccountSection');
    expect(myPagePanel).not.toContain('MyPageSettingsSection');
    expect(myPagePanel).not.toContain('GlobalSettingsMenu');
    expect(myPagePanel).not.toContain('ProfileAccountSettings');

    expect(appChrome).toContain('AppAccountSettingsSlot');
    expect(appSettingsDrawer).toContain('accountSettings');
    expect(appAccountSettingsSlot).toContain('ProfileAccountSettings');
    expect(profileAccountSettings).toContain('ProfileAvatarEditor');
    expect(profileAccountSettings).toContain('DrawerSection');
    expect(profileAccountSettings).toContain('DrawerFormGroup');
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

  it('keeps drawer coordinates tied to central content instead of covering app chrome', () => {
    const css = readRepoFile('src/index.css');

    expect(css).toContain('--drawer-inline-inset');
    expect(css).toContain('--drawer-trailing-gap');
    expect(css).toContain('left: var(--drawer-inline-inset)');
    expect(css).toContain('right: var(--drawer-inline-inset)');
    expect(css).toContain('top: calc(var(--map-floating-nav-top) + var(--shell-capsule-height) + var(--map-floating-nav-gap))');
    expect(css).toContain('bottom: calc(var(--bottom-nav-offset) + var(--chrome-drawer-bottom-gap))');
    expect(css).not.toContain('right: max(var(--drawer-inline-inset)');
    expect(css).not.toContain('left: 0;\n  width: min(312px, calc(100% - 56px))');
  });

  it('keeps drawer section styling on semantic tokens without visible raw color regressions', () => {
    const css = readRepoFile('src/index.css');
    const refinements = readRepoFile('src/styles/refinements.css');
    const combined = `${css}\n${refinements}`;

    for (const selector of [
      '.drawer-kit-section',
      '.drawer-kit-card',
      '.drawer-kit-list-item__meta',
      '.settings-card__social-status',
      '.settings-card__avatar-editor',
    ]) {
      expect(combined).toContain(selector);
    }
    expect(combined).not.toContain('color: #6f5964');
    expect(combined).not.toContain('color: #866f7b');
    expect(combined).not.toContain('background: rgba(66, 40, 60, 0.07)');
    expect(combined).toContain('.settings-card__social-status');
    expect(combined).toContain('.settings-card__social-action-label');
    expect(combined).toContain('color: var(--color-accent-strong)');
    expect(combined).not.toContain('.settings-card__social-status {\n  color: var(--pink-deep);');
    expect(combined).not.toContain('.settings-card__social-action-label {\n  color: var(--pink-deep);');
  });

  it('keeps touched navigation and settings shell files UTF-8 readable', () => {
    const files = [
      'src/components/app-shell/AppCapsule.tsx',
      'src/components/app-shell/AppChrome.tsx',
      'src/components/app-shell/SideDrawer.tsx',
      'src/components/app-shell/secondaryMenu.ts',
      'src/components/app-settings/AppAccountSettingsSlot.tsx',
      'src/components/app-settings/AppSettingsButton.tsx',
      'src/components/app-settings/AppSettingsPanel.tsx',
      'src/components/app-settings/AppSettingsDrawer.tsx',
      'src/components/app-shell/ChromeDrawerShell.tsx',
      'src/components/app-shell/drawer-kit.tsx',
      'src/components/my-page/ProfileAccountSettings.tsx',
      'src/components/my-page/ProfileAvatarEditor.tsx',
      'src/components/notifications/NotificationDrawerContent.tsx',
      'src/components/notifications/NotificationPanel.tsx',
      'src/components/notifications/NotificationListItem.tsx',
      'src/components/notifications/notificationTypes.ts',
    ];

    for (const file of files) {
      const source = readRepoFile(file);
      expect(source).not.toContain(String.fromCodePoint(0xfffd));
      expect(source).not.toContain('?'.repeat(3));
      for (const fragment of [
        String.fromCodePoint(0xf99e, 0xb69a, 0xc19c, 0x18d),
        String.fromCodePoint(0xd6de),
      ]) {
        expect(source).not.toContain(fragment);
      }
    }
  });
});
