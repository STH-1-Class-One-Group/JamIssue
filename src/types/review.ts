import type { Course, Place, ReviewMood } from './core';

export interface Comment {
  id: string;
  userId: string;
  author: string;
  body: string;
  parentId: string | null;
  isDeleted: boolean;
  createdAt: string;
  replies: Comment[];
}

export interface Review {
  id: string;
  userId: string;
  placeId: string;
  placeName: string;
  author: string;
  body: string;
  mood: ReviewMood;
  badge: string;
  visitedAt: string;
  imageUrl: string | null;
  thumbnailUrl?: string | null;
  commentCount: number;
  likeCount: number;
  likedByMe: boolean;
  stampId: string | null;
  visitNumber: number;
  visitLabel: string;
  travelSessionId: string | null;
  hasPublishedRoute: boolean;
  comments: Comment[];
}

export interface StampLog {
  id: string;
  placeId: string;
  placeName: string;
  stampedAt: string;
  stampedDate: string;
  visitNumber: number;
  visitLabel: string;
  travelSessionId: string | null;
  travelSessionStampCount: number;
  isToday: boolean;
}

export interface TravelSession {
  id: string;
  startedAt: string;
  endedAt: string;
  durationLabel: string;
  stampCount: number;
  placeIds: string[];
  placeNames: string[];
  canPublish: boolean;
  publishedRouteId: string | null;
  coverPlaceId: string | null;
}

export interface UserRoute {
  id: string;
  authorId: string;
  author: string;
  title: string;
  description: string;
  mood: string;
  likeCount: number;
  likedByMe: boolean;
  createdAt: string;
  placeIds: string[];
  placeNames: string[];
  isUserGenerated: boolean;
  travelSessionId: string | null;
}

export interface StampState {
  collectedPlaceIds: string[];
  logs: StampLog[];
  travelSessions: TravelSession[];
}

export interface BootstrapResponse {
  auth: import('../api/authClient').AuthSessionResponse;
  places: Place[];
  reviews: Review[];
  courses: Course[];
  stamps: StampState;
  hasRealData: boolean;
}

