/*
 * File: base-data-contracts.ts
 * Purpose: Define base-data repository rows and Worker read-model contracts.
 * Primary Responsibility: Keep map/course/stamp/travel-session data shapes near the base-data runtime.
 * Design Intent: Base-data mapping owns these contracts, while the global Worker type barrel keeps only primitives.
 * Non-Goals: This file does not fetch Supabase data, map rows, or alter response shapes.
 * Dependencies: Shared JSON records and review read-model contracts.
 */
import type { WorkerJsonRecord } from '../types';
import type { WorkerReview } from '../services/review-domain';

export interface SupabaseMapRow extends WorkerJsonRecord {
  position_id: string | number;
  slug: string;
  name: string;
  district?: string | null;
  category: string;
  latitude: number;
  longitude: number;
  summary?: string | null;
  description?: string | null;
  image_url?: string | null;
  image_storage_path?: string | null;
  vibe_tags?: unknown;
  visit_time?: string | null;
  route_hint?: string | null;
  stamp_reward?: string | null;
  hero_label?: string | null;
  jam_color?: string | null;
  accent_color?: string | null;
  is_active?: boolean | null;
  total_visit_count?: number | null;
}

export interface SupabaseCourseRow extends WorkerJsonRecord {
  course_id: string | number;
  title: string;
  mood: string;
  duration: string;
  note: string;
  color: string;
  display_order?: number | null;
}

export interface SupabaseCoursePlaceRow extends WorkerJsonRecord {
  course_id: string | number;
  position_id: string | number;
  stop_order: number;
}

export interface WorkerFeedRow extends WorkerJsonRecord {
  feed_id: string | number;
  position_id: string | number;
  user_id: string;
  stamp_id?: string | number | null;
  created_at: string;
}

export interface WorkerFeedLikeRow extends WorkerJsonRecord {
  feed_id: string | number;
  user_id?: string | null;
}

export interface WorkerPositionStampRow extends WorkerJsonRecord {
  position_id: string | number;
}

export interface WorkerStampRow extends WorkerPositionStampRow {
  stamp_id: string | number;
  travel_session_id?: string | number | null;
  stamp_date?: string | null;
  visit_ordinal?: string | number | null;
  created_at: string;
}

export interface WorkerTravelSessionRow extends WorkerJsonRecord {
  travel_session_id: string | number;
  started_at: string;
  ended_at: string;
  stamp_count?: string | number | null;
}

export interface WorkerUserRouteRow extends WorkerJsonRecord {
  route_id: string | number;
  travel_session_id?: string | number | null;
}

export interface WorkerUserSummaryRow extends WorkerJsonRecord {
  user_id: string;
  nickname?: string | null;
}

export interface WorkerPlace extends WorkerJsonRecord {
  id: string;
  positionId: string;
  name: string;
  district?: string | null;
  category: string;
  jamColor: string;
  accentColor: string;
  imageUrl: string | null;
  latitude: number;
  longitude: number;
  summary?: string | null;
  description?: string | null;
  vibeTags: unknown[];
  visitTime?: string | null;
  routeHint?: string | null;
  stampReward?: string | null;
  heroLabel?: string | null;
  totalVisitCount: number;
}

export interface WorkerCourse extends WorkerJsonRecord {
  id: string;
  title: string;
  mood: string;
  duration: string;
  note: string;
  color: string;
  placeIds: string[];
}

export interface WorkerTravelSession extends WorkerJsonRecord {
  id: string;
  placeIds: string[];
}

export interface WorkerStampLog extends WorkerJsonRecord {
  id: string;
  placeId: string;
}

export interface WorkerStaticBaseRows {
  placeRows: SupabaseMapRow[];
  courseRows: SupabaseCourseRow[];
  coursePlaceRows: SupabaseCoursePlaceRow[];
}

export interface WorkerBaseData {
  places: WorkerPlace[];
  placesByPositionId: Map<string, WorkerPlace>;
  reviews: WorkerReview[];
  courses: WorkerCourse[];
  collectedPlaceIds: string[];
  stampLogs: WorkerStampLog[];
  travelSessions: WorkerTravelSession[];
}
