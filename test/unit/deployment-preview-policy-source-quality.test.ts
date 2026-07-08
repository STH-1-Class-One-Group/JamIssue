import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = process.cwd();

function readRepoFile(pathFromRoot: string) {
  return readFileSync(join(repoRoot, pathFromRoot), 'utf8');
}

describe('public repository deployment policy', () => {
  it('keeps Cloudflare Pages deploys preview-only in this repository', () => {
    const workflow = readRepoFile('.github/workflows/cloudflare-pages.yml');

    expect(workflow).toContain('name: cloudflare-pages');
    expect(workflow).toContain('pull_request:');
    expect(workflow).toContain('workflow_dispatch:');
    expect(workflow).toContain('CF_PAGES_BRANCH: preview-');
    expect(workflow).toContain('wrangler@4.74.0 pages deploy');
    expect(workflow).not.toContain("|| 'main'");
    expect(workflow).not.toContain('production_branch');
    expect(workflow).not.toContain('--branch main');
    expect(workflow).not.toContain('production smoke');
  });

  it('does not keep a production smoke workflow in the public repository', () => {
    expect(existsSync(join(repoRoot, '.github/workflows/production-smoke.yml'))).toBe(false);
  });

  it('keeps local Cloudflare Pages helper scripts preview-only', () => {
    const deployScript = readRepoFile('scripts/deploy-cloudflare-pages.ps1');

    expect(deployScript).toContain("[string]$Branch = 'preview-local'");
    expect(deployScript).toContain("$Branch.StartsWith('preview-')");
    expect(deployScript).not.toContain("[string]$Branch = 'main'");
    expect(existsSync(join(repoRoot, 'scripts/create-cloudflare-pages-project.ps1'))).toBe(false);
  });
});
