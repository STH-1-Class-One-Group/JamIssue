import type { Place, Course } from '../types/core';
import type { StampState } from '../types/review';
import type { AuthSessionResponse } from './authClient';
import type { BootstrapResponse, FestivalItem } from '../types';
import type { PublicEventBannerResponse } from '../publicEventTypes';
import { ApiError, fetchJson } from './core';

export function getBootstrap() {
  return fetchJson<BootstrapResponse>('/api/bootstrap');
}

export async function getMapBootstrap() {
  try {
    return await fetchJson<MapBootstrapResponse>('/api/map-bootstrap');
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 501 || error.status >= 500)) {
      const bootstrap = await getBootstrap();
      return {
        auth: bootstrap.auth,
        places: bootstrap.places,
        stamps: bootstrap.stamps,
        hasRealData: bootstrap.hasRealData,
      };
    }
    throw error;
  }
}

export async function getCuratedCourses() {
  try {
    return await fetchJson<CourseBootstrapResponse>('/api/courses/curated');
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 501 || error.status >= 500)) {
      const bootstrap = await getBootstrap();
      return { courses: bootstrap.courses };
    }
    throw error;
  }
}

export function getPublicEventBanner() {
  return fetchJson<PublicEventBannerResponse>('/api/banner/events');
}

export function getFestivals() {
  return fetchJson<FestivalItem[]>('/api/festivals');
}



export interface MapBootstrapResponse {
  auth: AuthSessionResponse;
  places: Place[];
  stamps: StampState;
  hasRealData: boolean;
}



export interface CourseBootstrapResponse {
  courses: Course[];
}
