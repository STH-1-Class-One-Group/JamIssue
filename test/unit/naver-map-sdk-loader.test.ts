import { beforeEach, describe, expect, it, vi } from 'vitest';

function setWindowNaverMaps(maps: unknown) {
  Object.defineProperty(window, 'naver', {
    configurable: true,
    value: { maps },
  });
}

function clearWindowNaverMaps() {
  Object.defineProperty(window, 'naver', {
    configurable: true,
    value: undefined,
  });
}

function latestNaverScript() {
  const scripts = Array.from(document.querySelectorAll<HTMLScriptElement>('script[src*="oapi.map.naver.com"]'));
  return scripts.at(-1);
}

describe('Naver map SDK loader', () => {
  beforeEach(() => {
    vi.resetModules();
    document.head.innerHTML = '';
    clearWindowNaverMaps();
  });

  it('returns the already-loaded Naver maps object without appending a script', async () => {
    const maps = { Map: vi.fn() };
    setWindowNaverMaps(maps);
    const { loadNaverMaps } = await import('../../src/components/naver-map/mapSdk');

    await expect(loadNaverMaps('client-id')).resolves.toBe(maps);

    expect(latestNaverScript()).toBeUndefined();
  });

  it('loads the SDK once and resolves concurrent calls from the same script', async () => {
    const maps = { Map: vi.fn() };
    const { loadNaverMaps } = await import('../../src/components/naver-map/mapSdk');

    const firstLoad = loadNaverMaps('client-id');
    const secondLoad = loadNaverMaps('client-id');
    const script = latestNaverScript();
    setWindowNaverMaps(maps);
    script?.dispatchEvent(new Event('load'));

    await expect(firstLoad).resolves.toBe(maps);
    await expect(secondLoad).resolves.toBe(maps);
    expect(script?.src).toContain('ncpKeyId=client-id');
    expect(document.querySelectorAll('script[src*="oapi.map.naver.com"]')).toHaveLength(1);
  });

  it('rejects when the SDK script loads without exposing the maps API', async () => {
    const { loadNaverMaps } = await import('../../src/components/naver-map/mapSdk');

    const load = loadNaverMaps('client-id');
    latestNaverScript()?.dispatchEvent(new Event('load'));

    await expect(load).rejects.toThrow();
  });

  it('rejects when the SDK script fails to load', async () => {
    const { loadNaverMaps } = await import('../../src/components/naver-map/mapSdk');

    const load = loadNaverMaps('client-id');
    latestNaverScript()?.dispatchEvent(new Event('error'));

    await expect(load).rejects.toThrow();
  });
});
