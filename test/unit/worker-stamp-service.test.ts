import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createStampService } from '../../deploy/api-worker-shell/services/stamps';
import type { WorkerEnv } from '../../deploy/api-worker-shell/types';

const authMocks = vi.hoisted(() => ({
  readSessionUser: vi.fn(),
}));

const stampMocks = vi.hoisted(() => ({
  createTravelSession: vi.fn(),
  createUserStamp: vi.fn(),
  readLastStampRow: vi.fn(),
  readPlaceStampRows: vi.fn(),
  readTodayStampRow: vi.fn(),
  readTravelSessionRow: vi.fn(),
  updateStampTravelSession: vi.fn(),
  updateTravelSession: vi.fn(),
}));

vi.mock('../../deploy/api-worker-shell/services/auth', () => ({
  readSessionUser: authMocks.readSessionUser,
}));

vi.mock('../../deploy/api-worker-shell/services/stamp-domain', () => ({
  createTravelSession: stampMocks.createTravelSession,
  createUserStamp: stampMocks.createUserStamp,
  readLastStampRow: stampMocks.readLastStampRow,
  readPlaceStampRows: stampMocks.readPlaceStampRows,
  readTodayStampRow: stampMocks.readTodayStampRow,
  readTravelSessionRow: stampMocks.readTravelSessionRow,
  updateStampTravelSession: stampMocks.updateStampTravelSession,
  updateTravelSession: stampMocks.updateTravelSession,
}));

const env = {
  APP_CORS_ORIGINS: '',
  APP_FRONTEND_URL: 'https://daejeon.jamissue.com',
  APP_STAMP_UNLOCK_RADIUS_METERS: '200',
} as WorkerEnv;

const baseData = {
  collectedPlaceIds: ['place-1'],
  places: [
    {
      id: 'place-1',
      positionId: '101',
      name: 'Place 1',
      latitude: 36.35,
      longitude: 127.38,
    },
  ],
  stampLogs: [{ id: 'stamp-log-1' }],
  travelSessions: [{ id: 'session-1' }],
};

function createService(loadBaseData = vi.fn(async () => baseData)) {
  return {
    loadBaseData,
    service: createStampService({ loadBaseData }),
  };
}

function createStampRequest(payload: unknown) {
  return new Request('https://api.test/api/stamps/toggle', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

async function readJson(response: Response) {
  return response.json() as Promise<unknown>;
}

describe('worker stamp service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMocks.readSessionUser.mockResolvedValue({ id: 'user-1' });
    stampMocks.readTodayStampRow.mockResolvedValue(null);
    stampMocks.readPlaceStampRows.mockResolvedValue([]);
    stampMocks.readLastStampRow.mockResolvedValue(null);
    stampMocks.readTravelSessionRow.mockResolvedValue({ travel_session_id: 55, stamp_count: 1 });
    stampMocks.createTravelSession.mockResolvedValue({ travel_session_id: 55 });
    stampMocks.createUserStamp.mockResolvedValue({ stamp_id: 7 });
    vi.spyOn(Date.prototype, 'toISOString').mockReturnValue('2026-05-14T00:00:00Z');
  });

  it('guards stamp writes behind session auth and validates payload coordinates', async () => {
    authMocks.readSessionUser.mockResolvedValueOnce(null);
    const { service } = createService();

    const unauthorized = await service.handleToggleStamp(createStampRequest({ placeId: 'place-1', latitude: 36.35, longitude: 127.38 }), env);
    const invalid = await service.handleToggleStamp(createStampRequest({ placeId: '', latitude: null, longitude: 127.38 }), env);

    expect(unauthorized.status).toBe(401);
    expect(invalid.status).toBe(400);
  });

  it('rejects unknown places and places outside the unlock radius', async () => {
    const { service } = createService();

    const missing = await service.handleToggleStamp(createStampRequest({ placeId: 'missing-place', latitude: 36.35, longitude: 127.38 }), env);
    const tooFar = await service.handleToggleStamp(createStampRequest({ placeId: 'place-1', latitude: 37.5, longitude: 127.38 }), env);

    expect(missing.status).toBe(404);
    expect(tooFar.status).toBe(403);
  });

  it('returns the latest base data without inserting a duplicate stamp for an existing today row', async () => {
    stampMocks.readTodayStampRow.mockResolvedValueOnce({ stamp_id: 7 });
    const { loadBaseData, service } = createService();

    const response = await service.handleToggleStamp(createStampRequest({ placeId: 'place-1', latitude: 36.35, longitude: 127.38 }), env);
    const payload = await readJson(response);

    expect(response.status).toBe(200);
    expect(payload).toEqual({
      collectedPlaceIds: baseData.collectedPlaceIds,
      logs: baseData.stampLogs,
      travelSessions: baseData.travelSessions,
    });
    expect(loadBaseData).toHaveBeenCalledTimes(2);
    expect(stampMocks.createUserStamp).not.toHaveBeenCalled();
  });

  it('creates a new travel session and stamp when there is no recent stamp', async () => {
    const { service } = createService();

    const response = await service.handleToggleStamp(createStampRequest({ placeId: 'place-1', latitude: 36.35, longitude: 127.38 }), env);

    expect(response.status).toBe(200);
    expect(stampMocks.createTravelSession).toHaveBeenCalledWith(env, expect.objectContaining({
      user_id: 'user-1',
      started_at: '2026-05-14T00:00:00Z',
      stamp_count: 1,
    }));
    expect(stampMocks.createUserStamp).toHaveBeenCalledWith(env, expect.objectContaining({
      user_id: 'user-1',
      position_id: 101,
      travel_session_id: 55,
      visit_ordinal: 1,
      created_at: '2026-05-14T00:00:00Z',
    }));
  });

  it('continues an existing travel session when the last stamp is recent', async () => {
    stampMocks.readPlaceStampRows.mockResolvedValueOnce([{ stamp_id: 1 }, { stamp_id: 2 }]);
    stampMocks.readLastStampRow.mockResolvedValueOnce({
      stamp_id: 2,
      travel_session_id: 55,
      created_at: '2026-05-13T23:59:00Z',
    });
    const { service } = createService();

    const response = await service.handleToggleStamp(createStampRequest({ placeId: 'place-1', latitude: 36.35, longitude: 127.38 }), env);

    expect(response.status).toBe(200);
    expect(stampMocks.readTravelSessionRow).toHaveBeenCalledWith(env, 55);
    expect(stampMocks.updateTravelSession).toHaveBeenCalledWith(env, 55, expect.objectContaining({
      stamp_count: 2,
      last_stamp_at: '2026-05-14T00:00:00Z',
    }));
    expect(stampMocks.createUserStamp).toHaveBeenCalledWith(env, expect.objectContaining({ visit_ordinal: 3 }));
  });

  it('creates a travel session for the previous stamp when the recent stamp has no session id', async () => {
    stampMocks.readLastStampRow.mockResolvedValueOnce({
      stamp_id: 2,
      travel_session_id: null,
      created_at: '2026-05-13T23:59:00Z',
    });
    const { service } = createService();

    const response = await service.handleToggleStamp(createStampRequest({ placeId: 'place-1', latitude: 36.35, longitude: 127.38 }), env);

    expect(response.status).toBe(200);
    expect(stampMocks.createTravelSession).toHaveBeenCalledWith(env, expect.objectContaining({
      started_at: '2026-05-13T23:59:00Z',
      stamp_count: 2,
    }));
    expect(stampMocks.updateStampTravelSession).toHaveBeenCalledWith(env, 2, 55);
  });
});
