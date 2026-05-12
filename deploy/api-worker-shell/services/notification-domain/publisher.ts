import { getSupabaseKey } from '../../lib/supabase';
import type { WorkerEnv, WorkerJsonRecord } from '../../types';
import { getSigningSecret, sha256Base64Url } from '../auth';

export async function buildNotificationRealtimeTopic(env: WorkerEnv, userId: string) {
  const secret = getSigningSecret(env);
  if (!secret) {
    throw new Error('Notification realtime secret is missing.');
  }
  const signature = await sha256Base64Url(`${userId}:${secret}:notifications`);
  return `user-notifications:${userId}:${signature}`;
}

export async function sendRealtimeBroadcast(
  env: WorkerEnv,
  topic: string,
  event: string,
  payload: WorkerJsonRecord,
) {
  if (!env.APP_SUPABASE_URL) {
    return;
  }
  const apiKey = getSupabaseKey(env);
  if (!apiKey) {
    return;
  }

  await fetch(`${env.APP_SUPABASE_URL}/realtime/v1/api/broadcast`, {
    method: 'POST',
    headers: {
      apikey: apiKey,
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages: [
        {
          topic,
          event,
          payload,
          private: false,
        },
      ],
    }),
  });
}
