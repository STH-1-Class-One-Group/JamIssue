import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import { getCommunityRoutes } from '../../api/routesClient';
import type { CommunityRouteSort, UserRoute } from '../../types';

type CommunityRoutesCache = Partial<Record<CommunityRouteSort, UserRoute[]>>;

interface CreateCommunityRouteLoaderParams {
  communityRoutesCacheRef: MutableRefObject<CommunityRoutesCache>;
  replaceCommunityRoutes: (nextRoutes: UserRoute[], sort?: CommunityRouteSort) => void;
  setCommunityRoutes: Dispatch<SetStateAction<UserRoute[]>>;
}

export function createCommunityRouteLoader({
  communityRoutesCacheRef,
  replaceCommunityRoutes,
  setCommunityRoutes,
}: CreateCommunityRouteLoaderParams) {
  return async function fetchCommunityRoutes(sort: CommunityRouteSort, force = false) {
    const cached = communityRoutesCacheRef.current[sort];
    if (!force && cached) {
      setCommunityRoutes(cached);
      return cached;
    }

    const nextRoutes = await getCommunityRoutes(sort);
    replaceCommunityRoutes(nextRoutes, sort);
    return nextRoutes;
  };
}
