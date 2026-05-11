import type { CommunityRouteSort, UserRoute } from '../types';
import { fetchJson, invalidateApiCache } from './core';

export function getCommunityRoutes(sort: CommunityRouteSort = 'popular') {
  return fetchJson<UserRoute[]>(`/api/community-routes?sort=${sort}`);
}

export async function createUserRoute(payload: UserRouteCreateRequest) {
  const response = await fetchJson<UserRoute>('/api/community-routes', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  invalidateApiCache(['/api/community-routes', '/api/my/routes', '/api/my/summary']);
  return response;
}

export async function toggleCommunityRouteLike(routeId: string) {
  const response = await fetchJson<UserRouteLikeResponse>(`/api/community-routes/${routeId}/like`, {
    method: 'POST',
  });
  invalidateApiCache(['/api/community-routes', '/api/my/routes']);
  return response;
}



export interface UserRouteLikeResponse {
  routeId: string;
  likeCount: number;
  likedByMe: boolean;
}



export interface UserRouteCreateRequest {
  title: string;
  description: string;
  mood: string;
  travelSessionId: string;
  isPublic?: boolean;
}
