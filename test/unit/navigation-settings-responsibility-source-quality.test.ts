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

  it('keeps the app capsule as shell composition without top-level notification ownership', () => {
    const appCapsule = readRepoFile('src/components/app-shell/AppCapsule.tsx');
    const appTopNavigation = readRepoFile('src/components/AppTopNavigation.tsx');
    const secondaryMenu = readRepoFile('src/components/app-shell/secondaryMenu.ts');

    expect(appCapsule).toContain("import { AppSettingsPanel");
    expect(appCapsule).toContain('<AppSettingsPanel');
    expect(appCapsule).toContain('canNavigateBack');
    expect(appCapsule).toContain('onNavigateBack');
    expect(appCapsule).toContain('menuBadgeCount');
    expect(appCapsule).not.toContain('/settings');
    expect(appCapsule).not.toContain('BellIcon');
    expect(appCapsule).not.toContain('onOpenNotifications');
    expect(appCapsule).not.toContain('notificationUnreadCount');

    expect(appTopNavigation).toContain("import { AppTopNavigationDrawers } from './AppTopNavigationDrawers'");
    expect(appTopNavigation).toContain('<AppTopNavigationDrawers');
    expect(appTopNavigation).toContain("import { bottomNavItems } from './BottomNav'");
    expect(appTopNavigation).not.toContain('isNotificationDrawerOpen');
    expect(appTopNavigation).not.toContain('setIsNotificationDrawerOpen');
    expect(secondaryMenu).not.toContain('bottomNavItems');
    expect(secondaryMenu).not.toContain('AppSettingsPanel');
    expect(secondaryMenu).not.toContain('ProfileAccountSettings');
  });

  it('keeps AppSettingsPanel scoped to right drawer app settings entry points', () => {
    const appSettingsPanel = readRepoFile('src/components/app-settings/AppSettingsPanel.tsx');
    const appSettingsDrawer = readRepoFile('src/components/app-settings/AppSettingsDrawer.tsx');
    const globalSettingsMenu = readRepoFile('src/components/GlobalSettingsMenu.tsx');

    expect(appSettingsPanel).toContain('AppSettingsDrawer');
    expect(appSettingsPanel).not.toContain('global-settings-menu__menu');
    expect(appSettingsPanel).not.toContain('NotificationPanel');
    expect(appSettingsPanel).not.toContain('useNotificationPanelActions');
    expect(appSettingsPanel).not.toContain('notifications');
    expect(appSettingsPanel).not.toContain('unreadCount');
    expect(appSettingsPanel).not.toContain('ProfileAvatarEditor');
    expect(appSettingsPanel).not.toContain('ProfileAccountSettings');
    expect(appSettingsPanel).not.toContain('SideDrawer');

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
    const appTopNavigationDrawers = readRepoFile('src/components/AppTopNavigationDrawers.tsx');
    const notificationContent = readRepoFile('src/components/notifications/NotificationDrawerContent.tsx');
    const appSettingsDrawer = readRepoFile('src/components/app-settings/AppSettingsDrawer.tsx');
    const sideDrawer = readRepoFile('src/components/app-shell/SideDrawer.tsx');

    expect(appCapsule).not.toContain('onOpenNotifications');
    expect(appCapsule).not.toContain('notificationUnreadCount');
    expect(appTopNavigationDrawers).toContain('NotificationDrawerContent');
    expect(appTopNavigationDrawers).toContain('<SideDrawer');
    expect(appTopNavigationDrawers).toContain("itemId === 'notification'");
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
    const appTopNavigation = readRepoFile('src/components/AppTopNavigation.tsx');
    const appTopNavigationDrawers = readRepoFile('src/components/AppTopNavigationDrawers.tsx');
    const sideDrawer = readRepoFile('src/components/app-shell/SideDrawer.tsx');
    const secondaryMenu = readRepoFile('src/components/app-shell/secondaryMenu.ts');

    expect(appTopNavigation).toContain('<AppTopNavigationDrawers');
    expect(appTopNavigationDrawers).toContain('<SideDrawer');
    expect(appTopNavigationDrawers).toContain('resolveSecondaryMenuItems');
    expect(sideDrawer).not.toContain('메뉴 준비 중');
    expect(secondaryMenu).not.toContain('지도 / 행사 / 피드 / 코스 / 마이');
    expect(secondaryMenu).not.toContain("label: '로그아웃'");
  });

  it('keeps touched navigation and settings shell files UTF-8 readable', () => {
    const files = [
      'src/components/app-shell/AppCapsule.tsx',
      'src/components/app-shell/SideDrawer.tsx',
      'src/components/app-shell/secondaryMenu.ts',
      'src/components/app-settings/AppSettingsPanel.tsx',
      'src/components/app-settings/AppSettingsDrawer.tsx',
      'src/components/notifications/NotificationDrawerContent.tsx',
    ];

    for (const file of files) {
      const source = readRepoFile(file);
      expect(source).not.toContain('\uFFFD');
      expect(source).not.toContain('嶺');
      expect(source).not.toContain('???');
    }
  });
});
