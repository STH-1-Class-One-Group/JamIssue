import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { WorkerEnv } from '../../deploy/api-worker-shell/types';

const indexMocks = vi.hoisted(() => ({
  createRouteRequest: vi.fn(),
  routeRequest: vi.fn(),
}));

vi.mock('../../deploy/api-worker-shell/runtime/routing', () => ({
  createRouteRequest: indexMocks.createRouteRequest,
}));

describe('worker index entrypoint', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    indexMocks.createRouteRequest.mockReturnValue(indexMocks.routeRequest);
  });

  it('delegates fetch requests to the composed route request', async () => {
    indexMocks.routeRequest.mockResolvedValue(new Response('ok'));
    const workerModule = await import('../../deploy/api-worker-shell/index');
    const request = new Request('https://api.test/api/health');
    const env = { APP_CORS_ORIGINS: 'https://daejeon.jamissue.com' } as WorkerEnv;

    const response = await workerModule.default.fetch(request, env);

    await expect(response.text()).resolves.toBe('ok');
    expect(indexMocks.createRouteRequest).toHaveBeenCalledTimes(1);
    expect(indexMocks.routeRequest).toHaveBeenCalledWith(request, env);
  });

  it('returns the stable worker error payload when routing throws', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    indexMocks.routeRequest.mockRejectedValue(new Error('route failed'));
    const workerModule = await import('../../deploy/api-worker-shell/index');
    const request = new Request('https://api.test/api/health');
    const env = { APP_CORS_ORIGINS: '*' } as WorkerEnv;

    const response = await workerModule.default.fetch(request, env);

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual(workerModule.buildWorkerErrorPayload());
    expect(consoleError).toHaveBeenCalledWith('Worker request failed', expect.any(Error));
  });
});
