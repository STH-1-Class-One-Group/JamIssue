export type AuthProviderKey = 'naver' | 'kakao';

export type WorkerJsonRecord = Record<string, unknown>;

export interface WorkerEnv {
  APP_ADMIN_USER_IDS?: string;
  APP_CORS_ORIGINS?: string;
  APP_ENV?: string;
  APP_EVENT_IMPORT_TOKEN?: string;
  APP_FRONTEND_URL?: string;
  APP_JWT_SECRET?: string;
  APP_KAKAO_LOGIN_CALLBACK_URL?: string;
  APP_KAKAO_LOGIN_CLIENT_ID?: string;
  APP_KAKAO_LOGIN_CLIENT_SECRET?: string;
  APP_NAVER_LOGIN_CALLBACK_URL?: string;
  APP_NAVER_LOGIN_CLIENT_ID?: string;
  APP_NAVER_LOGIN_CLIENT_SECRET?: string;
  APP_ORIGIN_API_URL?: string;
  APP_PUBLIC_EVENT_CITY_KEYWORD?: string;
  APP_SESSION_HTTPS?: string;
  APP_SESSION_SECRET?: string;
  APP_STORAGE_BACKEND?: string;
  APP_SUPABASE_ANON_KEY?: string;
  APP_SUPABASE_SERVICE_ROLE_KEY?: string;
  APP_SUPABASE_STORAGE_BUCKET?: string;
  APP_SUPABASE_URL?: string;
  [key: string]: unknown;
}

export interface WorkerSessionUser {
  id: string;
  nickname: string;
  email: string | null;
  provider: string;
  profileImage: string | null;
  isAdmin: boolean;
  profileCompletedAt: string | null;
}

export interface SupabaseRequestOptions extends RequestInit {
  headers?: HeadersInit;
  body?: BodyInit | null;
}

export interface SupabaseIdentityRow {
  identity_id: string | number;
  user_id: string;
  email?: string | null;
  profile_image?: string | null;
}

export interface SupabaseUserRow {
  user_id: string;
  nickname?: string | null;
  email?: string | null;
  provider?: string | null;
  profile_completed_at?: string | null;
}

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

export interface WorkerReviewComment extends WorkerJsonRecord {
  id: string;
  replies?: WorkerReviewComment[];
}

export interface WorkerReview extends WorkerJsonRecord {
  id: string;
  comments?: WorkerReviewComment[];
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

export interface SupabaseCacheState<T> {
  pending: Promise<T> | null;
  value: T | null;
}
