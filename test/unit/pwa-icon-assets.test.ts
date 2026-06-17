import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const requiredIconPaths = [
  '/icons/jamissue-icon-1024.png',
  '/icons/jamissue-maskable-1024.png',
  '/icons/apple-touch-icon.png',
  '/icons/favicon.png',
];

describe('PWA icon asset policy', () => {
  it('uses the JamIssue logo PNG as the source for generated app icons', () => {
    const nodeBuildScript = readFileSync('scripts/build-frontend.mjs', 'utf8');
    const powershellBuildScript = readFileSync('scripts/build-frontend.ps1', 'utf8');

    expect(nodeBuildScript).toContain('src/assets/jamissue-logo.png');
    expect(powershellBuildScript).toContain('src/assets/jamissue-logo.png');
    expect(nodeBuildScript).not.toContain('createIconSvg');
    expect(powershellBuildScript).not.toContain('jamissue-icon.svg');
  });

  it('publishes manifest and HTML references for iOS and PWA icon consumers', () => {
    const nodeBuildScript = readFileSync('scripts/build-frontend.mjs', 'utf8');

    for (const iconPath of requiredIconPaths) {
      expect(nodeBuildScript).toContain(iconPath);
    }

    expect(nodeBuildScript).toContain('rel="apple-touch-icon"');
    expect(nodeBuildScript).toContain("purpose: 'maskable'");
  });
});
