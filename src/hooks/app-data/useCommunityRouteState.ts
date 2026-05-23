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
      // Optimization: Use findIndex instead of map to avoid O(N) memory allocation and maintain referential stability
      const idx = routes.findIndex((route) => route.id === routeId);
      if (idx === -1) {
        nextCache[sortKey] = routes;
      } else {
        const nextRoutes = [...routes];
        nextRoutes[idx] = updater(routes[idx]);
        nextCache[sortKey] = nextRoutes;
      }
    }
    communityRoutesCacheRef.current = nextCache;
    setCommunityRoutes((current) => {
      // Optimization: Use findIndex instead of map to avoid O(N) memory allocation and maintain referential stability
      const idx = current.findIndex((route) => route.id === routeId);
      if (idx === -1) return current;
      const nextRoutes = [...current];
      nextRoutes[idx] = updater(current[idx]);
      return nextRoutes;
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
