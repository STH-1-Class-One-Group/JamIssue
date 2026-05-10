import { handlePreflight } from '../lib/http';
import type { WorkerEnv } from '../types';
import { proxyToOrigin } from './proxy';
import { createExactRoutes, createPatternRoutes } from './route-registry';
import type { RouteRuntime } from './route-runtime';

export function createRouteRequest(runtime: RouteRuntime) {
  return async function routeRequest(request: Request, env: WorkerEnv) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return handlePreflight(env, request);
    }

    for (const [method, pathname, handler] of createExactRoutes(request, env, url, runtime)) {
      if (request.method === method && url.pathname === pathname) {
        return handler();
      }
    }

    for (const [method, pattern, handler] of createPatternRoutes(request, env, runtime)) {
      const match = url.pathname.match(pattern);
      if (request.method === method && match) {
        return handler(match);
      }
    }

    return proxyToOrigin(request, env);
  };
}
