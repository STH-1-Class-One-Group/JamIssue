import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = process.cwd();

function readRepoFile(pathFromRoot: string) {
  return readFileSync(join(repoRoot, pathFromRoot), 'utf8');
}

function repoFileExists(pathFromRoot: string) {
  return existsSync(join(repoRoot, pathFromRoot));
}

describe('TSK-016 seventh UI/UX component architecture audit baseline', () => {
  it('keeps AppShell and AppHeader free of settings drawer implementation ownership', () => {
    const appShell = readRepoFile('src/components/app-shell/AppShell.tsx');
    const appHeader = readRepoFile('src/components/app-shell/AppHeader.tsx');

    expect(appShell).toContain("import { AppHeader } from './AppHeader'");
    expect(appShell).toContain("import { BottomNav } from '../BottomNav'");
    expect(appShell).not.toContain("import { AppSettingsPanel } from '../app-settings/AppSettingsPanel'");
    expect(appShell).toContain('chrome?: ReactNode');
    expect(appShell).not.toContain('topNavigation?: ReactNode');
    expect(appShell).toContain("headerMode?: 'default' | 'hidden'");
    expect(appShell).toContain('<BottomNav activeTab={activeTab} onChange={onBottomTabChange} />');

    expect(appHeader).toContain('canNavigateBack');
    expect(appHeader).toContain('onNavigateBack');
    expect(appHeader).toContain('utilityAction?: ReactNode');
    expect(appHeader).not.toContain('AppSettingsPanel');
    expect(appHeader).not.toContain('window.history');
  });

  it('records that navigation-specific center controls are injected through AppChrome', () => {
    const app = readRepoFile('src/App.tsx');
    const appChrome = readRepoFile('src/components/app-shell/AppChrome.tsx');
    const appMapStageView = readRepoFile('src/components/AppMapStageView.tsx');
    const mapFloatingNav = readRepoFile('src/components/map-stage/MapFloatingNav.tsx');

    expect(app).toContain("import { AppChrome, AppShell } from './components/app-shell'");
    expect(app).toContain("import { MapFloatingNav } from './components/map-stage/MapFloatingNav'");
    expect(app).toContain('appChromeCenter');
    expect(app).toContain('center={appChromeCenter}');
    expect(appChrome).toContain("import { AppCapsule } from './AppCapsule'");
    expect(appChrome).not.toContain('MapFloatingNav');
    expect(appChrome).not.toContain('mapActions');
    expect(appChrome).not.toContain('mapData');
    expect(appMapStageView).not.toContain("import { AppCapsule } from './app-shell/AppCapsule'");
    expect(appMapStageView).not.toContain('<AppCapsule');
    expect(mapFloatingNav).toContain('export interface MapFloatingNavProps');
    expect(mapFloatingNav).toContain('activeCategory');
    expect(mapFloatingNav).toContain('activeTourismDisplayGroup');
    expect(mapFloatingNav).toContain('onToggleTourismInfo');
    expect(mapFloatingNav).toContain('buildTourismDisplayGroupItems');
    expect(mapFloatingNav).not.toContain('GlobalSettingsMenu');
    expect(mapFloatingNav).not.toContain('map-floating-nav__icon-btn');
  });

  it('tracks the TSK-016 app-shell component implementation boundary', () => {
    expect(repoFileExists('src/components/app-shell/AppCapsule.tsx')).toBe(true);
    expect(repoFileExists('src/components/app-shell/SideDrawer.tsx')).toBe(true);
    expect(repoFileExists('src/components/app-shell/SpeedDialFAB.tsx')).toBe(true);

    const forbiddenCandidateFiles = [
      'src/components/SideDrawer.tsx',
      'src/components/SpeedDialFAB.tsx',
      'src/components/map-stage/SpeedDialFAB.tsx',
    ];

    for (const candidateFile of forbiddenCandidateFiles) {
      expect(repoFileExists(candidateFile), candidateFile).toBe(false);
    }

    const sideDrawer = readRepoFile('src/components/app-shell/SideDrawer.tsx');
    expect(sideDrawer).toContain('export interface SideDrawerProps');
    expect(sideDrawer).toContain('children?: ReactNode');
    expect(sideDrawer).toContain('onClose');
    expect(sideDrawer).not.toContain('메뉴 준비 중');
    expect(sideDrawer).not.toContain('/settings');
  });

  it('keeps SpeedDialFAB as an action-array contract without route or icon-library coupling', () => {
    const speedDialFab = readRepoFile('src/components/app-shell/SpeedDialFAB.tsx');
    const appMapStageView = readRepoFile('src/components/AppMapStageView.tsx');

    expect(speedDialFab).toContain('export interface FABAction');
    expect(speedDialFab).toContain('export interface SpeedDialFABProps');
    expect(speedDialFab).toContain('actions: FABAction[]');
    expect(speedDialFab).toContain('await action.onClick()');
    expect(speedDialFab).not.toContain('/settings');
    expect(speedDialFab).not.toContain('window.history');
    expect(speedDialFab).not.toMatch(/\bti-/);
    expect(appMapStageView).toContain("import { SpeedDialFAB } from './app-shell/SpeedDialFAB'");
    expect(appMapStageView).toContain("id: 'locate-current-position'");
  });

  it('keeps the icon dependency baseline free of Tabler ti-* class assumptions', () => {
    const packageJson = readRepoFile('package.json');
    const appCapsule = readRepoFile('src/components/app-shell/AppCapsule.tsx');
    const speedDialFab = readRepoFile('src/components/app-shell/SpeedDialFAB.tsx');

    expect(packageJson).not.toMatch(/tabler/i);
    expect(appCapsule).not.toMatch(/className=["'`][^"'`]*\bti-/);
    expect(speedDialFab).not.toMatch(/className=["'`][^"'`]*\bti-/);
  });

  it('records BottomNav and MapBottomSheet as separate contracts that FAB work must avoid overlapping', () => {
    const bottomNav = readRepoFile('src/components/BottomNav.tsx');
    const mapBottomSheet = readRepoFile('src/components/map-stage/MapBottomSheet.tsx');
    const appMapStageView = readRepoFile('src/components/AppMapStageView.tsx');

    expect(bottomNav).toContain('export function BottomNav');
    expect(bottomNav).toContain('bottom-nav__active-pill');
    expect(bottomNav).toContain('onChange(item.key)');

    expect(mapBottomSheet).toContain('export function MapBottomSheet');
    expect(mapBottomSheet).toContain('place-drawer__handle');
    expect(mapBottomSheet).toContain('place-drawer__control-rail');
    expect(mapBottomSheet).toContain('onClose');
    expect(mapBottomSheet).toContain('onCollapse');
    expect(mapBottomSheet).toContain('onExpand');

    expect(appMapStageView).toContain("hidden={mapData.drawerState !== 'closed' || Boolean(mapData.selectedTourismPlace)}");
  });
});
