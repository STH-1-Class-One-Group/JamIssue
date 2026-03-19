import { useEffect, useMemo, useState } from 'react';
import {
  claimStamp,
  createComment,
  createReview,
  createUserRoute,
  getAuthSession,
  getBootstrap,
  getCommunityRoutes,
  getFestivals,
  getMySummary,
  getProviderLoginUrl,
  logout,
  toggleCommunityRouteLike,
  toggleReviewLike,
  updateProfile,
  uploadReviewImage,
} from './api/client';
import { BottomNav } from './components/BottomNav';
import { CourseTab } from './components/CourseTab';
import { FeedTab } from './components/FeedTab';
import { MapTabStage } from './components/MapTabStage';
import { MyPagePanel } from './components/MyPagePanel';
import { useAppRouteState, clearAuthQueryParams, getInitialNotice, getLoginReturnUrl } from './hooks/useAppRouteState';
import { getCurrentDevicePosition } from './lib/geolocation';
import {
  calculateDistanceMeters,
  formatDistanceMeters,
  getLatestPlaceStamp,
  getPlaceVisitCount,
  getTodayStampLog,
} from './lib/visits';
import type {
  ApiStatus,
  AuthProvider,
  BootstrapResponse,
  Category,
  CommunityRouteSort,
  FestivalItem,
  MyPageResponse,
  MyPageTabKey,
  Place,
  ReviewMood,
  SessionUser,
  UserRoute,
} from './types';

const emptyProviders: AuthProvider[] = [
  { key: 'naver', label: '네이버', isEnabled: false, loginUrl: null },
  { key: 'kakao', label: '카카오', isEnabled: false, loginUrl: null },
];

// 스탐프를 획득하려면 장소로부터 최소 120m 범위 내에 있어야 함 (Haversine 공식으로 GPS 거리 계산)
const STAMP_UNLOCK_RADIUS_METERS = 120;

function filterPlacesByCategory(places: Place[], category: Category) {
  if (category === 'all') {
    return places;
  }

  return places.filter((place) => place.category === category);
}

function formatErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return '요청을 처리하지 못했어요.';
}

export default function App() {
  // URL 동기화: 탭(지도/피드/코스/마이), 드로어 상태(닫힘/부분/전체), 선택 요소 ID
  const {
    activeTab,
    drawerState,
    selectedPlaceId,
    selectedFestivalId,
    setSelectedPlaceId,
    setSelectedFestivalId,
    commitRouteState,
    goToTab,
    openPlace,
    openFestival,
    closeDrawer,
  } = useAppRouteState();

  const [myPageTab, setMyPageTab] = useState<MyPageTabKey>('stamps');
  const [activeCategory, setActiveCategory] = useState<Category>('all');
  const [notice, setNotice] = useState<string | null>(getInitialNotice);
  const [bootstrapStatus, setBootstrapStatus] = useState<ApiStatus>('idle');
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [festivals, setFestivals] = useState<FestivalItem[]>([]);
  const [reviews, setReviews] = useState<BootstrapResponse['reviews']>([]);
  const [courses, setCourses] = useState<BootstrapResponse['courses']>([]);
  const [stampState, setStampState] = useState<BootstrapResponse['stamps']>({
    collectedPlaceIds: [],
    logs: [],
    travelSessions: [],
  });
  const [hasRealData, setHasRealData] = useState(true);
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [providers, setProviders] = useState<AuthProvider[]>(emptyProviders);
  const [communityRoutes, setCommunityRoutes] = useState<UserRoute[]>([]);
  const [communityRouteSort, setCommunityRouteSort] = useState<CommunityRouteSort>('popular');
  const [myPage, setMyPage] = useState<MyPageResponse | null>(null);
  const [currentPosition, setCurrentPosition] = useState<{ latitude: number; longitude: number } | null>(null);
  const [mapLocationStatus, setMapLocationStatus] = useState<ApiStatus>('idle');
  const [mapLocationMessage, setMapLocationMessage] = useState<string | null>(null);
  const [mapLocationFocusKey, setMapLocationFocusKey] = useState(0);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewLikeUpdatingId, setReviewLikeUpdatingId] = useState<string | null>(null);
  const [commentSubmittingReviewId, setCommentSubmittingReviewId] = useState<string | null>(null);
  const [stampActionStatus, setStampActionStatus] = useState<ApiStatus>('idle');
  const [stampActionMessage, setStampActionMessage] = useState('장소를 선택하면 오늘 스탬프 가능 여부를 바로 알려드릴게요.');
  const [routeSubmitting, setRouteSubmitting] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [routeLikeUpdatingId, setRouteLikeUpdatingId] = useState<string | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const filteredPlaces = useMemo(() => filterPlacesByCategory(places, activeCategory), [places, activeCategory]);
  const selectedPlace = useMemo(() => {
    if (!selectedPlaceId) {
      return null;
    }

    return places.find((place) => place.id === selectedPlaceId) ?? null;
  }, [places, selectedPlaceId]);
  const selectedFestival = useMemo(() => {
    if (!selectedFestivalId) {
      return null;
    }

    return festivals.find((festival) => festival.id === selectedFestivalId) ?? null;
  }, [festivals, selectedFestivalId]);
  const selectedPlaceReviews = selectedPlace ? reviews.filter((review) => review.placeId === selectedPlace.id) : [];
  const todayStamp = selectedPlace ? getTodayStampLog(stampState.logs, selectedPlace.id) : null;
  const latestStamp = selectedPlace ? getLatestPlaceStamp(stampState.logs, selectedPlace.id) : null;
  const visitCount = selectedPlace ? getPlaceVisitCount(stampState.logs, selectedPlace.id) : 0;
  const selectedPlaceDistanceMeters =
    selectedPlace && currentPosition
      ? calculateDistanceMeters(currentPosition.latitude, currentPosition.longitude, selectedPlace.latitude, selectedPlace.longitude)
      : null;
  const canCreateReview = Boolean(sessionUser && selectedPlace && todayStamp);
  const placeNameById = useMemo(() => Object.fromEntries(places.map((place) => [place.id, place.name])), [places]);

  // 앱 부팅: 초기 데이터(장소, 리뷰), 인증 정보, 커뮤니티 코스 로드
  useEffect(() => {
    void loadApp(true);
  }, []);

  // 지도 탭 진입 시 현재 위치 자동 갱신 (위치 권한 필요)
  useEffect(() => {
    if (activeTab !== 'map' || mapLocationStatus !== 'idle') {
      return;
    }

    void refreshCurrentPosition(false);
  }, [activeTab, mapLocationStatus]);

  useEffect(() => {
    if (!notice) {
      return;
    }

    const timeout = window.setTimeout(() => setNotice(null), 3200);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  useEffect(() => {
    if (!selectedPlaceId) {
      return;
    }

    const isVisibleInCurrentCategory = filteredPlaces.some((place) => place.id === selectedPlaceId);
    if (!isVisibleInCurrentCategory) {
      commitRouteState(
        {
          tab: 'map',
          placeId: null,
          festivalId: null,
          drawerState: 'closed',
        },
        'replace',
      );
    }
  }, [commitRouteState, filteredPlaces, selectedPlaceId]);

  useEffect(() => {
    if (!selectedPlace) {
      setStampActionMessage('장소를 선택하면 오늘 스탬프 가능 여부를 바로 알려드릴게요.');
      return;
    }

    if (!sessionUser) {
      setStampActionMessage(`로그인하면 ${selectedPlace.name}에서 바로 현장 스탬프를 찍을 수 있어요.`);
      return;
    }

    if (todayStamp) {
      setStampActionMessage(`${todayStamp.visitLabel} 스탬프를 이미 찍었어요. 오늘 피드와 코스로 바로 이어갈 수 있어요.`);
      return;
    }

    if (typeof selectedPlaceDistanceMeters !== 'number') {
      setStampActionMessage('현재 위치를 확인하면 스탬프 가능 여부를 바로 알려드릴게요.');
      return;
    }

    if (selectedPlaceDistanceMeters <= STAMP_UNLOCK_RADIUS_METERS) {
      setStampActionMessage(`현재 약 ${formatDistanceMeters(selectedPlaceDistanceMeters)} 거리예요. 지금 바로 스탬프를 찍을 수 있어요.`);
      return;
    }

    setStampActionMessage(`현재 약 ${formatDistanceMeters(selectedPlaceDistanceMeters)} 거리예요. ${STAMP_UNLOCK_RADIUS_METERS}m 안으로 들어오면 스탬프가 열려요.`);
  }, [selectedPlace, selectedPlaceDistanceMeters, sessionUser, todayStamp]);

  async function loadApp(withLoading: boolean) {
    const authParams = typeof window === 'undefined' ? null : new URLSearchParams(window.location.search);
    // OAuth 콜백 후 redirect 파라미터 (naver-success, naver-error 등)
    const authState = authParams?.get('auth');

    if (withLoading) {
      setBootstrapStatus('loading');
    }
    setBootstrapError(null);

    try {
      const [bootstrap, auth, routes, festivalResult] = await Promise.all([
        getBootstrap(),
        getAuthSession(),
        getCommunityRoutes(communityRouteSort),
        getFestivals().catch(() => [] as FestivalItem[]),
      ]);

      setPlaces(bootstrap.places);
      setFestivals(festivalResult);
      setReviews(bootstrap.reviews);
      setCourses(bootstrap.courses);
      setStampState(bootstrap.stamps);
      setHasRealData(bootstrap.hasRealData);
      setCommunityRoutes(routes);
      setSessionUser(auth.user);
      setProviders(auth.providers);
      setSelectedPlaceId((current) => (current && bootstrap.places.some((place) => place.id === current) ? current : null));
      setSelectedFestivalId((current) => (current && festivalResult.some((festival) => festival.id === current) ? current : null));

      if (auth.user) {
        setMyPage(await getMySummary());
      } else {
        setMyPage(null);
      }

      setBootstrapStatus('ready');
      // OAuth 성공 후 첫 로그인 시: 프로필(닉네임) 입력 강제 유도로 완성된 계정 보장
      if (authState === 'naver-success' && auth.user?.profileCompletedAt === null) {
        goToTab('my');
        setNotice('닉네임을 먼저 저장하면 바로 피드와 코스로 이어갈 수 있어요.');
      }
    } catch (error) {
      setBootstrapError(formatErrorMessage(error));
      setBootstrapStatus('error');
    } finally {
      // OAuth 후 URL 정리: 새로고침 시 "naver-success" 공지 반복 방지
      clearAuthQueryParams();
    }
  }

  async function refreshCurrentPosition(shouldFocusMap: boolean) {
    setMapLocationStatus('loading');
    setMapLocationMessage('현재 위치를 확인하고 있어요.');

    try {
      const nextPosition = await getCurrentDevicePosition();
      setCurrentPosition({ latitude: nextPosition.latitude, longitude: nextPosition.longitude });
      setMapLocationStatus('ready');
      setMapLocationMessage(`현재 위치를 다시 잡았어요. 예상 오차는 약 ${formatDistanceMeters(nextPosition.accuracyMeters)}예요.`);
      if (shouldFocusMap) {
        setMapLocationFocusKey((current) => current + 1);
      }
    } catch (error) {
      setCurrentPosition(null);
      setMapLocationStatus('error');
      setMapLocationMessage(formatErrorMessage(error));
    }
  }

  function startProviderLogin(provider: 'naver' | 'kakao') {
    window.location.assign(getProviderLoginUrl(provider, getLoginReturnUrl()));
  }

  async function handleClaimStamp(place: Place) {
    // 미로그인 유저: 로그인 탭으로 이동
    if (!sessionUser) {
      goToTab('my');
      setNotice('로그인해야 현장 스탬프를 찍을 수 있어요.');
      return;
    }

    setStampActionStatus('loading');
    try {
      // 현재 위치 확인 → 거리 검증 → 스탬프 API 호출 순서로 진행
      const nextPosition = await getCurrentDevicePosition();
      setCurrentPosition({ latitude: nextPosition.latitude, longitude: nextPosition.longitude });
      const nextStampState = await claimStamp({
        placeId: place.id,
        latitude: nextPosition.latitude,
        longitude: nextPosition.longitude,
      });
      setStampState(nextStampState);
      setNotice(`${place.name}에서 오늘 스탬프를 찍었어요.`);
      commitRouteState(
        {
          tab: 'map',
          placeId: place.id,
          festivalId: null,
          drawerState: 'full',
        },
        'replace',
      );
      setMyPage(await getMySummary());
    } catch (error) {
      setNotice(formatErrorMessage(error));
    } finally {
      setStampActionStatus('ready');
    }
  }

  // 장소 리뷰 작성 (이미지 선택적)
  async function handleCreateReview(payload: { stampId: string; body: string; mood: ReviewMood; file: File | null }) {
    if (!sessionUser || !selectedPlace) {
      goToTab('my');
      return;
    }

    setReviewSubmitting(true);
    setReviewError(null);
    try {
      // 이미지가 있으면 uploadReviewImage로 서버 저장 후 URL 획득, 없으면 null로 진행
      let imageUrl: string | null = null;
      if (payload.file) {
        const uploaded = await uploadReviewImage(payload.file);
        imageUrl = uploaded.url;
      }

      await createReview({
        placeId: selectedPlace.id,
        stampId: payload.stampId,
        body: payload.body.trim(),
        mood: payload.mood,
        imageUrl,
      });

      setNotice('피드를 남겼어요. 같은 여행 흐름으로 코스까지 이어갈 수 있어요.');
      // 리뷰 생성 후 전체 데이터 새로고침 (좋아요 카운트, 댓글 등 업데이트 반영)
      await loadApp(false);
      commitRouteState(
        {
          tab: 'map',
          placeId: selectedPlace.id,
          festivalId: null,
          drawerState: 'full',
        },
        'replace',
      );
    } catch (error) {
      setReviewError(formatErrorMessage(error));
    } finally {
      setReviewSubmitting(false);
    }
  }

  // 리뷰 댓글/대댓글 작성
  async function handleCreateComment(reviewId: string, body: string, parentId?: string) {
    if (!sessionUser) {
      goToTab('my');
      setNotice('댓글을 남기려면 먼저 로그인해 주세요.');
      return;
    }

    setCommentSubmittingReviewId(reviewId);
    try {
      // parentId가 있으면 대댓글, 없으면 댓글
      await createComment(reviewId, { body, parentId: parentId ?? null });
      // 댓글 작성 후 전체 새로고침
      await loadApp(false);
    } catch (error) {
      setNotice(formatErrorMessage(error));
    } finally {
      setCommentSubmittingReviewId(null);
    }
  }

  // 리뷰 좋아요 토글 (누르면 토글, loadApp으로 전체 갱신)
  async function handleToggleReviewLike(reviewId: string) {
    if (!sessionUser) {
      goToTab('my');
      setNotice('좋아요를 누르려면 먼저 로그인해 주세요.');
      return;
    }

    setReviewLikeUpdatingId(reviewId);
    try {
      await toggleReviewLike(reviewId);
      // 좋아요 상태 변경 후 전체 데이터 새로고침 (좋아요 카운트 반영)
      await loadApp(false);
    } catch (error) {
      setNotice(formatErrorMessage(error));
    } finally {
      setReviewLikeUpdatingId(null);
    }
  }

  // 코스(커뮤니티 라우트) 좋아요 토글
  async function handleToggleRouteLike(routeId: string) {
    if (!sessionUser) {
      goToTab('my');
      setNotice('좋아요를 누르려면 먼저 로그인해 주세요.');
      return;
    }

    setRouteLikeUpdatingId(routeId);
    try {
      await toggleCommunityRouteLike(routeId);
      // 코스 좋아요 후: 코스 목록 새로고침 + 개인 통계 업데이트
      const nextRoutes = await getCommunityRoutes(communityRouteSort);
      setCommunityRoutes(nextRoutes);
      setMyPage(await getMySummary());
    } catch (error) {
      setNotice(formatErrorMessage(error));
    } finally {
      setRouteLikeUpdatingId(null);
    }
  }

  // 여행 세션을 공개 코스로 발행 (travelSession 기반)
  async function handlePublishRoute(payload: { travelSessionId: string; title: string; description: string; mood: string }) {
    if (!sessionUser) {
      goToTab('my');
      setRouteError('로그인한 뒤에만 여행 세션을 코스로 발행할 수 있어요.');
      return;
    }

    setRouteSubmitting(true);
    setRouteError(null);
    try {
      // travelSessionId: 24시간 이내 방문들의 자동 그룹핑 (App.tsx 기본값 120m)
      await createUserRoute({
        travelSessionId: payload.travelSessionId,
        title: payload.title,
        description: payload.description,
        mood: payload.mood,
        isPublic: true,
      });
      setNotice('여행 세션을 공개 코스로 발행했어요. 이제 다른 사용자도 이 경로를 볼 수 있어요.');
      await loadApp(false);
      setMyPageTab('routes');
    } catch (error) {
      setRouteError(formatErrorMessage(error));
    } finally {
      setRouteSubmitting(false);
    }
  }

  // 프로필 업데이트 (닉네임): updateProfile에서 JWT 재발급 후 쿠키에 저장
  async function handleUpdateProfile(nextNickname: string) {
    if (!nextNickname || nextNickname.length < 2) {
      setProfileError('닉네임은 두 글자 이상으로 입력해 주세요.');
      return;
    }

    setProfileSaving(true);
    setProfileError(null);
    try {
      // updateProfile: 백엔드는 새 JWT 토큰 발급 → set-cookie로 응답
      const auth = await updateProfile({ nickname: nextNickname });
      // 업데이트된 사용자 정보로 즉시 반영 (새 토큰은 이미 쿠키에 저장됨)
      setSessionUser(auth.user);
      if (auth.user) {
        setMyPage(await getMySummary());
      }
      setNotice('닉네임을 저장했어요. 이제 메인 흐름으로 바로 이어갈 수 있어요.');
    } catch (error) {
      setProfileError(formatErrorMessage(error));
    } finally {
      setProfileSaving(false);
    }
  }

  // 로그아웃: 백엔드가 세션 쿠키 삭제 응답 → 클라이언트는 sessionUser null + 전체 새로고침
  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      // logout API: 백엔드는 set-cookie를 빈 값으로 응답 (세션 쿠키 삭제)
      await logout();
      // 클라이언트 상태 초기화
      setSessionUser(null);
      setMyPage(null);
      setNotice('로그아웃했어요.');
      // 전체 데이터 새로고침 (로그인 상태 반영)
      await loadApp(false);
    } catch (error) {
      setNotice(formatErrorMessage(error));
    } finally {
      setIsLoggingOut(false);
    }
  }

  const reviewProofMessage = !sessionUser
    ? '로그인한 뒤 스탬프를 찍어야 피드를 작성할 수 있어요.'
    : todayStamp
      ? `${todayStamp.visitLabel} 스탬프가 있어요. 지금 이 장소 피드를 바로 남길 수 있어요.`
      : '오늘 스탬프를 찍으면 피드 작성 버튼이 바로 열려요.';

  return (
    <div className="map-app-shell">
      <div className={activeTab === 'map' ? 'phone-shell phone-shell--map' : 'phone-shell'}>
        {activeTab === 'map' ? (
          <MapTabStage
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
            notice={notice}
            bootstrapStatus={bootstrapStatus}
            bootstrapError={bootstrapError}
            filteredPlaces={filteredPlaces}
            festivals={festivals}
            selectedPlace={selectedPlace}
            selectedFestival={selectedFestival}
            currentPosition={currentPosition}
            mapLocationStatus={mapLocationStatus}
            mapLocationMessage={mapLocationMessage}
            mapLocationFocusKey={mapLocationFocusKey}
            drawerState={drawerState}
            sessionUser={sessionUser}
            selectedPlaceReviews={selectedPlaceReviews}
            visitCount={visitCount}
            latestStamp={latestStamp}
            todayStamp={todayStamp}
            stampActionStatus={stampActionStatus}
            stampActionMessage={stampActionMessage}
            reviewProofMessage={reviewProofMessage}
            reviewError={reviewError}
            reviewSubmitting={reviewSubmitting}
            reviewLikeUpdatingId={reviewLikeUpdatingId}
            commentSubmittingReviewId={commentSubmittingReviewId}
            canCreateReview={canCreateReview}
            onOpenPlace={openPlace}
            onOpenFestival={openFestival}
            onCloseDrawer={closeDrawer}
            onExpandPlaceDrawer={() =>
              selectedPlace &&
              commitRouteState({ tab: 'map', placeId: selectedPlace.id, festivalId: null, drawerState: 'full' }, 'replace')
            }
            onCollapsePlaceDrawer={() =>
              selectedPlace &&
              commitRouteState({ tab: 'map', placeId: selectedPlace.id, festivalId: null, drawerState: 'partial' }, 'replace')
            }
            onExpandFestivalDrawer={() =>
              selectedFestival &&
              commitRouteState({ tab: 'map', placeId: null, festivalId: selectedFestival.id, drawerState: 'full' }, 'replace')
            }
            onCollapseFestivalDrawer={() =>
              selectedFestival &&
              commitRouteState({ tab: 'map', placeId: null, festivalId: selectedFestival.id, drawerState: 'partial' }, 'replace')
            }
            onRequestLogin={() => goToTab('my')}
            onClaimStamp={handleClaimStamp}
            onCreateReview={handleCreateReview}
            onToggleReviewLike={handleToggleReviewLike}
            onCreateComment={handleCreateComment}
            onLocateCurrentPosition={() => void refreshCurrentPosition(true)}
          />
        ) : (
          <div className="page-stage">
            {notice && <div className="floating-notice">{notice}</div>}
            {bootstrapStatus === 'loading' && <section className="floating-status">화면을 준비하고 있어요.</section>}
            {bootstrapStatus === 'error' && <section className="floating-status floating-status--error">{bootstrapError}</section>}

            {activeTab === 'feed' && (
              <FeedTab
                reviews={reviews}
                sessionUser={sessionUser}
                reviewLikeUpdatingId={reviewLikeUpdatingId}
                commentSubmittingReviewId={commentSubmittingReviewId}
                onToggleReviewLike={handleToggleReviewLike}
                onCreateComment={handleCreateComment}
                onRequestLogin={() => goToTab('my')}
                onOpenPlace={openPlace}
              />
            )}

            {activeTab === 'course' && (
              <CourseTab
                curatedCourses={courses}
                communityRoutes={communityRoutes}
                sort={communityRouteSort}
                sessionUser={sessionUser}
                routeLikeUpdatingId={routeLikeUpdatingId}
                placeNameById={placeNameById}
                onChangeSort={(sort) => {
                  setCommunityRouteSort(sort);
                  void getCommunityRoutes(sort)
                    .then(setCommunityRoutes)
                    .catch((error) => setNotice(formatErrorMessage(error)));
                }}
                onToggleLike={handleToggleRouteLike}
                onOpenPlace={openPlace}
                onRequestLogin={() => goToTab('my')}
              />
            )}

            {activeTab === 'my' && (
              <MyPagePanel
                sessionUser={sessionUser}
                myPage={myPage}
                providers={providers}
                activeTab={myPageTab}
                isLoggingOut={isLoggingOut}
                profileSaving={profileSaving}
                profileError={profileError}
                routeSubmitting={routeSubmitting}
                routeError={routeError}
                onChangeTab={setMyPageTab}
                onLogin={startProviderLogin}
                onLogout={handleLogout}
                onSaveNickname={handleUpdateProfile}
                onPublishRoute={handlePublishRoute}
                onOpenPlace={openPlace}
              />
            )}
          </div>
        )}

        <BottomNav activeTab={activeTab} onChange={goToTab} />
      </div>
    </div>
  );
}
