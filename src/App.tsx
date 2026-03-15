import { useEffect, useMemo, useState } from 'react';
import {
  createComment,
  createReview,
  getAdminSummary,
  getAuthSession,
  getBootstrap,
  getMySummary,
  getProviderLoginUrl,
  importPublicData,
  logout,
  toggleStamp,
  updatePlaceVisibility,
  uploadReviewImage,
} from './api/client';
import { AdminPanel } from './components/AdminPanel';
import { BottomNav } from './components/BottomNav';
import { NaverMap } from './components/NaverMap';
import { PlaceDetailSheet } from './components/PlaceDetailSheet';
import { ProviderButtons } from './components/ProviderButtons';
import type {
  AdminSummaryResponse,
  ApiStatus,
  AuthProvider,
  BootstrapResponse,
  Category,
  CourseMood,
  MyPageResponse,
  Place,
  ProviderKey,
  Review,
  ReviewMood,
  SessionUser,
  Tab,
} from './types';

const categoryItems: { key: Category; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'landmark', label: '명소' },
  { key: 'food', label: '맛집' },
  { key: 'cafe', label: '카페' },
  { key: 'night', label: '야경' },
];

const moodItems: CourseMood[] = ['전체', '데이트', '사진', '힐링', '비 오는 날'];
const emptyProviders: AuthProvider[] = [
  { key: 'naver', label: '네이버', isEnabled: false, loginUrl: null },
  { key: 'google', label: '구글', isEnabled: false, loginUrl: null },
  { key: 'kakao', label: '카카오', isEnabled: false, loginUrl: null },
  { key: 'apple', label: 'Apple', isEnabled: false, loginUrl: null },
];
const validTabs: Tab[] = ['explore', 'course', 'stamp', 'my'];
const STAMP_UNLOCK_RADIUS_METERS = 120;

function getInitialTab(): Tab {
  if (typeof window === 'undefined') {
    return 'explore';
  }

  const params = new URLSearchParams(window.location.search);
  const tab = params.get('tab');
  if (tab && validTabs.includes(tab as Tab)) {
    return tab as Tab;
  }

  if (params.get('auth')) {
    return 'my';
  }

  return 'explore';
}

function getInitialNotice() {
  if (typeof window === 'undefined') {
    return null;
  }

  const params = new URLSearchParams(window.location.search);
  const auth = params.get('auth');
  const reason = params.get('reason');
  if (auth === 'naver-success') {
    return '네이버 로그인이 연결됐어요.';
  }
  if (auth === 'naver-error') {
    return reason ? `네이버 로그인에 실패했어요. (${reason})` : '네이버 로그인에 실패했어요.';
  }
  return null;
}

function clearAuthQueryParams() {
  if (typeof window === 'undefined') {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  if (!params.has('auth') && !params.has('reason')) {
    return;
  }

  params.delete('auth');
  params.delete('reason');
  const nextQuery = params.toString();
  const nextUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ''}`;
  window.history.replaceState({}, '', nextUrl);
}

function getLoginReturnUrl() {
  if (typeof window === 'undefined') {
    return 'http://localhost:8000/?tab=my';
  }

  return `${window.location.origin}/?tab=my`;
}

function filterPlacesByCategory(places: Place[], category: Category) {
  if (category === 'all') {
    return places;
  }
  return places.filter((place) => place.category === category);
}

function calculateStampRate(total: number, collected: number) {
  if (total === 0) {
    return 0;
  }
  return Math.round((collected / total) * 100);
}

function calculateDistanceMeters(startLatitude: number, startLongitude: number, endLatitude: number, endLongitude: number) {
  const earthRadiusMeters = 6_371_000;
  const latitudeDelta = ((endLatitude - startLatitude) * Math.PI) / 180;
  const longitudeDelta = ((endLongitude - startLongitude) * Math.PI) / 180;
  const startLatitudeRadians = (startLatitude * Math.PI) / 180;
  const endLatitudeRadians = (endLatitude * Math.PI) / 180;

  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(startLatitudeRadians) * Math.cos(endLatitudeRadians) * Math.sin(longitudeDelta / 2) ** 2;

  return earthRadiusMeters * (2 * Math.asin(Math.sqrt(haversine)));
}

function formatDistanceMeters(distanceMeters: number) {
  if (distanceMeters < 1000) {
    return `${Math.round(distanceMeters)}m`;
  }

  return `${(distanceMeters / 1000).toFixed(1)}km`;
}

function formatErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }
  return '요청을 처리하지 못했어요.';
}

function getCurrentDevicePosition() {
  return new Promise<GeolocationPosition>((resolve, reject) => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      reject(new Error('이 기기에서는 위치 확인을 사용할 수 없어요.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => resolve(position),
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          reject(new Error('위치 권한이 꺼져 있어요. 브라우저 설정에서 위치 권한을 켜 주세요.'));
          return;
        }
        if (error.code === error.POSITION_UNAVAILABLE) {
          reject(new Error('현재 위치를 찾지 못했어요. GPS 신호가 잘 잡히는 곳에서 다시 시도해 주세요.'));
          return;
        }
        if (error.code === error.TIMEOUT) {
          reject(new Error('위치 확인 시간이 초과됐어요. 다시 시도해 주세요.'));
          return;
        }
        reject(new Error('현재 위치를 확인하지 못했어요.'));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  });
}

function App() {
  const [activeTab, setActiveTab] = useState<Tab>(getInitialTab);
  const [activeCategory, setActiveCategory] = useState<Category>('all');
  const [activeMood, setActiveMood] = useState<CourseMood>('전체');
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [detailPlaceId, setDetailPlaceId] = useState<string | null>(null);
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [providers, setProviders] = useState<AuthProvider[]>(emptyProviders);
  const [notice, setNotice] = useState<string | null>(getInitialNotice);
  const [places, setPlaces] = useState<Place[]>([]);
  const [courses, setCourses] = useState<BootstrapResponse['courses']>([]);
  const [allReviews, setAllReviews] = useState<Review[]>([]);
  const [collectedStampIds, setCollectedStampIds] = useState<string[]>([]);
  const [myPage, setMyPage] = useState<MyPageResponse | null>(null);
  const [adminSummary, setAdminSummary] = useState<AdminSummaryResponse | null>(null);
  const [bootstrapStatus, setBootstrapStatus] = useState<ApiStatus>('idle');
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);
  const [hasRealData, setHasRealData] = useState(true);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [commentSubmittingReviewId, setCommentSubmittingReviewId] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [stampUpdatingId, setStampUpdatingId] = useState<string | null>(null);
  const [adminUpdatingPlaceId, setAdminUpdatingPlaceId] = useState<string | null>(null);
  const [isImportingPublicData, setIsImportingPublicData] = useState(false);
  const [stampLocationStatus, setStampLocationStatus] = useState<ApiStatus>('idle');
  const [stampLocationMessage, setStampLocationMessage] = useState<string | null>(null);
  const [currentPosition, setCurrentPosition] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    void loadApp(true);
  }, []);

  useEffect(() => {
    if (activeTab !== 'stamp') {
      return;
    }

    if (!sessionUser) {
      setCurrentPosition(null);
      setStampLocationStatus('idle');
      setStampLocationMessage('로그인 후 현장 스탬프가 열려요.');
      return;
    }

    if (stampLocationStatus === 'idle') {
      void refreshStampLocation(false);
    }
  }, [activeTab, sessionUser, stampLocationStatus]);

  useEffect(() => {
    if (!notice) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setNotice(null);
    }, 3200);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [notice]);

  const filteredPlaces = useMemo(() => filterPlacesByCategory(places, activeCategory), [places, activeCategory]);
  const selectedPlace = useMemo(
    () =>
      filteredPlaces.find((place) => place.id === selectedPlaceId) ??
      places.find((place) => place.id === selectedPlaceId) ??
      filteredPlaces[0] ??
      places[0] ??
      null,
    [filteredPlaces, places, selectedPlaceId],
  );
  const detailPlace = places.find((place) => place.id === detailPlaceId) ?? null;
  const selectedPlaceReviews = selectedPlace ? allReviews.filter((review) => review.placeId === selectedPlace.id) : [];
  const detailReviews = detailPlace ? allReviews.filter((review) => review.placeId === detailPlace.id) : [];
  const visibleCourses = activeMood === '전체' ? courses : courses.filter((course) => course.mood === activeMood);
  const stampRate = calculateStampRate(places.length, collectedStampIds.length);
  const stampDistanceByPlaceId = useMemo(() => {
    const nextDistances = new Map<string, number>();
    if (!currentPosition) {
      return nextDistances;
    }

    places.forEach((place) => {
      nextDistances.set(
        place.id,
        calculateDistanceMeters(currentPosition.latitude, currentPosition.longitude, place.latitude, place.longitude),
      );
    });

    return nextDistances;
  }, [places, currentPosition]);

  useEffect(() => {
    if (!selectedPlaceId && filteredPlaces[0]) {
      setSelectedPlaceId(filteredPlaces[0].id);
      return;
    }

    if (selectedPlaceId && !filteredPlaces.some((place) => place.id === selectedPlaceId) && filteredPlaces[0]) {
      setSelectedPlaceId(filteredPlaces[0].id);
    }
  }, [filteredPlaces, selectedPlaceId]);

  async function loadPersonalPanels(user: SessionUser | null) {
    if (!user) {
      setMyPage(null);
      setAdminSummary(null);
      return;
    }

    const [mySummary, nextAdminSummary] = await Promise.all([
      getMySummary(),
      user.isAdmin ? getAdminSummary() : Promise.resolve(null),
    ]);

    setMyPage(mySummary);
    setAdminSummary(nextAdminSummary);
  }

  async function loadApp(withLoading: boolean) {
    const authParams = typeof window === 'undefined' ? null : new URLSearchParams(window.location.search);
    const authState = authParams?.get('auth');

    if (withLoading) {
      setBootstrapStatus('loading');
    }
    setBootstrapError(null);

    try {
      const [bootstrap, auth] = await Promise.all([getBootstrap(), getAuthSession()]);
      setPlaces(bootstrap.places);
      setCourses(bootstrap.courses);
      setAllReviews(bootstrap.reviews);
      setCollectedStampIds(bootstrap.stamps.collectedPlaceIds);
      setSelectedPlaceId((current) => current ?? bootstrap.places[0]?.id ?? null);
      setSessionUser(auth.user);
      setProviders(auth.providers);
      setHasRealData(bootstrap.hasRealData);
      await loadPersonalPanels(auth.user);
      setBootstrapStatus('ready');

      if (authState === 'naver-success' && !auth.user) {
        setNotice('로그인 연결이 끝나지 않았어요. 다시 시도해 주세요.');
      }
    } catch (error) {
      setBootstrapError(formatErrorMessage(error));
      setBootstrapStatus('error');
    } finally {
      clearAuthQueryParams();
    }
  }

  function startProviderLogin(provider: ProviderKey) {
    window.location.assign(getProviderLoginUrl(provider, getLoginReturnUrl()));
  }

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await logout();
      setNotice('로그아웃했어요. 다시 로그인하면 후기와 스탬프가 계정 기준으로 이어져요.');
      await loadApp(false);
    } catch (error) {
      setBootstrapError(formatErrorMessage(error));
    } finally {
      setIsLoggingOut(false);
    }
  }

  async function handleCreateReview(payload: { placeId: string; body: string; mood: ReviewMood; file: File | null }) {
    if (!sessionUser) {
      setActiveTab('my');
      setReviewError('후기와 스탬프는 로그인 뒤에 계정 기준으로 저장돼요.');
      return;
    }

    const nextBody = payload.body.trim();
    if (!nextBody) {
      setReviewError('후기를 한 줄 이상 적어 주세요.');
      return;
    }

    setReviewSubmitting(true);
    setReviewError(null);

    try {
      let imageUrl: string | null = null;
      if (payload.file) {
        const uploaded = await uploadReviewImage(payload.file);
        imageUrl = uploaded.url;
      }

      await createReview({
        placeId: payload.placeId,
        body: nextBody,
        mood: payload.mood,
        imageUrl,
      });

      setNotice('후기를 저장했어요. 장소 커뮤니티에 바로 반영됐어요.');
      await loadApp(false);
    } catch (error) {
      setReviewError(formatErrorMessage(error));
    } finally {
      setReviewSubmitting(false);
    }
  }

  async function handleCreateComment(reviewId: string, body: string, parentId?: string) {
    if (!sessionUser) {
      setActiveTab('my');
      setNotice('댓글은 로그인 뒤에 남길 수 있어요.');
      return;
    }

    setCommentSubmittingReviewId(reviewId);
    try {
      await createComment(reviewId, { body, parentId: parentId ?? null });
      await loadApp(false);
    } catch (error) {
      setNotice(formatErrorMessage(error));
    } finally {
      setCommentSubmittingReviewId(null);
    }
  }

  async function refreshStampLocation(showNotice: boolean) {
    if (!sessionUser) {
      setCurrentPosition(null);
      setStampLocationStatus('idle');
      setStampLocationMessage('로그인 후 현장 스탬프가 열려요.');
      if (showNotice) {
        setActiveTab('my');
      }
      return;
    }

    setStampLocationStatus('loading');
    setStampLocationMessage('현재 위치를 확인하고 있어요.');

    try {
      const position = await getCurrentDevicePosition();
      const nextPosition = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      setCurrentPosition(nextPosition);
      setStampLocationStatus('ready');
      setStampLocationMessage(`반경 ${STAMP_UNLOCK_RADIUS_METERS}m 안에 들어오면 스탬프 버튼이 열려요.`);
      if (showNotice) {
        setStampLocationMessage(`반경 ${STAMP_UNLOCK_RADIUS_METERS}m 안에 들어오면 스탬프 버튼이 열려요.`);
      }
    } catch (error) {
      const message = formatErrorMessage(error);
      setCurrentPosition(null);
      setStampLocationStatus('error');
      setStampLocationMessage(message);
    }
  }

  async function handleCollectStamp(place: Place) {
    if (!sessionUser) {
      setActiveTab('my');
      return;
    }

    if (collectedStampIds.includes(place.id)) {
      setStampLocationMessage(`${place.name} 스탬프는 이미 적립되어 있어요.`);
      return;
    }

    setStampUpdatingId(place.id);
    try {
      const position = await getCurrentDevicePosition();
      const nextPosition = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      const distanceMeters = calculateDistanceMeters(
        nextPosition.latitude,
        nextPosition.longitude,
        place.latitude,
        place.longitude,
      );

      setCurrentPosition(nextPosition);
      setStampLocationStatus('ready');

      if (distanceMeters > STAMP_UNLOCK_RADIUS_METERS) {
        setStampLocationMessage(`${place.name}까지 ${formatDistanceMeters(distanceMeters)} 남았어요. 반경 ${STAMP_UNLOCK_RADIUS_METERS}m 안에 들어오면 버튼이 열려요.`);
        return;
      }

      const response = await toggleStamp({
        placeId: place.id,
        latitude: nextPosition.latitude,
        longitude: nextPosition.longitude,
      });
      setCollectedStampIds(response.collectedPlaceIds);
      setStampLocationMessage(`${place.name} 현장 반경이 확인돼서 지금 적립할 수 있었어요.`);
      await loadPersonalPanels(sessionUser);
    } catch (error) {
      const message = formatErrorMessage(error);
      setStampLocationStatus('error');
      setStampLocationMessage(message);
    } finally {
      setStampUpdatingId(null);
    }
  }

  async function handleTogglePlace(placeId: string, nextValue: boolean) {
    setAdminUpdatingPlaceId(placeId);
    try {
      await updatePlaceVisibility(placeId, { isActive: nextValue });
      setNotice(nextValue ? '장소를 다시 노출했어요.' : '장소를 숨김 처리했어요.');
      await loadApp(false);
    } catch (error) {
      setNotice(formatErrorMessage(error));
    } finally {
      setAdminUpdatingPlaceId(null);
    }
  }

  async function handleImportPublicData() {
    setIsImportingPublicData(true);
    try {
      const result = await importPublicData();
      setNotice(`장소 ${result.importedPlaces}건, 코스 ${result.importedCourses}건을 다시 가져왔어요.`);
      await loadApp(false);
    } catch (error) {
      setNotice(formatErrorMessage(error));
    } finally {
      setIsImportingPublicData(false);
    }
  }

  const statusContent = bootstrapStatus === 'loading' ? (
    <section className="card-block status-card">
      <strong>대전 코스를 불러오는 중이에요.</strong>
      <p>지금 지도, 코스, 후기, 스탬프 상태를 함께 준비하고 있어요.</p>
    </section>
  ) : null;

  const errorContent = bootstrapStatus === 'error' ? (
    <section className="card-block status-card status-card--error">
      <strong>데이터 연결에 실패했어요.</strong>
      <p>{bootstrapError}</p>
      <button className="secondary-button" type="button" onClick={() => void loadApp(true)}>
        다시 시도
      </button>
    </section>
  ) : null;

  return (
    <div className="app-shell">
      <div className="aurora aurora-left" />
      <div className="aurora aurora-right" />
      <div className="phone-shell">
        <main className="content">
          {activeTab === 'explore' && (
        <header className="top-card">
          <div className="top-card__copy">
            <p className="eyebrow">DAEJEON JAM ISSUE</p>
            <h1>
              <span>대전을 고르는</span>
              <span>한입 여행 가이드</span>
            </h1>
            <p className="top-card__subtitle">빵처럼 고르고, 잼처럼 기억되는 대전 코스를 모바일 한 화면에 담았어요.</p>
          </div>
          <div className="hero-badge-grid">
            <div className="hero-badge hero-badge--primary">
              <span>{sessionUser ? `${sessionUser.nickname}님과 함께` : '오늘의 픽'}</span>
              <strong>{selectedPlace?.heroLabel ?? '대전 한입 코스'}</strong>
            </div>
            <div className="hero-badge">
              <span>{selectedPlace ? selectedPlace.district : '대전 전역'}</span>
              <strong>{selectedPlace ? selectedPlace.name : '터치로 고르는 동선'}</strong>
            </div>
          </div>
        </header>

          )}
          {notice && <section className="card-block notice-banner">{notice}</section>}
          {statusContent}
          {errorContent}

          {!hasRealData && bootstrapStatus === 'ready' && (
            <section className="card-block empty-state">
              <strong>아직 공개된 장소 데이터가 없어요.</strong>
              <p>관리자 계정으로 공공 데이터 가져오기를 누르면 지도와 코스가 채워져요.</p>
            </section>
          )}

          {activeTab === 'explore' && selectedPlace && (
            <>
              <section className="card-block">
                <div className="section-title-row">
                  <div>
                    <p className="eyebrow">CATEGORY</p>
                    <h3>취향으로 빠르게 고르기</h3>
                  </div>
                  <span className="counter-pill">{filteredPlaces.length} spots</span>
                </div>
                <div className="chip-row">
                  {categoryItems.map((item) => (
                    <button key={item.key} type="button" className={item.key === activeCategory ? 'chip is-active' : 'chip'} onClick={() => setActiveCategory(item.key)}>
                      {item.label}
                    </button>
                  ))}
                </div>
              </section>

              <section className="map-card-block">
                <div className="section-title-row section-title-row--tight">
                  <div>
                    <p className="eyebrow">DAEJEON MAP</p>
                    <h3>대전만 단순하게 보기</h3>
                  </div>
                  <span className="counter-pill">대전 한정</span>
                </div>
                <NaverMap places={filteredPlaces} selectedPlaceId={selectedPlace.id} onSelectPlace={setSelectedPlaceId} />
              </section>

              <section className="card-block preview-card">
                <div>
                  <div className="preview-card__meta">
                    <span>{selectedPlace.district}</span>
                    <span>{selectedPlace.visitTime}</span>
                  </div>
                  <h3>{selectedPlace.name}</h3>
                  <p>{selectedPlace.description}</p>
                  <div className="chip-row compact-gap">
                    {selectedPlace.vibeTags.map((tag) => (
                      <span key={tag} className="soft-tag">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="preview-card__actions">
                  <button type="button" className="secondary-button" onClick={() => setActiveTab('course')}>
                    코스에서 보기
                  </button>
                  <button type="button" className="primary-button" onClick={() => setDetailPlaceId(selectedPlace.id)}>
                    후기 / 댓글 보기
                  </button>
                </div>
              </section>

              <section className="card-block compact-list-card">
                <div className="section-title-row section-title-row--tight">
                  <div>
                    <p className="eyebrow">PREVIEW FEED</p>
                    <h3>이 장소의 최근 후기</h3>
                  </div>
                  <span className="counter-pill">{selectedPlaceReviews.length}개 후기</span>
                </div>
                {selectedPlaceReviews.slice(0, 2).map((review) => (
                  <article key={review.id} className="mini-review-card">
                    <div>
                      <strong>{review.author}</strong>
                      <p>{review.body}</p>
                    </div>
                    <span className="mood-pill">{review.mood}</span>
                  </article>
                ))}
                {selectedPlaceReviews.length === 0 && <p className="empty-copy">아직 후기가 없어요. 첫 방문 기록을 남겨 보세요.</p>}
              </section>
            </>
          )}

          {activeTab === 'course' && (
            <>
              <section className="card-block hero-panel hero-panel--compact">
                <div>
                  <p className="eyebrow">COURSE</p>
                  <h2>기분에 맞는 잼 코스</h2>
                  <p>스크롤보다 선택을 줄이기 위해 무드별로 바로 나눠 뒀어요.</p>
                </div>
              </section>
              <section className="card-block">
                <div className="course-filter-grid">
                  {moodItems.map((item) => (
                    <button key={item} type="button" className={item === activeMood ? 'chip is-active' : 'chip'} onClick={() => setActiveMood(item)}>
                      {item}
                    </button>
                  ))}
                </div>
              </section>
              {visibleCourses.map((course) => (
                <section key={course.id} className="card-block course-card">
                  <div className="section-title-row section-title-row--tight course-card__header">
                    <div className="course-card__title">
                      <p className="eyebrow">{course.mood}</p>
                      <h3>{course.title}</h3>
                    </div>
                    <span className="counter-pill course-card__duration">{course.duration}</span>
                  </div>
                  <p>{course.note}</p>
                  <div className="course-card__places">
                    {course.placeIds.map((placeId) => {
                      const place = places.find((item) => item.id === placeId);
                      if (!place) {
                        return null;
                      }
                      return (
                        <button
                          key={place.id}
                          type="button"
                          className="soft-tag soft-tag--button course-card__place"
                          onClick={() => {
                            setSelectedPlaceId(place.id);
                            setActiveTab('explore');
                            setDetailPlaceId(place.id);
                          }}
                        >
                          {place.name}
                        </button>
                      );
                    })}
                  </div>
                </section>
              ))}
            </>
          )}

          {activeTab === 'stamp' && (
            <>
              <section className="card-block hero-panel hero-panel--compact">
                <div>
                  <p className="eyebrow">STAMP</p>
                  <h2>근처에 도착하면 열려요</h2>
                  <p>스탬프는 현장 반경 안에 들어왔을 때만 활성화돼요.</p>
                </div>
                <div className="stamp-hero-actions">
                  <div className="stamp-rate-badge">{stampRate}%</div>
                  <button
                    type="button"
                    className="secondary-button stamp-refresh-button"
                    onClick={() => void refreshStampLocation(true)}
                    disabled={!sessionUser || stampLocationStatus === 'loading'}
                  >
                    {stampLocationStatus === 'loading' ? '위치 확인 중' : '현재 위치 다시 확인'}
                  </button>
                </div>
              </section>
              <section className="card-block stamp-location-card">
                <strong>
                  {!sessionUser
                    ? '로그인 후 현장 스탬프가 열려요.'
                    : stampLocationStatus === 'ready'
                      ? '근처 도착 여부를 확인했어요.'
                      : stampLocationStatus === 'loading'
                        ? '현재 위치를 확인하고 있어요.'
                        : '현장 반경을 먼저 확인해 주세요.'}
                </strong>
                <p>{stampLocationMessage ?? `반경 ${STAMP_UNLOCK_RADIUS_METERS}m 안에 들어오면 스탬프 버튼이 열려요.`}</p>
              </section>
              <section className="card-block stamp-summary-grid">
                <article><strong>{collectedStampIds.length}</strong><span>모은 스탬프</span></article>
                <article><strong>{places.length}</strong><span>전체 장소</span></article>
                <article><strong>{Math.max(places.length - collectedStampIds.length, 0)}</strong><span>남은 장소</span></article>
              </section>
              {places.map((place) => {
                const isCollected = collectedStampIds.includes(place.id);
                const distanceMeters = stampDistanceByPlaceId.get(place.id);
                const isNearby = typeof distanceMeters === "number" && distanceMeters <= STAMP_UNLOCK_RADIUS_METERS;
                const isLocked = !isCollected && (!sessionUser || stampLocationStatus !== 'ready' || !isNearby);
                const buttonLabel = stampUpdatingId === place.id
                  ? '적립 확인 중'
                  : isCollected
                    ? '적립 완료'
                    : !sessionUser
                      ? '로그인 후 활성화'
                      : stampLocationStatus === 'loading'
                        ? '거리 확인 중'
                        : stampLocationStatus !== 'ready' || typeof distanceMeters !== 'number'
                          ? '위치 확인 필요'
                          : isNearby
                            ? '현장 스탬프 찍기'
                            : '근처 도착 시 활성화';
                const distanceCopy = isCollected
                  ? '이미 적립한 스탬프예요.'
                  : typeof distanceMeters !== "number"
                    ? `반경 ${STAMP_UNLOCK_RADIUS_METERS}m 안에서 버튼이 열려요.`
                    : isNearby
                      ? `현재 약 ${formatDistanceMeters(distanceMeters)} 거리예요. 지금 적립할 수 있어요.`
                      : `현재 약 ${formatDistanceMeters(distanceMeters)} 거리예요. ${STAMP_UNLOCK_RADIUS_METERS}m 안에 들어오면 열려요.`;
                const buttonClassName = isCollected
                  ? 'secondary-button is-complete stamp-action-button'
                  : isLocked
                    ? 'secondary-button stamp-action-button is-locked'
                    : 'primary-button stamp-action-button';

                return (
                  <section key={place.id} className="card-block stamp-item">
                    <div className="stamp-item__body">
                      <p className="eyebrow">{place.stampReward}</p>
                      <h3>{place.name}</h3>
                      <p>{place.routeHint}</p>
                      <p className="stamp-item__distance">{distanceCopy}</p>
                    </div>
                    <button
                      type="button"
                      className={buttonClassName}
                      onClick={() => void handleCollectStamp(place)}
                      disabled={isCollected || isLocked || stampUpdatingId === place.id}
                    >
                      {buttonLabel}
                    </button>
                  </section>
                );
              })}
            </>
          )}

          {activeTab === 'my' && (
            <>
              <section className="card-block hero-panel hero-panel--compact">
                <div>
                  <p className="eyebrow">MY PAGE</p>
                  <h2>{sessionUser ? `${sessionUser.nickname}님의 여행 기록` : '로그인하고 기록 이어보기'}</h2>
                  <p>{sessionUser ? '후기와 스탬프를 계정 기준으로 저장하고, 운영 화면도 이 탭에서 함께 볼 수 있어요.' : '네이버 로그인을 연결하면 후기와 스탬프가 계정 기준으로 이어져요.'}</p>
                </div>
                {sessionUser && (
                  <button type="button" className="secondary-button" onClick={() => void handleLogout()} disabled={isLoggingOut}>
                    {isLoggingOut ? '정리 중...' : '로그아웃'}
                  </button>
                )}
              </section>

              {!sessionUser && (
                <section className="card-block compact-list-card">
                  <div className="section-title-row section-title-row--tight">
                    <div>
                      <p className="eyebrow">LOGIN</p>
                      <h3>네이버로 여행 기록 이어보기</h3>
                    </div>
                  </div>
                  <p className="empty-copy">후기, 스탬프, 마이페이지 기록을 계정 기준으로 묶어 둘 수 있어요.</p>
                  <ProviderButtons providers={providers} onLogin={startProviderLogin} />
                </section>
              )}

              {sessionUser && myPage && (
                <>
                  <section className="card-block account-summary-grid">
                    <article><strong>{myPage.stats.stampCount}</strong><span>모은 스탬프</span></article>
                    <article><strong>{myPage.stats.reviewCount}</strong><span>내 후기</span></article>
                    <article><strong>{sessionUser.provider}</strong><span>연결 계정</span></article>
                  </section>

                  <section className="card-block compact-list-card">
                    <div className="section-title-row section-title-row--tight">
                      <div>
                        <p className="eyebrow">MY REVIEWS</p>
                        <h3>내가 남긴 후기</h3>
                      </div>
                    </div>
                    {myPage.reviews.map((review) => (
                      <article key={review.id} className="mini-review-card">
                        <div>
                          <strong>{review.placeName}</strong>
                          <p>{review.body}</p>
                        </div>
                        <span className="mood-pill">{review.mood}</span>
                      </article>
                    ))}
                    {myPage.reviews.length === 0 && <p className="empty-copy">아직 남긴 후기가 없어요.</p>}
                  </section>

                  <section className="card-block compact-list-card">
                    <div className="section-title-row section-title-row--tight">
                      <div>
                        <p className="eyebrow">MY STAMPS</p>
                        <h3>내가 모은 장소</h3>
                      </div>
                    </div>
                    {myPage.collectedPlaces.map((place) => (
                      <article key={place.id} className="mini-review-card">
                        <div>
                          <strong>{place.name}</strong>
                          <p>{place.stampReward}</p>
                        </div>
                        <button
                          type="button"
                          className="text-button"
                          onClick={() => {
                            setSelectedPlaceId(place.id);
                            setActiveTab('explore');
                            setDetailPlaceId(place.id);
                          }}
                        >
                          열기
                        </button>
                      </article>
                    ))}
                    {myPage.collectedPlaces.length === 0 && <p className="empty-copy">아직 모은 스탬프가 없어요.</p>}
                  </section>
                </>
              )}

              {sessionUser?.isAdmin && (
                <AdminPanel
                  summary={adminSummary}
                  busyPlaceId={adminUpdatingPlaceId}
                  isImporting={isImportingPublicData}
                  onRefreshImport={handleImportPublicData}
                  onTogglePlace={handleTogglePlace}
                />
              )}
            </>
          )}
        </main>

        <BottomNav activeTab={activeTab} onChange={setActiveTab} />
      </div>

      <PlaceDetailSheet
        place={detailPlace}
        reviews={detailReviews}
        isOpen={Boolean(detailPlace)}
        canWrite={Boolean(sessionUser)}
        isStampCollected={detailPlace ? collectedStampIds.includes(detailPlace.id) : false}
        isStampBusy={detailPlace ? stampUpdatingId === detailPlace.id : false}
        reviewError={reviewError}
        reviewSubmitting={reviewSubmitting}
        commentSubmittingReviewId={commentSubmittingReviewId}
        onClose={() => setDetailPlaceId(null)}
        onRequestLogin={() => setActiveTab('my')}
        onCollectStamp={handleCollectStamp}
        onCreateReview={handleCreateReview}
        onCreateComment={handleCreateComment}
      />
    </div>
  );
}

export default App;
