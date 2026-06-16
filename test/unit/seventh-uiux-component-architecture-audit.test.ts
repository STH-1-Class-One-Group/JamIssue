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
  it('keeps the current AppShell composition baseline explicit before AppCapsule migration', () => {
    const appShell = readRepoFile('src/components/app-shell/AppShell.tsx');
    const appHeader = readRepoFile('src/components/app-shell/AppHeader.tsx');

    expect(appShell).toContain("import { AppHeader } from './AppHeader'");
    expect(appShell).toContain("import { BottomNav } from '../BottomNav'");
    expect(appShell).toContain("import { GlobalSettingsMenu } from '../GlobalSettingsMenu'");
    expect(appShell).toContain("headerMode?: 'default' | 'hidden'");
    expect(appShell).toContain('<BottomNav activeTab={activeTab} onChange={onBottomTabChange} />');

    expect(appHeader).toContain('canNavigateBack');
    expect(appHeader).toContain('onNavigateBack');
    expect(appHeader).toContain('<GlobalSettingsMenu {...globalUtility} />');
    expect(appHeader).not.toContain('window.history');
  });

  it('records that map center controls moved under the AppCapsule shell', () => {
    const appMapStageView = readRepoFile('src/components/AppMapStageView.tsx');
    const mapFloatingNav = readRepoFile('src/components/map-stage/MapFloatingNav.tsx');

    expect(appMapStageView).toContain("import { AppCapsule } from './app-shell/AppCapsule'");
    expect(appMapStageView).toContain('<AppCapsule');
    expect(appMapStageView).toContain('center={(');
    expect(appMapStageView).toContain('onOpenMenu={onOpenMenu}');
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
