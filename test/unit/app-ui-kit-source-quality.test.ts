import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const workspaceRoot = process.cwd();
const uiKitRoot = join(workspaceRoot, 'src/components/ui-kit');

function readRepoFile(path: string) {
  return readFileSync(join(workspaceRoot, path), 'utf8');
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

  it('does not migrate feature screens to ContentCard during the foundation child', () => {
    const featureFiles = listFiles(join(workspaceRoot, 'src/components'))
      .filter((file) => file.endsWith('.tsx'))
      .filter((file) => !file.includes(`${join('src', 'components', 'ui-kit')}`));

    const migratedFeatures = featureFiles
      .filter((file) => readFileSync(file, 'utf8').includes('ContentCard'))
      .map((file) => relative(workspaceRoot, file));

    expect(migratedFeatures).toEqual([]);
  });
});
