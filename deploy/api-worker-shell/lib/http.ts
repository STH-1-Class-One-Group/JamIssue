import type { WorkerEnv } from '../types';

export function applyCorsHeaders(headers: Headers, env: WorkerEnv, request: Request) {
  const origin = request.headers.get('Origin');
  const allowedOrigins = (env.APP_CORS_ORIGINS ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  const fallbackOrigin = env.APP_FRONTEND_URL ?? '*';
  const allowOrigin = origin && allowedOrigins.includes(origin) ? origin : fallbackOrigin;

  headers.set('Access-Control-Allow-Origin', allowOrigin);
  headers.set('Access-Control-Allow-Credentials', 'true');
  headers.set('Access-Control-Allow-Headers', 'content-type, authorization');
  headers.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  headers.set('Vary', 'Origin');
}

export function jsonResponse(
  status: number,
  payload: unknown,
  env: WorkerEnv,
  request: Request,
  extraHeaders: HeadersInit = {},
) {
  const headers = new Headers({
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    ...extraHeaders,
  });

  applyCorsHeaders(headers, env, request);
  return new Response(JSON.stringify(toJsonSafePayload(payload)), { status, headers });
}

function toJsonSafePayload(payload: unknown, seen = new WeakSet<object>()): unknown {
  if (payload instanceof Error) {
    return { message: 'Internal error' };
  }

  if (payload === null || typeof payload === 'string' || typeof payload === 'number' || typeof payload === 'boolean') {
    return payload;
  }

  if (typeof payload === 'bigint') {
    return payload.toString();
  }

  if (Array.isArray(payload)) {
    if (seen.has(payload)) {
      return '[Circular]';
    }
    seen.add(payload);
    return payload.map((value) => toJsonSafePayload(value, seen));
  }

  if (typeof payload === 'object') {
    if (seen.has(payload)) {
      return '[Circular]';
    }

    seen.add(payload);
    const safePayload: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(payload)) {
      if (/^stack(trace)?$/iu.test(key)) {
        continue;
      }
      safePayload[key] = toJsonSafePayload(value, seen);
    }
    return safePayload;
  }

  return null;
}

export function redirectResponse(location: string, env: WorkerEnv, request: Request, cookies: string[] = []) {
  const headers = new Headers({
    location,
    'cache-control': 'no-store',
  });

  applyCorsHeaders(headers, env, request);
  for (const cookie of cookies) {
    headers.append('set-cookie', cookie);
  }

  return new Response(null, { status: 302, headers });
}

export function handlePreflight(env: WorkerEnv, request: Request) {
  const headers = new Headers();
  applyCorsHeaders(headers, env, request);
  return new Response(null, { status: 204, headers });
}
