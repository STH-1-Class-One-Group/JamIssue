import { useRef, useState } from 'react';
import type { CommunityRouteSort } from '../../types/core';
import type { UserRoute } from '../../types/review';

export function useCommunityRouteState() {
  const [communityRoutes, setCommunityRoutes] = useState<UserRoute[]>([]);
  const [communityRouteSort, setCommunityRouteSort] = useState<CommunityRouteSort>('popular');
  const communityRoutesCacheRef = useRef<Partial<Record<CommunityRouteSort, UserRoute[]>>>({});

  function replaceCommunityRoutes(nextRoutes: UserRoute[], sort: CommunityRouteSort = communityRouteSort) {
    communityRoutesCacheRef.current[sort] = nextRoutes;
    setCommunityRoutes(nextRoutes);
  }

  function patchCommunityRoutes(routeId: string, updater: (route: UserRoute) => UserRoute) {
    const nextCache: Partial<Record<CommunityRouteSort, UserRoute[]>> = {};
    for (const sortKey of Object.keys(communityRoutesCacheRef.current) as CommunityRouteSort[]) {
      const routes = communityRoutesCacheRef.current[sortKey];
      if (!routes) {
        continue;
      }
      const idx = routes.findIndex((route) => route.id === routeId);
      if (idx !== -1) {
        const nextRoutes = [...routes];
        nextRoutes[idx] = updater(nextRoutes[idx]);
        nextCache[sortKey] = nextRoutes;
      } else {
        nextCache[sortKey] = routes;
      }
    }
    communityRoutesCacheRef.current = nextCache;
    setCommunityRoutes((current) => {
      const idx = current.findIndex((route) => route.id === routeId);
      if (idx === -1) return current;
      const next = [...current];
      next[idx] = updater(next[idx]);
      return next;
    });
  }

  return {
    communityRoutes,
    setCommunityRoutes,
    communityRouteSort,
    setCommunityRouteSort,
    communityRoutesCacheRef,
    replaceCommunityRoutes,
    patchCommunityRoutes,
  };
}
