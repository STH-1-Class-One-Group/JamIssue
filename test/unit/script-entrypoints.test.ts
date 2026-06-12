import { beforeEach, describe, expect, it, vi } from 'vitest';

const fsMocks = vi.hoisted(() => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
  readdirSync: vi.fn(),
  statSync: vi.fn(),
  writeFileSync: vi.fn(),
}));

const childProcessMocks = vi.hoisted(() => ({
  spawnSync: vi.fn(),
}));

const sampleParseMocks = vi.hoisted(() => ({
  parseSamplePlaceRows: vi.fn(),
}));

const sampleSqlMocks = vi.hoisted(() => ({
  buildSamplePlaceSeedSql: vi.fn(),
}));

const eventSyncMocks = vi.hoisted(() => ({
  collectEvents: vi.fn(),
  logCollectedEvents: vi.fn(),
  logUploadResult: vi.fn(),
  uploadEvents: vi.fn(),
}));

vi.mock('node:fs', () => ({
  default: fsMocks,
  existsSync: fsMocks.existsSync,
  readFileSync: fsMocks.readFileSync,
  readdirSync: fsMocks.readdirSync,
  statSync: fsMocks.statSync,
  writeFileSync: fsMocks.writeFileSync,
}));

vi.mock('node:child_process', () => ({
  default: childProcessMocks,
  spawnSync: childProcessMocks.spawnSync,
}));

vi.mock('../../scripts/sample-place/parse', () => ({
  parseSamplePlaceRows: sampleParseMocks.parseSamplePlaceRows,
}));

vi.mock('../../scripts/sample-place/sql', () => ({
  buildSamplePlaceSeedSql: sampleSqlMocks.buildSamplePlaceSeedSql,
}));

vi.mock('../../scripts/daejeon-event-sync/fetch', () => ({
  collectEvents: eventSyncMocks.collectEvents,
}));

vi.mock('../../scripts/daejeon-event-sync/report', () => ({
  logCollectedEvents: eventSyncMocks.logCollectedEvents,
  logUploadResult: eventSyncMocks.logUploadResult,
}));

vi.mock('../../scripts/daejeon-event-sync/upload', () => ({
  uploadEvents: eventSyncMocks.uploadEvents,
}));

describe('script entrypoints', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    delete process.env.APP_SUPABASE_URL;
    delete process.env.APP_SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.APP_SUPABASE_PLACE_IMAGE_BUCKET;
    delete process.env.FESTIVAL_SYNC_RANGE_DAYS;
    delete process.env.PUBLIC_EVENT_IMPORT_URL;
    process.argv = ['node', 'script'];
    fsMocks.existsSync.mockReturnValue(true);
    fsMocks.readFileSync.mockReturnValue('<html>sample</html>');
    fsMocks.statSync.mockReturnValue({ isDirectory: () => true });
    fsMocks.readdirSync.mockReturnValue([
      { name: 'alpha.test.ts', isDirectory: () => false, isFile: () => true },
      { name: 'nested', isDirectory: () => true, isFile: () => false },
      { name: 'note.md', isDirectory: () => false, isFile: () => true },
    ]);
    childProcessMocks.spawnSync.mockReturnValue({ status: 0 });
    sampleParseMocks.parseSamplePlaceRows.mockReturnValue([
      {
        number: 1,
        name: 'Sample Cafe',
        rawCategory: '카페',
        latitude: 36.35,
        longitude: 127.38,
      },
    ]);
    sampleSqlMocks.buildSamplePlaceSeedSql.mockReturnValue('-- seed sql');
    eventSyncMocks.collectEvents.mockResolvedValue({ pageCount: 1, items: [{ externalId: 'event-1' }] });
    eventSyncMocks.uploadEvents.mockResolvedValue({ importedEvents: 1 });
  });

  it('generates sample place JSON and SQL from parsed sample rows', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    await import('../../scripts/generate-sample-place-data');

    expect(sampleParseMocks.parseSamplePlaceRows).toHaveBeenCalledWith('<html>sample</html>');
    expect(sampleSqlMocks.buildSamplePlaceSeedSql).toHaveBeenCalledWith([
      expect.objectContaining({
        number: 1,
        slug: expect.stringContaining('sample-cafe'),
        imageExists: true,
        imageStoragePath: 'places/001/hero.png',
      }),
    ]);
    expect(fsMocks.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining('places.generated.json'),
      expect.stringContaining('"count": 1'),
      'utf8',
    );
    expect(fsMocks.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining('20260323_seed_sample_places.sql'),
      expect.any(Buffer),
    );
    expect(consoleSpy).toHaveBeenCalledWith('generated 1 places');
  });

  it('fails sample place generation when parsed rows or required local images are missing', async () => {
    sampleParseMocks.parseSamplePlaceRows.mockReturnValueOnce([]);
    await expect(import('../../scripts/generate-sample-place-data')).rejects.toThrow();

    vi.resetModules();
    sampleParseMocks.parseSamplePlaceRows.mockReturnValueOnce([
      {
        number: 1,
        name: 'Sample Cafe',
        rawCategory: '카페',
        latitude: 36.35,
        longitude: 127.38,
      },
    ]);
    fsMocks.existsSync.mockReturnValue(false);
    await expect(import('../../scripts/generate-sample-place-data')).rejects.toThrow();
  });

  it('uploads sample place images and patches public image metadata', async () => {
    process.env.APP_SUPABASE_URL = 'https://supabase.test';
    process.env.APP_SUPABASE_SERVICE_ROLE_KEY = 'service-key';
    process.env.APP_SUPABASE_PLACE_IMAGE_BUCKET = 'bucket';
    fsMocks.readFileSync.mockImplementation((path: string) => {
      if (path.endsWith('places.generated.json')) {
        return JSON.stringify({
          places: [{
            number: 1,
            slug: 'sample-cafe',
            imageFileName: 'hero.png',
            imageStoragePath: 'old/path.png',
          }],
        });
      }
      return Buffer.from('image');
    });
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 200 })));
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    await import('../../scripts/upload-sample-place-images');
    await vi.waitFor(() => expect(consoleSpy).toHaveBeenCalledWith('uploaded 1 place images to bucket'));

    expect(fetch).toHaveBeenCalledWith(
      'https://supabase.test/storage/v1/object/bucket/places/001/hero.png',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(fetch).toHaveBeenCalledWith(
      'https://supabase.test/rest/v1/map?slug=eq.sample-cafe',
      expect.objectContaining({ method: 'PATCH' }),
    );
  });

  it('reports sample image upload configuration and request failures through the entrypoint catch', async () => {
    process.exitCode = undefined;
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    await expect(import('../../scripts/upload-sample-place-images')).rejects.toThrow('APP_SUPABASE_URL');
    expect(errorSpy).not.toHaveBeenCalled();

    vi.resetModules();
    process.exitCode = undefined;
    process.env.APP_SUPABASE_URL = 'https://supabase.test';
    process.env.APP_SUPABASE_SERVICE_ROLE_KEY = 'service-key';
    fsMocks.readFileSync.mockImplementation((filePath: string) => {
      if (filePath.endsWith('places.generated.json')) {
        return JSON.stringify({
          places: [{
            number: 1,
            slug: 'sample-cafe',
            imageFileName: 'hero.unknown',
            imageStoragePath: 'old/path.png',
          }],
        });
      }
      return Buffer.from('image');
    });
    vi.stubGlobal('fetch', vi.fn(async () => new Response('upload failed', { status: 500 })));

    await import('../../scripts/upload-sample-place-images');
    await vi.waitFor(() => expect(process.exitCode).toBe(1));
    expect(errorSpy).toHaveBeenCalledWith(expect.any(Error));
    expect(fetch).toHaveBeenCalledWith(
      'https://supabase.test/storage/v1/object/place-images/places/001/hero.png',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'Content-Type': 'application/octet-stream' }),
      }),
    );
  });

  it('syncs Daejeon events with explicit range and skips upload in dry-run mode', async () => {
    const originalArgv = process.argv;
    process.argv = ['node', 'scripts/sync-daejeon-events.ts', '--dry-run', '--from', '2026-05-01', '--to', '2026-05-31'];

    await import('../../scripts/sync-daejeon-events');
    await vi.waitFor(() => expect(eventSyncMocks.logCollectedEvents).toHaveBeenCalled());

    expect(eventSyncMocks.collectEvents).toHaveBeenCalledWith({ from: '2026-05-01', to: '2026-05-31' });
    expect(eventSyncMocks.uploadEvents).not.toHaveBeenCalled();
    process.argv = originalArgv;
  });

  it('syncs Daejeon events with default range and uploads when not dry-run', async () => {
    process.env.FESTIVAL_SYNC_RANGE_DAYS = '1';

    await import('../../scripts/sync-daejeon-events');
    await vi.waitFor(() => expect(eventSyncMocks.uploadEvents).toHaveBeenCalled());

    expect(eventSyncMocks.collectEvents).toHaveBeenCalledWith(expect.objectContaining({
      from: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      to: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
    }));
    expect(eventSyncMocks.logUploadResult).toHaveBeenCalledWith(1, process.env.PUBLIC_EVENT_IMPORT_URL);
  });

  it('runs unit test files one by one and exits on the first failure status', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => undefined) as never);
    fsMocks.readdirSync
      .mockReturnValueOnce([
        { name: 'alpha.test.ts', isDirectory: () => false, isFile: () => true },
        { name: 'nested', isDirectory: () => true, isFile: () => false },
      ])
      .mockReturnValueOnce([
        { name: 'beta.test.tsx', isDirectory: () => false, isFile: () => true },
      ]);

    await import('../../scripts/run-unit-tests');

    expect(childProcessMocks.spawnSync).toHaveBeenCalledTimes(2);
    expect(childProcessMocks.spawnSync.mock.calls.map((call) => call[1]?.at(-1))).toEqual([
      'test\\unit\\alpha.test.ts',
      'test\\unit\\nested\\beta.test.tsx',
    ]);
    expect(exitSpy).not.toHaveBeenCalled();

    vi.resetModules();
    childProcessMocks.spawnSync.mockReturnValueOnce({ status: 3 });
    fsMocks.readdirSync.mockReturnValueOnce([
      { name: 'alpha.test.ts', isDirectory: () => false, isFile: () => true },
    ]);
    await import('../../scripts/run-unit-tests');
    expect(exitSpy).toHaveBeenCalledWith(3);
  });

  it('validates the Worker tourism smoke contract success path without live network calls', async () => {
    process.exitCode = undefined;
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({
      sourceReady: true,
      sourceName: 'KTO',
      importedAt: '2026-06-01T00:00:00Z',
      facets: { contentTypes: [], ktoFacets: [], districts: [] },
      items: [{ id: 'kto-1', name: 'Place', category: 'tourism', district: 'District', isCurated: false, curatedPlace: null }],
    })));

    await import('../../scripts/smoke-worker-tourism-contract');
    await vi.waitFor(() => expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('"ok":true')));

    expect(process.exitCode).toBeUndefined();
    expect(fetch).toHaveBeenCalledWith(
      'https://api.daejeon.jamissue.com/api/tourism/places?limit=3',
      { headers: { accept: 'application/json' } },
    );
  });

  it('reports Worker tourism smoke contract failures without throwing', async () => {
    vi.resetModules();
    process.env.JAMISSUE_API_BASE_URL = 'https://api.override.test/';
    process.exitCode = undefined;
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({
      sourceReady: 'yes',
      facets: {},
      items: [{ id: 'kto-1', name: 'Place', category: 'tourism' }],
      raw_payload: { leaked: true },
    }, { status: 500 })));

    await import('../../scripts/smoke-worker-tourism-contract');
    await vi.waitFor(() => expect(process.exitCode).toBe(1));

    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('"ok": false'));
    expect(fetch).toHaveBeenCalledWith(
      'https://api.override.test/api/tourism/places?limit=3',
      { headers: { accept: 'application/json' } },
    );
  });
});
