import { describe, expect, it, vi } from 'vitest';
import { formatDate, formatDateTime, toSeoulDateKey } from '../../deploy/api-worker-shell/lib/dates';
import { handlePreflight, jsonResponse, redirectResponse } from '../../deploy/api-worker-shell/lib/http';
import {
  buildInFilter,
  encodeFilterValue,
  getSupabaseKey,
  parseListLimit,
  rememberPending,
  supabaseRequest,
  uniqueValues,
  type SupabaseCacheState,
} from '../../deploy/api-worker-shell/lib/supabase';
import type { WorkerEnv } from '../../deploy/api-worker-shell/types';

function envFixture(overrides: Partial<WorkerEnv> = {}): WorkerEnv {
  return {
    APP_CORS_ORIGINS: 'https://daejeon.jamissue.com, https://admin.jamissue.com',
    APP_FRONTEND_URL: 'https://daejeon.jamissue.com',
    APP_SUPABASE_URL: 'https://supabase.test',
    APP_SUPABASE_ANON_KEY: 'anon-key',
    APP_SUPABASE_SERVICE_ROLE_KEY: '',
    ...overrides,
  } as WorkerEnv;
}

describe('worker supabase lib', () => {
  it('builds Supabase credentials, filters, limits, and pending-cache helpers', async () => {
    expect(getSupabaseKey(envFixture())).toBe('anon-key');
    expect(getSupabaseKey(envFixture({ APP_SUPABASE_SERVICE_ROLE_KEY: 'service-key' }))).toBe('service-key');
    expect(encodeFilterValue('a/b c')).toBe('a%2Fb%20c');
    expect(uniqueValues(['a', 'a', null, undefined, '', 'b'])).toEqual(['a', 'b']);
    expect(buildInFilter(['a/b', 'a/b', 'b c'])).toBe('in.(a%2Fb,b%20c)');
    expect(buildInFilter([])).toBeNull();
    expect(parseListLimit(new URL('https://api.test/items?limit=7'), 10, 50)).toBe(7);
    expect(parseListLimit(new URL('https://api.test/items?limit=bad'), 10, 50)).toBe(10);
    expect(parseListLimit(new URL('https://api.test/items?limit=999'), 10, 50)).toBe(50);

    const cacheState: SupabaseCacheState<string> = { pending: null, value: null };
    const loader = vi.fn(async () => 'loaded');
    const first = rememberPending(cacheState, loader);
    const second = rememberPending(cacheState, loader);

    await expect(first).resolves.toBe('loaded');
    await expect(second).resolves.toBe('loaded');
    expect(loader).toHaveBeenCalledTimes(1);
    expect(cacheState.pending).toBeNull();
  });

  it('sends Supabase REST requests with required auth headers and parses JSON, text, empty, and failure responses', async () => {
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      if (init?.method === 'PATCH') {
        return new Response(JSON.stringify([{ id: 1 }]), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      }
      if (init?.method === 'HEAD') {
        return new Response('', { status: 200 });
      }
      if (String(_url).includes('text-table')) {
        return new Response('plain-text', { status: 200, headers: { 'content-type': 'text/plain' } });
      }
      if (String(_url).includes('fail-table')) {
        return new Response('failed detail', { status: 503 });
      }
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    });
    vi.stubGlobal('fetch', fetchMock);
    const env = envFixture({ APP_SUPABASE_SERVICE_ROLE_KEY: 'service-key' });

    await expect(supabaseRequest(env, 'table?select=*')).resolves.toEqual({ ok: true });
    await expect(supabaseRequest(env, 'text-table?select=*')).resolves.toBe('plain-text');
    await expect(supabaseRequest(env, 'empty-table?select=*', { method: 'HEAD' })).resolves.toBeNull();
    await expect(supabaseRequest(env, 'table?id=eq.1', { method: 'PATCH', body: JSON.stringify({ ok: true }) })).resolves.toEqual([{ id: 1 }]);
    await expect(supabaseRequest(env, 'fail-table?select=*')).rejects.toThrow('Supabase request failed (503): failed detail');

    expect(fetchMock).toHaveBeenCalledWith('https://supabase.test/rest/v1/table?select=*', expect.objectContaining({
      method: 'GET',
      headers: expect.any(Headers),
    }));
    const patchHeaders = fetchMock.mock.calls[3][1]?.headers as Headers;
    expect(patchHeaders.get('apikey')).toBe('service-key');
    expect(patchHeaders.get('Authorization')).toBe('Bearer service-key');
    expect(patchHeaders.get('Content-Type')).toBe('application/json');
    expect(patchHeaders.get('Prefer')).toBe('return=representation');
  });

  it('rejects Supabase requests when required runtime configuration is missing', async () => {
    await expect(supabaseRequest(envFixture({ APP_SUPABASE_URL: '' }), 'table')).rejects.toThrow('APP_SUPABASE_URL is empty.');
    await expect(supabaseRequest(envFixture({ APP_SUPABASE_ANON_KEY: '', APP_SUPABASE_SERVICE_ROLE_KEY: '' }), 'table')).rejects.toThrow(
      'Supabase API key is missing.',
    );
  });
});

describe('worker HTTP and date libs', () => {
  it('applies CORS to JSON, redirect, and preflight responses while sanitizing unsafe payload values', async () => {
    const request = new Request('https://api.test/api/ping', {
      headers: { Origin: 'https://admin.jamissue.com' },
    });
    const env = envFixture();
    const circular: { self?: unknown; stack?: string; bigint: bigint; error: Error } = {
      bigint: 12n,
      stack: 'hidden stack',
      error: new Error('hidden error'),
    };
    circular.self = circular;

    const response = jsonResponse(200, circular, env, request, { 'x-extra': 'yes' });
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://admin.jamissue.com');
    expect(response.headers.get('x-extra')).toBe('yes');
    await expect(response.json()).resolves.toEqual({
      bigint: '12',
      error: { message: 'Internal error' },
      self: '[Circular]',
    });

    const fallbackResponse = jsonResponse(200, { ok: true }, env, new Request('https://api.test/api/ping'));
    expect(fallbackResponse.headers.get('Access-Control-Allow-Origin')).toBe('https://daejeon.jamissue.com');

    const redirect = redirectResponse('https://daejeon.jamissue.com', env, request, ['a=b', 'c=d']);
    expect(redirect.status).toBe(302);
    expect(redirect.headers.get('location')).toBe('https://daejeon.jamissue.com');
    expect(redirect.headers.getSetCookie()).toEqual(['a=b', 'c=d']);

    const preflight = handlePreflight(env, request);
    expect(preflight.status).toBe(204);
    expect(preflight.headers.get('Access-Control-Allow-Methods')).toContain('PATCH');
  });

  it('formats valid Korean dates and preserves empty or invalid inputs', () => {
    expect(formatDateTime(null)).toBe('');
    expect(formatDateTime('not-a-date')).toBe('not-a-date');
    expect(formatDate('not-a-date')).toBe('not-a-date');
    expect(formatDateTime('2026-05-14T00:00:00Z')).not.toBe('');
    expect(formatDate('2026-05-14T00:00:00Z')).not.toBe('');
    expect(toSeoulDateKey('2026-05-14T00:00:00Z')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
