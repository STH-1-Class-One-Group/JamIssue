import { readFileSync } from 'node:fs';
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

  it('keeps the app capsule as shell composition instead of account settings ownership', () => {
    const appCapsule = readRepoFile('src/components/app-shell/AppCapsule.tsx');
    const appHeader = readRepoFile('src/components/app-shell/AppHeader.tsx');
    const appShell = readRepoFile('src/components/app-shell/AppShell.tsx');
    const appTopNavigation = readRepoFile('src/components/AppTopNavigation.tsx');
    const secondaryMenu = readRepoFile('src/components/app-shell/secondaryMenu.ts');

    expect(appCapsule).toContain("import { AppSettingsPanel");
    expect(appCapsule).toContain('<AppSettingsPanel');
    expect(appHeader).toContain("import { AppSettingsPanel");
    expect(appHeader).toContain('<AppSettingsPanel');
    expect(appShell).toContain("import { AppSettingsPanel");
    expect(appCapsule).toContain('canNavigateBack');
    expect(appCapsule).toContain('onNavigateBack');
    expect(appCapsule).not.toContain('/settings');
    expect(appCapsule).not.toContain('MyPageSettingsSection');
    expect(appCapsule).not.toContain('ProfileAvatarEditor');

    expect(appTopNavigation).toContain("import { SideDrawer } from './app-shell/SideDrawer'");
    expect(appTopNavigation).toContain('<SideDrawer');
    expect(appTopNavigation).toContain("import { bottomNavItems } from './BottomNav'");
    expect(appTopNavigation).toContain('resolveSecondaryMenuItems');
    expect(secondaryMenu).not.toContain('bottomNavItems');
    expect(secondaryMenu).not.toContain('AppSettingsPanel');
    expect(secondaryMenu).not.toContain('ProfileAccountSettings');
  });

  it('keeps AppSettingsPanel scoped to app-wide utility entry points', () => {
    const appSettingsPanel = readRepoFile('src/components/app-settings/AppSettingsPanel.tsx');
    const globalSettingsMenu = readRepoFile('src/components/GlobalSettingsMenu.tsx');

    expect(appSettingsPanel).toContain('NotificationPanel');
    expect(appSettingsPanel).toContain('FEEDBACK_FORM_URL');
    expect(appSettingsPanel).toContain('showCuratedWithTourism');
    expect(appSettingsPanel).toContain('data-app-setting="show-curated-with-tourism"');
    expect(appSettingsPanel).not.toContain('ProfileAvatarEditor');
    expect(appSettingsPanel).not.toContain('onSaveNickname');
    expect(appSettingsPanel).not.toContain('onLogout');
    expect(appSettingsPanel).not.toContain('getTourismPlaces');
    expect(appSettingsPanel).not.toContain('filterTourismPlacesByDisplayGroup');
    expect(appSettingsPanel).not.toContain('selectedTourismPlaceId');
    expect(globalSettingsMenu).toContain('AppSettingsPanel');
    expect(globalSettingsMenu).not.toContain('NotificationPanel');
    expect(globalSettingsMenu).not.toContain('FEEDBACK_FORM_URL');
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
    expect(profileAccountSettings).not.toMatch(/tourism|curated|kto/i);
    expect(myPageOverviewSection).toContain('uniquePlaceCount');
    expect(myPageOverviewSection).toContain('stampCount');
    expect(myPageTabContent).toContain('MyStampTabSection');
    expect(myPageTabContent).toContain('MyFeedTabSection');
    expect(myPageTabContent).toContain('MyCommentsTabSection');
    expect(myPageTabContent).toContain('MyRoutesTabSection');
  });

  it('records that map display preferences are not implemented in the audit slice', () => {
    const auditDoc = readRepoFile('docs/TSK-021-01-navigation-settings-responsibility-audit.md');

    expect(auditDoc).toContain('Map Preferences');
    expect(auditDoc).toContain('TSK-021-05');
    expect(auditDoc).toContain('showCuratedWithTourism');
    expect(auditDoc).toContain('TSK-021-01은 문서와 source-quality guard만 다룬다');
  });
});
