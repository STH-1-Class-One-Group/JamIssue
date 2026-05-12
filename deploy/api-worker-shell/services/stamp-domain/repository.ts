import { encodeFilterValue, supabaseRequest } from '../../lib/supabase';
import type { WorkerEnv, WorkerJsonRecord } from '../../types';

export interface WorkerStampRow extends WorkerJsonRecord {
  stamp_id: string | number;
  travel_session_id?: string | number | null;
}

export interface WorkerLastStampRow extends WorkerStampRow {
  created_at: string;
}

export interface WorkerTravelSessionRow extends WorkerJsonRecord {
  travel_session_id: string | number;
  stamp_count?: string | number | null;
}

export async function readTodayStampRow(
  env: WorkerEnv,
  userId: string,
  positionId: string,
  stampDate: string,
): Promise<WorkerStampRow | null> {
  const rows = await supabaseRequest<WorkerStampRow[]>(
    env,
    `user_stamp?select=stamp_id&user_id=eq.${encodeFilterValue(userId)}&position_id=eq.${encodeFilterValue(
      positionId,
    )}&stamp_date=eq.${encodeFilterValue(stampDate)}&limit=1`,
  );

  return rows?.[0] ?? null;
}

export async function readPlaceStampRows(env: WorkerEnv, userId: string, positionId: string): Promise<WorkerStampRow[]> {
  return (
    (await supabaseRequest<WorkerStampRow[]>(
      env,
      `user_stamp?select=stamp_id&user_id=eq.${encodeFilterValue(userId)}&position_id=eq.${encodeFilterValue(
        positionId,
      )}`,
    )) ?? []
  );
}

export async function readLastStampRow(env: WorkerEnv, userId: string): Promise<WorkerLastStampRow | null> {
  const rows = await supabaseRequest<WorkerLastStampRow[]>(
    env,
    `user_stamp?select=stamp_id,travel_session_id,created_at&user_id=eq.${encodeFilterValue(
      userId,
    )}&order=created_at.desc&limit=1`,
  );

  return rows?.[0] ?? null;
}

export async function readTravelSessionRow(
  env: WorkerEnv,
  travelSessionId: number,
): Promise<WorkerTravelSessionRow | null> {
  const rows = await supabaseRequest<WorkerTravelSessionRow[]>(
    env,
    `travel_session?select=stamp_count&travel_session_id=eq.${encodeFilterValue(String(travelSessionId))}&limit=1`,
  );

  return rows?.[0] ?? null;
}

export async function createTravelSession(
  env: WorkerEnv,
  payload: WorkerJsonRecord,
): Promise<WorkerTravelSessionRow | null> {
  const rows = await supabaseRequest<WorkerTravelSessionRow[]>(env, 'travel_session?select=travel_session_id', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return rows?.[0] ?? null;
}

export async function updateTravelSession(
  env: WorkerEnv,
  travelSessionId: number,
  payload: WorkerJsonRecord,
): Promise<void> {
  await supabaseRequest(
    env,
    `travel_session?travel_session_id=eq.${encodeFilterValue(String(travelSessionId))}`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
  );
}

export async function updateStampTravelSession(
  env: WorkerEnv,
  stampId: string | number,
  travelSessionId: number,
): Promise<void> {
  await supabaseRequest(env, `user_stamp?stamp_id=eq.${encodeFilterValue(String(stampId))}`, {
    method: 'PATCH',
    body: JSON.stringify({ travel_session_id: travelSessionId }),
  });
}

export async function createUserStamp(env: WorkerEnv, payload: WorkerJsonRecord): Promise<WorkerStampRow | null> {
  const rows = await supabaseRequest<WorkerStampRow[]>(env, 'user_stamp?select=stamp_id', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return rows?.[0] ?? null;
}
