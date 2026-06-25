import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const workspaceRoot = process.cwd();
const uiKitRoot = join(workspaceRoot, 'src/components/ui-kit');

function readRepoFile(path: string) {
  return readFileSync(join(workspaceRoot, path), 'utf8');
}

function toRepoPath(path: string) {
  return relative(workspaceRoot, path).replace(/\\/g, '/');
}

function listFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const fullPath = join(dir, entry);
    if (statSync(fullPath).isDirectory()) {
      return listFiles(fullPath);
    }
    return [fullPath];
  });
}

const approvedContentCardFeatureFiles = [
  'src/components/EventTab.tsx',
  'src/components/FeedCommentSheet.tsx',
  'src/components/PlaceDetailSheet.tsx',
  'src/components/TourismInfoSheet.tsx',
  'src/components/course/CommunityRouteCard.tsx',
  'src/components/place/PlaceProofCard.tsx',
  'src/components/review/PlaceReviewPreviewList.tsx',
  'src/components/review/ReviewListItem.tsx',
];

function listComponentSourceFiles() {
  return listFiles(join(workspaceRoot, 'src/components'))
    .filter((file) => file.endsWith('.ts') || file.endsWith('.tsx'))
    .filter((file) => !file.includes(`${join('src', 'components', 'ui-kit')}`));
}

describe('app UI kit source quality', () => {
  it('keeps ui-kit dependency direction free of feature and domain imports', () => {
    const forbiddenImportPattern =
      /from ['"](?:\.\.\/(?:app-settings|app-shell|common|course|feed|map-stage|my-page|naver-map|notifications|place|review)|\.\.\/\.\.\/(?:api|config|data|hooks|stores|types))/;

    const offenders = listFiles(uiKitRoot)
      .filter((file) => file.endsWith('.ts') || file.endsWith('.tsx'))
      .flatMap((file) => {
        const source = readFileSync(file, 'utf8');
        return forbiddenImportPattern.test(source) ? [relative(workspaceRoot, file)] : [];
      });

    expect(offenders).toEqual([]);
  });

  it('keeps ui-kit CSS on semantic tokens instead of raw visible colors', () => {
    const css = readRepoFile('src/styles/ui-kit.css');
    const rawColorPattern = /(?:#[0-9a-fA-F]{3,8}|rgba?\(|hsla?\(|\bpink\b)/g;
    const matches = css.match(rawColorPattern) ?? [];

    expect(matches).toEqual([]);
    expect(css).toContain('var(--surface-card)');
    expect(css).toContain('var(--color-accent)');
    expect(css).toContain('var(--control-border)');
  });

  it('registers ui-kit CSS after semantic and seasonal theme tokens', () => {
    const indexCss = readRepoFile('src/index.css').replace(/\\r\\n/g, '\\n');
    const semanticIndex = indexCss.indexOf("@import './styles/semantic.css';");
    const winterIndex = indexCss.indexOf("@import './styles/themes/winter.css';");
    const uiKitIndex = indexCss.indexOf("@import './styles/ui-kit.css';");

    expect(semanticIndex).toBeGreaterThanOrEqual(0);
    expect(winterIndex).toBeGreaterThan(semanticIndex);
    expect(uiKitIndex).toBeGreaterThan(winterIndex);
  });

  it('limits feature ContentCard migration to approved TSK-025 execution slices', () => {
    const migratedFeatures = listComponentSourceFiles()
      .filter((file) => readFileSync(file, 'utf8').includes('ContentCard'))
      .map(toRepoPath);

    expect(migratedFeatures.sort()).toEqual([...approvedContentCardFeatureFiles].sort());
  });

  it('keeps ContentCard feature migrations free of raw visual ownership', () => {
    const rawVisibleStylePattern =
      /#[0-9a-fA-F]{3,8}|rgba?\(|hsla?\(|\bpink\b|boxShadow\s*:|box-shadow\s*:|style=\{\{/;

    const offenders = approvedContentCardFeatureFiles.flatMap((repoPath) => {
      const source = readRepoFile(repoPath);
      return rawVisibleStylePattern.test(source) ? [repoPath] : [];
    });

    expect(offenders).toEqual([]);
  });

  it('prevents nested ContentCard composition in migrated feature files', () => {
    const offenders = approvedContentCardFeatureFiles.flatMap((repoPath) => {
      const source = readRepoFile(repoPath);
      const matches = Array.from(source.matchAll(/<\/?ContentCard\b/g));
      const stack: number[] = [];

      for (const match of matches) {
        const token = match[0];

        if (token.startsWith('</')) {
          stack.pop();
          continue;
        }

        if (stack.length > 0) {
          return [repoPath];
        }

        stack.push(match.index ?? 0);
      }

      return [];
    });

    expect(offenders).toEqual([]);
  });

  it('keeps production source free of developer-only visual switchers', () => {
    const sourceFiles = [
      ...listFiles(join(workspaceRoot, 'src'))
        .filter((file) => /\.(ts|tsx|css)$/.test(file))
        .map(toRepoPath),
    ];
    const forbiddenSwitcherPattern =
      /SeasonSwitcher|season-switcher|data-season-switcher|ui-kit-debug|visual-system-debug|dev-theme-switcher/;
    const offenders = sourceFiles.flatMap((repoPath) => {
      const source = readRepoFile(repoPath);
      return forbiddenSwitcherPattern.test(source) ? [repoPath] : [];
    });

    expect(offenders).toEqual([]);
  });
});
