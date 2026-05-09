import { encodeFilterValue, getSupabaseKey, supabaseRequest } from '../../lib/supabase';
import type { WorkerEnv, WorkerJsonRecord } from '../../types';

export async function supabaseCount(env: WorkerEnv, table: string) {
  if (!env.APP_SUPABASE_URL) {
    throw new Error('APP_SUPABASE_URL is empty.');
  }
  const apiKey = getSupabaseKey(env);
  if (!apiKey) {
    throw new Error('Supabase API key is missing.');
  }
  const response = await fetch(`${env.APP_SUPABASE_URL}/rest/v1/${table}?select=*`, {
    method: 'HEAD',
    headers: { apikey: apiKey, Authorization: `Bearer ${apiKey}`, Prefer: 'count=exact' },
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Supabase count failed (${response.status}): ${detail}`);
  }
  const contentRange = response.headers.get('content-range') ?? '0-0/0';
  const total = Number(contentRange.split('/')[1] ?? '0');
  return Number.isFinite(total) ? total : 0;
}

export async function loadAdminSummaryRows(env: WorkerEnv) {
  const [userCount, placeCount, reviewCount, commentCount, stampCount, placeRows, feedRows] = await Promise.all([
    supabaseCount(env, 'user'),
    supabaseCount(env, 'map'),
    supabaseCount(env, 'feed'),
    supabaseCount(env, 'user_comment'),
    supabaseCount(env, 'user_stamp'),
    supabaseRequest<WorkerJsonRecord[]>(
      env,
      'map?select=position_id,slug,name,district,category,is_active,is_manual_override,updated_at&order=is_active.desc,name.asc',
    ),
    supabaseRequest<WorkerJsonRecord[]>(env, 'feed?select=position_id'),
  ]);

  return { userCount, placeCount, reviewCount, commentCount, stampCount, placeRows, feedRows };
}

export async function updateAdminPlaceVisibility(env: WorkerEnv, placeId: string, body: WorkerJsonRecord) {
  const rows = await supabaseRequest<WorkerJsonRecord[]>(env, `map?slug=eq.${encodeFilterValue(placeId)}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
  return Array.isArray(rows) ? rows[0] ?? null : null;
}

export async function loadPlaceReviewRows(env: WorkerEnv, positionId: string | number) {
  return supabaseRequest<WorkerJsonRecord[]>(env, `feed?select=feed_id&position_id=eq.${encodeFilterValue(positionId)}`);
}

export async function loadPublicDataSource(env: WorkerEnv, sourceKey: string) {
  const rows = await supabaseRequest<WorkerJsonRecord[]>(
    env,
    `public_data_source?select=name,last_imported_at&source_key=eq.${encodeFilterValue(sourceKey)}&limit=1`,
  );
  return rows?.[0] ?? null;
}
