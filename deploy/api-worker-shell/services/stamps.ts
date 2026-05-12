import { WorkerStampRuntimeConfig } from '../config/runtime';
import { toSeoulDateKey } from '../lib/dates';
import { jsonResponse } from '../lib/http';
import type { WorkerEnv, WorkerJsonRecord } from '../types';
import { readSessionUser } from './auth';
import type { WorkerStampServiceDeps } from './stamp-domain';
import {
  createTravelSession,
  createUserStamp,
  readLastStampRow,
  readPlaceStampRows,
  readTodayStampRow,
  readTravelSessionRow,
  updateStampTravelSession,
  updateTravelSession,
} from './stamp-domain';

function getStampUnlockRadius(env: WorkerEnv) {
  const parsed = Number(env.APP_STAMP_UNLOCK_RADIUS_METERS ?? WorkerStampRuntimeConfig.defaultUnlockRadiusMeters);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : WorkerStampRuntimeConfig.defaultUnlockRadiusMeters;
}

function calculateDistanceMeters(
  startLatitude: number,
  startLongitude: number,
  endLatitude: number,
  endLongitude: number,
) {
  const latitudeDelta = (endLatitude - startLatitude) * WorkerStampRuntimeConfig.radiansPerDegree;
  const longitudeDelta = (endLongitude - startLongitude) * WorkerStampRuntimeConfig.radiansPerDegree;
  const startLatitudeRadians = startLatitude * WorkerStampRuntimeConfig.radiansPerDegree;
  const endLatitudeRadians = endLatitude * WorkerStampRuntimeConfig.radiansPerDegree;
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(startLatitudeRadians) * Math.cos(endLatitudeRadians) * Math.sin(longitudeDelta / 2) ** 2;
  return WorkerStampRuntimeConfig.earthRadiusMeters * (2 * Math.asin(Math.sqrt(haversine)));
}

function formatDistanceMeters(distanceMeters: number) {
  if (!Number.isFinite(distanceMeters)) {
    return '알 수 없음';
  }
  if (distanceMeters >= WorkerStampRuntimeConfig.metersPerKilometer) {
    return `${(distanceMeters / WorkerStampRuntimeConfig.metersPerKilometer).toFixed(1)}km`;
  }
  return `${Math.round(distanceMeters)}m`;
}

function buildNearPlaceMessage(placeName: string, distanceMeters: number, unlockRadius: number) {
  return `${placeName}까지 ${formatDistanceMeters(distanceMeters)} 남아있어요. 반경 ${unlockRadius}m 안에 들어오면 열려요.`;
}

async function requireSessionUser(request: Request, env: WorkerEnv) {
  const sessionUser = await readSessionUser(request, env);
  if (!sessionUser) {
    return { response: jsonResponse(401, { detail: '로그인이 필요해요.' }, env, request) };
  }
  return { sessionUser };
}

async function readJsonBody(request: Request): Promise<WorkerJsonRecord> {
  try {
    return (await request.json()) as WorkerJsonRecord;
  } catch {
    throw new Error('요청 형식이 올바르지 않아요.');
  }
}

export function createStampService({ loadBaseData }: WorkerStampServiceDeps) {
  async function handleToggleStamp(request: Request, env: WorkerEnv) {
    const sessionResult = await requireSessionUser(request, env);
    if (sessionResult.response) {
      return sessionResult.response;
    }

    const payload = await readJsonBody(request);
    const placeId = String(payload.placeId ?? '').trim();
    const latitude = Number(payload.latitude);
    const longitude = Number(payload.longitude);

    if (!placeId || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return jsonResponse(400, { detail: '장소와 현재 좌표가 필요해요.' }, env, request);
    }

    const baseData = await loadBaseData(env, sessionResult.sessionUser.id);
    const place = baseData.places.find((item) => item.id === placeId);

    if (!place) {
      return jsonResponse(404, { detail: '장소를 찾지 못했어요.' }, env, request);
    }

    const distanceMeters = calculateDistanceMeters(latitude, longitude, place.latitude, place.longitude);
    const unlockRadius = getStampUnlockRadius(env);

    if (distanceMeters > unlockRadius) {
      return jsonResponse(403, { detail: buildNearPlaceMessage(place.name, distanceMeters, unlockRadius) }, env, request);
    }

    const stampDate = toSeoulDateKey();
    const existingTodayRow = await readTodayStampRow(env, sessionResult.sessionUser.id, place.positionId, stampDate);

    if (existingTodayRow) {
      const nextBaseData = await loadBaseData(env, sessionResult.sessionUser.id);
      return jsonResponse(
        200,
        {
          collectedPlaceIds: nextBaseData.collectedPlaceIds,
          logs: nextBaseData.stampLogs,
          travelSessions: nextBaseData.travelSessions,
        },
        env,
        request,
      );
    }

    const nowIso = new Date().toISOString();
    const placeStampRows = await readPlaceStampRows(env, sessionResult.sessionUser.id, place.positionId);
    const visitOrdinal = placeStampRows.length + 1;
    const lastStampRow = await readLastStampRow(env, sessionResult.sessionUser.id);
    let travelSessionId: number | null = null;

    if (lastStampRow) {
      const gapMs = new Date(nowIso).getTime() - new Date(lastStampRow.created_at).getTime();
      if (gapMs <= WorkerStampRuntimeConfig.travelSessionGapMs) {
        if (lastStampRow.travel_session_id) {
          travelSessionId = Number(lastStampRow.travel_session_id);
          const sessionRow = await readTravelSessionRow(env, travelSessionId);
          await updateTravelSession(env, travelSessionId, {
            ended_at: nowIso,
            last_stamp_at: nowIso,
            stamp_count: Number(sessionRow?.stamp_count ?? 0) + 1,
            updated_at: nowIso,
          });
        } else {
          const createdSession = await createTravelSession(env, {
            user_id: sessionResult.sessionUser.id,
            started_at: lastStampRow.created_at,
            ended_at: nowIso,
            last_stamp_at: nowIso,
            stamp_count: 2,
            created_at: nowIso,
            updated_at: nowIso,
          });

          travelSessionId = Number(createdSession?.travel_session_id);
          await updateStampTravelSession(env, lastStampRow.stamp_id, travelSessionId);
        }
      }
    }

    if (!travelSessionId) {
      const createdSession = await createTravelSession(env, {
        user_id: sessionResult.sessionUser.id,
        started_at: nowIso,
        ended_at: nowIso,
        last_stamp_at: nowIso,
        stamp_count: 1,
        created_at: nowIso,
        updated_at: nowIso,
      });

      travelSessionId = Number(createdSession?.travel_session_id);
    }

    await createUserStamp(env, {
      user_id: sessionResult.sessionUser.id,
      position_id: Number(place.positionId),
      travel_session_id: travelSessionId,
      stamp_date: stampDate,
      visit_ordinal: visitOrdinal,
      created_at: nowIso,
    });

    const nextBaseData = await loadBaseData(env, sessionResult.sessionUser.id);
    return jsonResponse(
      200,
      {
        collectedPlaceIds: nextBaseData.collectedPlaceIds,
        logs: nextBaseData.stampLogs,
        travelSessions: nextBaseData.travelSessions,
      },
      env,
      request,
    );
  }

  return { handleToggleStamp };
}
