import { describe, expect, it } from 'vitest';
import {
  buildRouteUrl,
  buildHistoryState,
  getInitialNotice,
  getInitialRouteState,
  getRoutePreviewFromHistoryState,
  type RouteState,
} from '../../src/hooks/app-route/useAppRouteState';
import type { RoutePreview } from '../../src/types';

const routeState: RouteState = {
  tab: 'map',
  placeId: null,
  festivalId: null,
  drawerState: 'closed',
};

const routePreview: RoutePreview = {
  id: 'route-1',
  title: '도심 산책 코스',
  subtitle: 'tester / 04. 05. 12:00',
  mood: '데이트',
  placeIds: ['place-1', 'place-2'],
  placeNames: ['첫 번째 장소', '두 번째 장소'],
};

describe('useAppRouteState helpers', () => {
  it('builds a history payload that keeps the route preview metadata', () => {
    expect(buildHistoryState(routeState, routePreview)).toEqual({
      ...routeState,
      routePreview,
    });
  });

  it('restores only valid route preview data from browser history state', () => {
    expect(getRoutePreviewFromHistoryState({ routePreview })).toEqual(routePreview);
    expect(getRoutePreviewFromHistoryState({ routePreview: { id: 'broken' } })).toBeNull();
    expect(getRoutePreviewFromHistoryState(null)).toBeNull();
  });

  it('normalizes legacy partial drawer query to peek', () => {
    const originalWindow = globalThis.window;
    Object.defineProperty(globalThis, 'window', {
      value: {
        location: {
          search: '?tab=map&place=place-1&drawer=partial',
          pathname: '/',
          origin: 'https://daejeon.jamissue.com',
        },
      },
      configurable: true,
    });

    expect(getInitialRouteState()).toEqual({
      tab: 'map',
      placeId: 'place-1',
      festivalId: null,
      drawerState: 'peek',
    });

    Object.defineProperty(globalThis, 'window', {
      value: originalWindow,
      configurable: true,
    });
  });

  it('emits canonical peek drawer query for selected map items', () => {
    const originalWindow = globalThis.window;
    Object.defineProperty(globalThis, 'window', {
      value: {
        location: {
          search: '',
          pathname: '/',
          origin: 'https://daejeon.jamissue.com',
        },
      },
      configurable: true,
    });

    expect(buildRouteUrl({
      tab: 'map',
      placeId: 'place-1',
      festivalId: null,
      drawerState: 'peek',
    })).toBe('/?tab=map&place=place-1&drawer=peek');

    Object.defineProperty(globalThis, 'window', {
      value: originalWindow,
      configurable: true,
    });
  });

  it('reads kakao auth query notices from the browser url', () => {
    const originalWindow = globalThis.window;
    Object.defineProperty(globalThis, 'window', {
      value: {
        location: {
          search: '?auth=kakao-success',
          pathname: '/',
          origin: 'https://daejeon.jamissue.com',
        },
        history: {
          replaceState() {},
          state: {},
        },
      },
      configurable: true,
    });

    expect(getInitialNotice()).toBe('카카오 로그인을 완료했어요.');

    Object.defineProperty(globalThis, 'window', {
      value: originalWindow,
      configurable: true,
    });
  });
});
