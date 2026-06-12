import { beforeEach, describe, expect, it, vi } from 'vitest';

async function importSharedWithEnv(env: Record<string, string | undefined> = {}) {
  vi.resetModules();
  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
  return import('../../scripts/smoke/shared');
}

describe('smoke shared helpers', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.resetModules();
    delete process.env.SMOKE_BASE_URL;
    delete process.env.SMOKE_API_BASE_URL;
    delete process.env.SMOKE_FORCE_API_BASE_URL;
    delete process.env.SMOKE_RETRY_ATTEMPTS;
    delete process.env.SMOKE_RETRY_DELAY_MS;
    delete process.env.SMOKE_DEPLOY_WAIT_MS;
  });

  it('builds request headers and parses runtime config bootstraps', async () => {
    const shared = await importSharedWithEnv();

    expect(shared.buildRequestHeaders('application/json')).toEqual(expect.objectContaining({
      accept: 'application/json',
      'cache-control': 'no-cache',
      pragma: 'no-cache',
      'user-agent': expect.stringContaining('Mozilla'),
    }));
    expect(shared.parseRuntimeConfig('window.__JAMISSUE_CONFIG__ = {"apiBaseUrl":"https://api.test"};')).toEqual({
      apiBaseUrl: 'https://api.test',
    });
    expect(() => shared.parseRuntimeConfig('window.__OTHER__ = {};')).toThrow('runtime config bootstrap is missing');
  });

  it('resolves API base URLs in runtime, forced override, configured override, and default order', async () => {
    let shared = await importSharedWithEnv({ SMOKE_API_BASE_URL: 'https://override.test/' });
    expect(shared.resolveApiBaseUrl({
      runtimeConfig: { apiBaseUrl: 'https://runtime.test/' },
      configuredApiBaseUrl: 'https://override.test/',
    })).toBe('https://runtime.test');

    shared = await importSharedWithEnv({ SMOKE_API_BASE_URL: 'https://override.test/', SMOKE_FORCE_API_BASE_URL: '1' });
    expect(shared.resolveApiBaseUrl({
      runtimeConfig: { apiBaseUrl: 'https://runtime.test/' },
      configuredApiBaseUrl: 'https://override.test/',
    })).toBe('https://override.test');

    expect(shared.resolveApiBaseUrl({
      runtimeConfig: null,
      configuredApiBaseUrl: 'https://override.test/',
    })).toBe('https://override.test');
    expect(shared.resolveApiBaseUrl({
      runtimeConfig: null,
      configuredApiBaseUrl: '',
      defaultApiBaseUrl: 'https://default.test/',
    })).toBe('https://default.test');
  });

  it('fetches text and JSON with timeout-wrapped fetch calls and rejects invalid JSON with a diagnostic snippet', async () => {
    const shared = await importSharedWithEnv();
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (url.endsWith('/json')) {
        return new Response('{"ok":true}', { status: 200, headers: { 'content-type': 'application/json' } });
      }
      if (url.endsWith('/empty-json')) {
        return new Response(null, { status: 204 });
      }
      if (url.endsWith('/bad-json')) {
        return new Response('<html>bad json</html>', { status: 200, headers: { 'content-type': 'text/html' } });
      }
      return new Response('plain text', { status: 200 });
    }));

    await expect(shared.fetchText('https://app.test/')).resolves.toMatchObject({
      response: expect.objectContaining({ status: 200 }),
      text: 'plain text',
    });
    await expect(shared.fetchJson('https://app.test/json')).resolves.toMatchObject({
      json: { ok: true },
      text: '{"ok":true}',
    });
    await expect(shared.fetchJson('https://app.test/empty-json')).resolves.toMatchObject({
      json: null,
      text: '',
    });
    await expect(shared.fetchJson('https://app.test/bad-json')).rejects.toThrow('returned invalid JSON');
  });

  it('wraps smoke checks with ok/error results and assertion failures', async () => {
    const shared = await importSharedWithEnv();

    await expect(shared.runCheck('ok-check', async () => undefined)).resolves.toEqual(expect.objectContaining({
      name: 'ok-check',
      ok: true,
      durationMs: expect.any(Number),
    }));
    await expect(shared.runCheck('bad-check', async () => {
      shared.assert(false, 'failed assertion');
    })).resolves.toEqual(expect.objectContaining({
      name: 'bad-check',
      ok: false,
      error: 'failed assertion',
    }));
    shared.assert(true, 'not thrown');
    await expect(shared.runCheck('string-check', async () => {
      throw 'string failure';
    })).resolves.toEqual(expect.objectContaining({
      name: 'string-check',
      ok: false,
      error: 'string failure',
    }));
  });

  it('retries only failed checks and preserves the final attempt metadata', async () => {
    const shared = await importSharedWithEnv({ SMOKE_RETRY_ATTEMPTS: '2', SMOKE_RETRY_DELAY_MS: '0' });
    let flakyRuns = 0;

    const results = await shared.runChecksWithRetries([
      { name: 'stable', run: vi.fn(async () => ({ name: 'stable', ok: true, durationMs: 1 })) },
      {
        name: 'flaky',
        run: vi.fn(async () => {
          flakyRuns += 1;
          return { name: 'flaky', ok: flakyRuns > 1, durationMs: 1 };
        }),
      },
    ]);

    expect(results).toEqual([
      expect.objectContaining({ name: 'stable', ok: true, attempt: 1 }),
      expect.objectContaining({ name: 'flaky', ok: true, attempt: 2 }),
    ]);
  });

  it('stops retrying after the configured attempt count', async () => {
    const shared = await importSharedWithEnv({ SMOKE_RETRY_ATTEMPTS: '2', SMOKE_RETRY_DELAY_MS: '0' });
    const alwaysFail = vi.fn(async () => ({ name: 'always-fail', ok: false, durationMs: 1, error: 'still bad' }));

    const results = await shared.runChecksWithRetries([{ name: 'always-fail', run: alwaysFail }]);

    expect(alwaysFail).toHaveBeenCalledTimes(2);
    expect(results).toEqual([expect.objectContaining({ name: 'always-fail', ok: false, attempt: 2 })]);
  });

  it('loads runtime config from app-config.js and falls back when config fetching fails', async () => {
    let shared = await importSharedWithEnv({ SMOKE_API_BASE_URL: 'https://override.test' });
    vi.stubGlobal('fetch', vi.fn(async () => new Response('window.__JAMISSUE_CONFIG__ = {"apiBaseUrl":"https://runtime.test"};', { status: 200 })));

    await expect(shared.loadRuntimeConfig()).resolves.toMatchObject({
      runtimeConfig: { apiBaseUrl: 'https://runtime.test' },
      apiBaseUrl: 'https://runtime.test',
    });

    shared = await importSharedWithEnv({ SMOKE_API_BASE_URL: 'https://override.test' });
    vi.stubGlobal('fetch', vi.fn(async () => new Response('not found', { status: 404 })));

    await expect(shared.loadRuntimeConfig()).resolves.toMatchObject({
      runtimeConfig: null,
      apiBaseUrl: 'https://override.test',
    });

    shared = await importSharedWithEnv({ SMOKE_API_BASE_URL: 'https://override.test' });
    vi.stubGlobal('fetch', vi.fn(async () => {
      throw new Error('network down');
    }));

    await expect(shared.loadRuntimeConfig()).resolves.toMatchObject({
      runtimeConfig: null,
      apiBaseUrl: 'https://override.test',
      appConfigResult: expect.objectContaining({ error: 'network down' }),
    });
  });

  it('prints smoke suite summaries and sets exitCode when checks fail', async () => {
    const shared = await importSharedWithEnv({ SMOKE_RETRY_ATTEMPTS: '1', SMOKE_DEPLOY_WAIT_MS: '0' });
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const originalExitCode = process.exitCode;

    const result = await shared.runSmokeSuite({
      suiteName: 'unit-smoke',
      checks: [
        { name: 'ok', run: vi.fn(async () => ({ name: 'ok', ok: true, durationMs: 1 })) },
        { name: 'bad', run: vi.fn(async () => ({ name: 'bad', ok: false, durationMs: 1, error: 'bad' })) },
      ],
      runtimeConfig: { apiBaseUrl: 'https://runtime.test' },
      appConfigResult: { response: null, text: '' },
      apiBaseUrl: 'https://runtime.test',
    });

    expect(result.failed).toHaveLength(1);
    expect(process.exitCode).toBe(1);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('"suite": "unit-smoke"'));
    process.exitCode = originalExitCode;
  });

  it('matches script entry URLs against argv paths', async () => {
    const shared = await importSharedWithEnv();

    expect(shared.scriptEntryMatches('file:///D:/JamIssue/scripts/run.ts', 'D:\\JamIssue\\scripts\\run.ts')).toBe(true);
    expect(shared.scriptEntryMatches('file:///D:/JamIssue/scripts/run.ts', undefined)).toBe(false);
  });
});
