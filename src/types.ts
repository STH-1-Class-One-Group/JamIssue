import type { PlaceCategory, PlaceCategoryFilter } from './lib/categories';

export type Category = PlaceCategoryFilter;
export type Tab = 'map' | 'feed' | 'course' | 'my';
export type MyPageTabKey = 'stamps' | 'feeds' | 'routes';
export type DrawerState = 'closed' | 'partial' | 'full';
export type ReviewMood = '혼자서' | '친구랑' | '데이트' | '야경 맛집';
export type CourseMood = '전체' | '데이트' | '사진' | '힐링' | '비 오는 날';
export type ApiStatus = 'idle' | 'loading' | 'ready' | 'error';
export type ProviderKey = 'naver' | 'kakao';
export type CommunityRouteSort = 'popular' | 'latest';

export interface SessionUser {
  id: string;
  nickname: string;
  email: string | null;
  provider: string;
  profileImage: string | null;
  isAdmin: boolean;
  profileCompletedAt: string | null;
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
  positionId?: string;
  name: string;
  district: string;
  category: PlaceCategory;
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
  // 기본 정보
  id: string; // Feed.feed_id
  userId: string;
  placeId: string; // MapPlace.slug
  placeName: string;
  author: string; // User.nickname
  body: string; // 후기 본문
  
  // 분위기 & 배지
  mood: ReviewMood; // 방문한 상황 ('혼자서', '친구랑', '데이트', '야경 맛집')
  badge: string; // 분위기 또는 방문 횟수 기반 배지 ("첫 방문", "친구 추천" 등)
  
  // 시간 & 이미지
  visitedAt: string; // 방문 시간 (스탐프 생성 시간, "1시간 전" 형식)
  imageUrl: string | null; // Supabase Storage URL
  
  // 상호작용
  commentCount: number;
  likeCount: number;
  likedByMe: boolean; // 현재 로그인 사용자의 좋아요 여부
  
  // 스탐프 & 여행 세션 정보
  stampId: string | null; // 연결된 UserStamp.stamp_id
  visitNumber: number; // 같은 장소 누적 방문 횟수 (1번째, 2번째 등)
  visitLabel: string; // "3번째 방문" 같은 표시
  travelSessionId: string | null; // 24시간 여행 세션 ID (경로 발행 기준)
  
  // 댓글 스레드
  comments: Comment[]; // 트리 구조 (부모 댓글 + 답글)
}

export interface StampLog {
  // 기본 정보
  id: string; // UserStamp.stamp_id
  placeId: string; // MapPlace.slug
  placeName: string;
  
  // 시간 정보
  stampedAt: string; // 스탐프 획득 시간 ("1시간 전" 형식)
  stampedDate: string; // 날짜 (ISO format: "2024-01-15")
  
  // 방문 기록
  visitNumber: number; // 누적 방문 횟수 (같은 장소 1번째/2번째/3번째)
  visitLabel: string; // "3번째 방문" 표시
  
  // 여행 세션
  travelSessionId: string | null; // 24시간 window 여행 세션 (경로 발행 기준)
  
  // UI 플래그
  isToday: boolean; // stampedDate === 오늘인지 (오늘 획득한 스탐프 표시)
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

export interface ReviewLikeResponse {
  reviewId: string;
  likeCount: number;
  likedByMe: boolean;
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

export interface UserRouteLikeResponse {
  routeId: string;
  likeCount: number;
  likedByMe: boolean;
}

export interface FestivalItem {
  id: string;
  title: string;
  venueName: string | null;
  startDate: string;
  endDate: string;
  homepageUrl: string | null;
  roadAddress: string | null;
  latitude: number;
  longitude: number;
  isOngoing: boolean;
}

export interface StampState {
  collectedPlaceIds: string[];
  logs: StampLog[];
  travelSessions: TravelSession[];
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
  stampId: string;
  body: string;
  mood: ReviewMood;
  imageUrl?: string | null;
}

export interface CommentCreateRequest {
  body: string;
  parentId?: string | null;
}

export interface UserRouteCreateRequest {
  title: string;
  description: string;
  mood: string;
  travelSessionId: string;
  isPublic?: boolean;
}

export interface StampClaimRequest {
  placeId: string;
  latitude: number;
  longitude: number;
}

export interface MyStats {
  reviewCount: number;
  stampCount: number;
  uniquePlaceCount: number;
  totalPlaceCount: number;
  routeCount: number;
}

export interface MyPageResponse {
  user: SessionUser;
  stats: MyStats;
  reviews: Review[];
  stampLogs: StampLog[];
  travelSessions: TravelSession[];
  visitedPlaces: Place[];
  unvisitedPlaces: Place[];
  collectedPlaces: Place[];
  routes: UserRoute[];
}

export interface ProfileUpdateRequest {
  nickname: string;
}

export interface AdminPlace {
  id: string;
  name: string;
  district: string;
  category: PlaceCategory;
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

export interface RoadmapBannerSummaryItem {
  label: string;
  value: string;
  tone: 'pink' | 'blue' | 'mint';
}

export interface RoadmapBannerMilestone {
  id: string;
  dateLabel: string;
  statusLabel: string;
  title: string;
  body: string;
  deliverable: string;
}


