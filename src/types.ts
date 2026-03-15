export type Category = 'all' | 'landmark' | 'food' | 'cafe' | 'night';
export type Tab = 'explore' | 'course' | 'stamp' | 'my';
export type ReviewMood = '설렘' | '친구랑' | '혼자서' | '야경픽';
export type CourseMood = '전체' | '데이트' | '사진' | '힐링' | '비 오는 날';
export type ApiStatus = 'idle' | 'loading' | 'ready' | 'error';
export type ProviderKey = 'naver' | 'google' | 'kakao' | 'apple';

export interface SessionUser {
  id: string;
  nickname: string;
  email: string | null;
  provider: string;
  profileImage: string | null;
  isAdmin: boolean;
}

export interface AuthProvider {
  key: ProviderKey;
  label: string;
  isEnabled: boolean;
  loginUrl: string | null;
}

export interface AuthSessionResponse {
  isAuthenticated: boolean;
  user: SessionUser | null;
  providers: AuthProvider[];
}

export interface Place {
  id: string;
  name: string;
  district: string;
  category: Exclude<Category, 'all'>;
  jamColor: string;
  accentColor: string;
  latitude: number;
  longitude: number;
  summary: string;
  description: string;
  vibeTags: string[];
  visitTime: string;
  routeHint: string;
  stampReward: string;
  heroLabel: string;
}

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
  commentCount: number;
  comments: Comment[];
}

export interface Course {
  id: string;
  title: string;
  mood: Exclude<CourseMood, '전체'>;
  duration: string;
  note: string;
  color: string;
  placeIds: string[];
}

export interface StampState {
  collectedPlaceIds: string[];
}

export interface BootstrapResponse {
  places: Place[];
  reviews: Review[];
  courses: Course[];
  stamps: StampState;
  hasRealData: boolean;
}

export interface ReviewCreateRequest {
  placeId: string;
  body: string;
  mood: ReviewMood;
  imageUrl?: string | null;
}

export interface CommentCreateRequest {
  body: string;
  parentId?: string | null;
}

export interface StampToggleRequest {
  placeId: string;
  latitude: number;
  longitude: number;
}

export interface MyStats {
  reviewCount: number;
  stampCount: number;
}

export interface MyPageResponse {
  user: SessionUser;
  stats: MyStats;
  reviews: Review[];
  collectedPlaces: Place[];
}

export interface AdminPlace {
  id: string;
  name: string;
  district: string;
  category: Exclude<Category, 'all'>;
  isActive: boolean;
  reviewCount: number;
  updatedAt: string;
}

export interface AdminSummaryResponse {
  userCount: number;
  placeCount: number;
  reviewCount: number;
  commentCount: number;
  stampCount: number;
  sourceReady: boolean;
  places: AdminPlace[];
}

export interface PlaceVisibilityRequest {
  isActive: boolean;
}

export interface UploadResponse {
  url: string;
  fileName: string;
  contentType: string;
}

export interface PublicImportResponse {
  importedPlaces: number;
  importedCourses: number;
}