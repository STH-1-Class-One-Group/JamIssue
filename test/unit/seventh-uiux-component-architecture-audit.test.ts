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
    expect(mapFloatingNav).toContain('export interface MapFloatingNavProps');
    expect(mapFloatingNav).toContain('activeCategory');
    expect(mapFloatingNav).toContain('activeTourismDisplayGroup');
    expect(mapFloatingNav).toContain('onToggleTourismInfo');
    expect(mapFloatingNav).toContain('buildTourismDisplayGroupItems');
    expect(mapFloatingNav).not.toContain('GlobalSettingsMenu');
    expect(mapFloatingNav).not.toContain('map-floating-nav__icon-btn');
  });

  it('tracks the TSK-016 component implementation boundary after AppCapsule shell creation', () => {
    expect(repoFileExists('src/components/app-shell/AppCapsule.tsx')).toBe(true);

    const deferredCandidateFiles = [
      'src/components/SideDrawer.tsx',
      'src/components/app-shell/SideDrawer.tsx',
      'src/components/SpeedDialFAB.tsx',
      'src/components/map-stage/SpeedDialFAB.tsx',
    ];

    for (const candidateFile of deferredCandidateFiles) {
      expect(repoFileExists(candidateFile), candidateFile).toBe(false);
    }
  });

  it('keeps the icon dependency baseline free of Tabler ti-* class assumptions', () => {
    const packageJson = readRepoFile('package.json');
    const mapFloatingNav = readRepoFile('src/components/map-stage/MapFloatingNav.tsx');

    expect(packageJson).not.toMatch(/tabler/i);
    expect(mapFloatingNav).not.toMatch(/className=["'`][^"'`]*\bti-/);
  });

  it('records BottomNav and MapBottomSheet as separate contracts that future FAB work must avoid overlapping', () => {
    const bottomNav = readRepoFile('src/components/BottomNav.tsx');
    const mapBottomSheet = readRepoFile('src/components/map-stage/MapBottomSheet.tsx');

    expect(bottomNav).toContain('export function BottomNav');
    expect(bottomNav).toContain('bottom-nav__active-pill');
    expect(bottomNav).toContain('onChange(item.key)');

    expect(mapBottomSheet).toContain('export function MapBottomSheet');
    expect(mapBottomSheet).toContain('place-drawer__handle');
    expect(mapBottomSheet).toContain('place-drawer__control-rail');
    expect(mapBottomSheet).toContain('onClose');
    expect(mapBottomSheet).toContain('onCollapse');
    expect(mapBottomSheet).toContain('onExpand');
  });
});
