import { describe, expect, it, vi } from 'vitest';

import {
  buildRequestHeaders,
  parseRuntimeConfig,
  resolveApiBaseUrl,
} from '../../scripts/run-smoke-checks';
import {
  getProtectedAuthHeaders,
  getProtectedSmokeSkipReason,
  isProtectedSmokeEnabled,
  PROTECTED_SMOKE_ENDPOINTS,
} from '../../scripts/smoke/protected';
import {
  createProtectedSmokeChecks,
  runProtectedSmokeSuite,
} from '../../scripts/run-protected-smoke-checks';
import {
  getProtectedWriteSmokeConfig,
  getProtectedWriteSmokeSkipReason,
  isProtectedWriteSmokeEnabled,
} from '../../scripts/smoke/protected-write';
import {
  createProtectedWriteSmokeChecks,
  runProtectedWriteSmokeSuite,
} from '../../scripts/run-protected-write-smoke-checks';

describe('run-smoke-checks helpers', () => {
  it('parses runtime app config from the bootstrap script', () => {
    const config = parseRuntimeConfig(`window.__JAMISSUE_CONFIG__ = {
  "apiBaseUrl": "https://api.runtime.example",
  "naverMapClientId": "abc"
};`);

    expect(config).toEqual({
      apiBaseUrl: 'https://api.runtime.example',
      naverMapClientId: 'abc',
    });
  });

  it('prefers runtime apiBaseUrl over the workflow override', () => {
    expect(
      resolveApiBaseUrl({
        runtimeConfig: { apiBaseUrl: 'https://api.runtime.example/' },
        configuredApiBaseUrl: 'https://api.workflow.example/',
      }),
    ).toBe('https://api.runtime.example');
  });

  it('falls back to the configured apiBaseUrl when runtime config is absent', () => {
    expect(
      resolveApiBaseUrl({
        runtimeConfig: null,
        configuredApiBaseUrl: 'https://api.workflow.example/',
      }),
    ).toBe('https://api.workflow.example');
  });

  it('can force the configured apiBaseUrl over runtime config for smoke-only origins', () => {
    process.env.SMOKE_FORCE_API_BASE_URL = '1';

    expect(
      resolveApiBaseUrl({
        runtimeConfig: { apiBaseUrl: 'https://api.runtime.example/' },
        configuredApiBaseUrl: 'https://api.workflow.example/',
      }),
    ).toBe('https://api.workflow.example');

    delete process.env.SMOKE_FORCE_API_BASE_URL;
  });

  it('builds browser-like headers for smoke requests', () => {
    const headers = buildRequestHeaders('application/json,text/plain,*/*');

    expect(headers.accept).toBe('application/json,text/plain,*/*');
    expect(headers['accept-language']).toContain('en-US');
    expect(headers['cache-control']).toBe('no-cache');
    expect(headers['user-agent']).toContain('Mozilla/5.0');
  });

  it('builds protected auth headers from the smoke token', () => {
    process.env.SMOKE_AUTH_BEARER_TOKEN = 'token-123';

    expect(getProtectedAuthHeaders()).toEqual({
      Authorization: 'Bearer token-123',
    });

    delete process.env.SMOKE_AUTH_BEARER_TOKEN;
  });

  it('throws when the protected smoke token is missing', () => {
    delete process.env.SMOKE_AUTH_BEARER_TOKEN;

    expect(() => getProtectedAuthHeaders()).toThrow('SMOKE_AUTH_BEARER_TOKEN is required for protected smoke checks');
  });

  it('defines the protected smoke endpoint contract', () => {
    process.env.SMOKE_AUTH_BEARER_TOKEN = 'token-123';

    expect(createProtectedSmokeChecks({ apiBaseUrl: 'https://api.example.com' }).map((check) => check.name)).toEqual([
      'api-auth-me-authenticated',
      'api-my-summary-authenticated',
      'api-my-notifications-authenticated',
    ]);

    delete process.env.SMOKE_AUTH_BEARER_TOKEN;
  });

  it('keeps protected endpoint definitions in the shared contract module', () => {
    expect(PROTECTED_SMOKE_ENDPOINTS.map((endpoint) => endpoint.path)).toEqual([
      '/api/auth/me',
      '/api/my/summary',
      '/api/my/notifications',
    ]);
  });

  it('reports whether protected smoke is enabled from the token env', () => {
    expect(isProtectedSmokeEnabled({ SMOKE_AUTH_BEARER_TOKEN: 'token-123' })).toBe(true);
    expect(isProtectedSmokeEnabled({ SMOKE_AUTH_BEARER_TOKEN: '' })).toBe(false);
  });

  it('describes why protected smoke is skipped when the token is missing', () => {
    expect(getProtectedSmokeSkipReason({ SMOKE_AUTH_BEARER_TOKEN: '' })).toBe('SMOKE_AUTH_BEARER_TOKEN is not configured');
    expect(getProtectedSmokeSkipReason({ SMOKE_AUTH_BEARER_TOKEN: 'token-123' })).toBeNull();
  });

  it('skips protected smoke without trying to load runtime config when the token is missing', async () => {
    const loadRuntimeConfigImpl = vi.fn();
    const runSmokeSuiteImpl = vi.fn();

    const result = await runProtectedSmokeSuite({
      env: { SMOKE_AUTH_BEARER_TOKEN: '' },
      loadRuntimeConfigImpl,
      runSmokeSuiteImpl,
    });

    expect(result).toMatchObject({
      suite: 'protected',
      skipped: true,
      reason: 'SMOKE_AUTH_BEARER_TOKEN is not configured',
      endpoints: PROTECTED_SMOKE_ENDPOINTS.map((endpoint) => endpoint.name),
    });
    expect(loadRuntimeConfigImpl).not.toHaveBeenCalled();
    expect(runSmokeSuiteImpl).not.toHaveBeenCalled();
  });

  it('keeps protected write smoke disabled unless explicitly opted in', async () => {
    const loadRuntimeConfigImpl = vi.fn();
    const runSmokeSuiteImpl = vi.fn();

    const result = await runProtectedWriteSmokeSuite({
      env: {},
      loadRuntimeConfigImpl,
      runSmokeSuiteImpl,
    });

    expect(result).toMatchObject({
      suite: 'protected-write',
      skipped: true,
      reason: 'SMOKE_WRITE_ENABLED is not true',
      endpoints: ['api-review-write-roundtrip'],
    });
    expect(loadRuntimeConfigImpl).not.toHaveBeenCalled();
    expect(runSmokeSuiteImpl).not.toHaveBeenCalled();
  });

  it('requires explicit protected write smoke identifiers after opt-in', () => {
    expect(isProtectedWriteSmokeEnabled({ SMOKE_WRITE_ENABLED: 'true' })).toBe(true);
    expect(getProtectedWriteSmokeSkipReason({
      SMOKE_WRITE_ENABLED: 'true',
      SMOKE_AUTH_BEARER_TOKEN: 'token-123',
    })).toBe('SMOKE_WRITE_PLACE_ID and SMOKE_WRITE_STAMP_ID are required for protected write smoke checks');
    expect(getProtectedWriteSmokeSkipReason({
      SMOKE_WRITE_ENABLED: 'true',
      SMOKE_AUTH_BEARER_TOKEN: 'token-123',
      SMOKE_WRITE_PLACE_ID: 'bread-house',
      SMOKE_WRITE_STAMP_ID: '11',
    })).toBeNull();
  });

  it('builds protected write smoke config from explicit env only', () => {
    expect(getProtectedWriteSmokeConfig({
      SMOKE_WRITE_PLACE_ID: 'bread-house',
      SMOKE_WRITE_STAMP_ID: '11',
      SMOKE_WRITE_REVIEW_BODY: 'review body',
      SMOKE_WRITE_COMMENT_BODY: 'comment body',
    })).toEqual({
      placeId: 'bread-house',
      stampId: '11',
      reviewBody: 'review body',
      commentBody: 'comment body',
    });
  });

  it('runs protected write smoke as create, comment, and cleanup when explicitly configured', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 'review-1' }), { status: 201 }))
      .mockResolvedValueOnce(new Response(JSON.stringify([{ id: 'comment-1' }]), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ deleted: true }), { status: 200 }));

    try {
      const [check] = createProtectedWriteSmokeChecks({
        apiBaseUrl: 'https://api.example.com',
        env: {
          SMOKE_AUTH_BEARER_TOKEN: 'token-123',
          SMOKE_WRITE_PLACE_ID: 'place-1',
          SMOKE_WRITE_STAMP_ID: 'stamp-1',
          SMOKE_WRITE_REVIEW_BODY: 'review body',
          SMOKE_WRITE_COMMENT_BODY: 'comment body',
        },
      });

      const result = await check.run();

      expect(result.ok).toBe(true);
      expect(fetchSpy).toHaveBeenNthCalledWith(
        1,
        'https://api.example.com/api/reviews',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"stampId":"stamp-1"'),
        }),
      );
      expect(fetchSpy).toHaveBeenNthCalledWith(
        2,
        'https://api.example.com/api/reviews/review-1/comments',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ body: 'comment body' }),
        }),
      );
      expect(fetchSpy).toHaveBeenNthCalledWith(
        3,
        'https://api.example.com/api/reviews/review-1',
        expect.objectContaining({ method: 'DELETE' }),
      );
    } finally {
      fetchSpy.mockRestore();
    }
  });
});
