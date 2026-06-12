import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { WorkerEnv } from '../../deploy/api-worker-shell/types';

const repositoryMocks = vi.hoisted(() => ({
  deleteStaleFestivalRows: vi.fn(),
  ensureImportedFestivalSource: vi.fn(),
  loadExistingFestivalRows: vi.fn(),
  loadFestivalRows: vi.fn(),
  loadFestivalSourceMetadata: vi.fn(),
  updateFestivalSourceMetadata: vi.fn(),
  upsertFestivalRows: vi.fn(),
}));

vi.mock('../../deploy/api-worker-shell/services/festival-domain/repository', () => repositoryMocks);

import { upsertImportedFestivalItems } from '../../deploy/api-worker-shell/services/festival-domain/import-service';
import { loadBannerEvents, loadFestivalCards } from '../../deploy/api-worker-shell/services/festival-domain/read-service';

function buildEnv(overrides: WorkerEnv = {}): WorkerEnv {
  return {
    APP_PUBLIC_EVENT_CITY_KEYWORD: 'Daejeon',
    ...overrides,
  };
}

function eventRow(overrides: Record<string, unknown> = {}) {
  return {
    public_event_id: 1,
    title: 'Daejeon Festival',
    venue_name: 'Daejeon Plaza',
    district: 'Daejeon',
    address: 'Daejeon Jung-gu',
    road_address: 'Daejeon Road',
    starts_at: '2026-05-10T00:00:00.000Z',
    ends_at: '2026-05-20T00:00:00.000Z',
    summary: 'summary',
    source_page_url: 'https://festival.example.test',
    latitude: 36.35,
    longitude: 127.38,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  repositoryMocks.deleteStaleFestivalRows.mockResolvedValue(undefined);
  repositoryMocks.ensureImportedFestivalSource.mockResolvedValue({ source_id: 7 });
  repositoryMocks.loadExistingFestivalRows.mockResolvedValue([]);
  repositoryMocks.loadFestivalRows.mockResolvedValue([]);
  repositoryMocks.loadFestivalSourceMetadata.mockResolvedValue([]);
  repositoryMocks.updateFestivalSourceMetadata.mockResolvedValue(undefined);
  repositoryMocks.upsertFestivalRows.mockResolvedValue(undefined);
});

describe('festival import service', () => {
  it('rejects imports when no normalized festival items survive filtering', async () => {
    await expect(upsertImportedFestivalItems(buildEnv(), [])).rejects.toThrow('No valid festival items');
    await expect(upsertImportedFestivalItems(buildEnv(), [{ title: 'Outside City', roadAddress: 'Seoul' }])).rejects.toThrow(
      'No valid festival items',
    );

    expect(repositoryMocks.ensureImportedFestivalSource).not.toHaveBeenCalled();
    expect(repositoryMocks.upsertFestivalRows).not.toHaveBeenCalled();
  });

  it('upserts normalized items, deletes stale rows, and falls back blank metadata', async () => {
    repositoryMocks.loadExistingFestivalRows.mockResolvedValue([
      { public_event_id: 10, external_id: 'stale-event' },
      { public_event_id: 11, external_id: 'event-1' },
    ]);

    const imported = await upsertImportedFestivalItems(
      buildEnv(),
      [{
        externalId: 'event-1',
        title: 'Daejeon Festival',
        roadAddress: 'Daejeon Road',
        startsAt: '2026-05-10',
        endsAt: '2026-05-11',
      }],
      { sourceName: '   ', sourceUrl: '', importedAt: 'not-a-date' },
    );

    expect(imported).toHaveLength(1);
    expect(repositoryMocks.ensureImportedFestivalSource).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(String),
      expect.any(String),
    );
    expect(repositoryMocks.upsertFestivalRows).toHaveBeenCalledWith(expect.any(Object), [
      expect.objectContaining({ source_id: 7, title: 'Daejeon Festival' }),
    ]);
    expect(repositoryMocks.deleteStaleFestivalRows).toHaveBeenCalledWith(expect.any(Object), [10, 11]);
    expect(repositoryMocks.updateFestivalSourceMetadata).toHaveBeenCalledWith(
      expect.any(Object),
      7,
      expect.any(String),
      expect.any(String),
      expect.stringMatching(/T/),
      expect.stringMatching(/T/),
    );
  });
});

describe('festival read service', () => {
  it('returns empty festival cards and not-ready banner fields when source metadata is missing', async () => {
    await expect(loadFestivalCards(buildEnv(), Date.parse('2026-05-11T00:00:00Z'))).resolves.toEqual([]);
    await expect(loadBannerEvents(Date.parse('2026-05-11T00:00:00Z'), buildEnv())).resolves.toEqual({
      sourceReady: false,
      sourceName: null,
      importedAt: null,
      items: [],
    });

    expect(repositoryMocks.loadFestivalRows).not.toHaveBeenCalled();
  });

  it('filters festival card rows by configured area and active display window', async () => {
    repositoryMocks.loadFestivalSourceMetadata.mockResolvedValue([{ source_id: 7, name: 'Source', last_imported_at: null }]);
    repositoryMocks.loadFestivalRows.mockResolvedValue([
      eventRow({ public_event_id: 1 }),
      eventRow({
        public_event_id: 2,
        address: 'Seoul',
        district: 'Seoul',
        road_address: 'Seoul',
        title: 'Seoul Festival',
        venue_name: 'Seoul Plaza',
      }),
      eventRow({ public_event_id: 3, starts_at: 'bad-date', ends_at: 'bad-date' }),
      eventRow({ public_event_id: 4, starts_at: '2026-08-01T00:00:00.000Z', ends_at: '2026-08-02T00:00:00.000Z' }),
    ]);

    const cards = await loadFestivalCards(buildEnv(), Date.parse('2026-05-11T00:00:00Z'));

    expect(cards).toEqual([
      expect.objectContaining({ id: '1', title: 'Daejeon Festival' }),
    ]);
    expect(repositoryMocks.loadFestivalRows).toHaveBeenCalledWith(
      expect.any(Object),
      7,
      expect.stringMatching(/2026-05-11/),
      expect.any(String),
      expect.any(Number),
    );
  });

  it('marks banner source ready when metadata exists even without displayable items', async () => {
    repositoryMocks.loadFestivalSourceMetadata.mockResolvedValue([
      { source_id: 7, name: 'Source', last_imported_at: '2026-05-11T00:00:00.000Z' },
    ]);
    repositoryMocks.loadFestivalRows.mockResolvedValue([]);

    await expect(loadBannerEvents(Date.parse('2026-05-11T00:00:00Z'), buildEnv())).resolves.toEqual({
      sourceReady: true,
      sourceName: 'Source',
      importedAt: '2026-05-11T00:00:00.000Z',
      items: [],
    });
  });
});
