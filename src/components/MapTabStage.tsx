import { categoryInfo, categoryItems } from '../lib/categories';
import { FestivalDetailSheet } from './FestivalDetailSheet';
import { NaverMap } from './NaverMap';
import { PlaceDetailSheet } from './PlaceDetailSheet';
import type {
  ApiStatus,
  BootstrapResponse,
  Category,
  DrawerState,
  FestivalItem,
  Place,
  ReviewMood,
  SessionUser,
} from '../types';

interface MapTabStageProps {
  // UI 상태
  activeCategory: Category; // 현재 선택된 카테고리 필터 (모든음식/카페/전시 등)
  setActiveCategory: (category: Category) => void;
  notice: string | null; // 임시 공지사항 (배너에 표시)
  drawerState: DrawerState; // 하단 시트 상태 ('closed' | 'partial' | 'full')
  
  // 부트스트랩 데이터: 초기 로딩 상태
  bootstrapStatus: ApiStatus; // 'idle' | 'loading' | 'success' | 'error'
  bootstrapError: string | null;
  filteredPlaces: Place[]; // activeCategory 기준 필터된 장소 목록
  festivals: FestivalItem[]; // 축제 목록
  
  // 위치 및 지도 상태
  currentPosition: { latitude: number; longitude: number } | null; // GPS 좌표 (watchPosition)
  mapLocationStatus: ApiStatus; // 위치 조회 상태 (정확도 표시용)
  mapLocationMessage: string | null; // 위치 조회 메시지
  mapLocationFocusKey: number; // 위치 변경 사이클 (지도 포커싱 트리거)
  
  // 선택된 장소/축제 및 상세 정보
  selectedPlace: Place | null;
  selectedFestival: FestivalItem | null;
  selectedPlaceReviews: BootstrapResponse['reviews']; // 선택 장소의 모든 후기 목록
  visitCount: number; // 현재 사용자의 선택 장소 방문 횟수
  latestStamp: BootstrapResponse['stamps']['logs'][number] | null; // 가장 최근 스탐프
  todayStamp: BootstrapResponse['stamps']['logs'][number] | null; // 오늘 같은 장소 스탐프 (중복 방지용)
  
  // 스탐프 및 리뷰 작업 상태
  stampActionStatus: ApiStatus; // 스탐프 획득/삭제 요청 상태
  stampActionMessage: string; // 거리 초과 등 피드백 메시지
  reviewProofMessage: string; // "스탐프를 먼저 획득해주세요" 등
  reviewError: string | null; // 후기 작성 오류
  reviewSubmitting: boolean; // 후기 제출 중
  reviewLikeUpdatingId: string | null; // 좋아요 요청 중인 리뷰 ID
  commentSubmittingReviewId: string | null; // 댓글 요청 중인 리뷰 ID
  canCreateReview: boolean; // 로그인 여부 + 스탐프 확보 여부
  
  // 사용자 상태
  sessionUser: SessionUser | null;
  
  // 콜백 함수들
  onOpenPlace: (placeId: string) => void; // 지도 마커 클릭→ URL 라우팅
  onOpenFestival: (festivalId: string) => void;
  onCloseDrawer: () => void; // 하단 시트 닫기
  onExpandPlaceDrawer: () => void; // 시트 전개 (높이 확대)
  onCollapsePlaceDrawer: () => void; // 시트 축소 (높이 축소)
  onExpandFestivalDrawer: () => void;
  onCollapseFestivalDrawer: () => void;
  onRequestLogin: () => void; // "로그인" 버튼 클릭
  onClaimStamp: (place: Place) => Promise<void>; // "스탐프 받기" 버튼 (거리, 중복 체크 후 API 호출)
  onCreateReview: (payload: { stampId: string; body: string; mood: ReviewMood; file: File | null }) => Promise<void>;
  onToggleReviewLike: (reviewId: string) => Promise<void>;
  onCreateComment: (reviewId: string, body: string, parentId?: string) => Promise<void>;
  onLocateCurrentPosition: () => void; // "현재 위치 찾기" 버튼
}

export function MapTabStage({
  activeCategory,
  setActiveCategory,
  notice,
  bootstrapStatus,
  bootstrapError,
  filteredPlaces,
  festivals,
  selectedPlace,
  selectedFestival,
  currentPosition,
  mapLocationStatus,
  mapLocationMessage,
  mapLocationFocusKey,
  drawerState,
  sessionUser,
  selectedPlaceReviews,
  visitCount,
  latestStamp,
  todayStamp,
  stampActionStatus,
  stampActionMessage,
  reviewProofMessage,
  reviewError,
  reviewSubmitting,
  reviewLikeUpdatingId,
  commentSubmittingReviewId,
  canCreateReview,
  onOpenPlace,
  onOpenFestival,
  onCloseDrawer,
  onExpandPlaceDrawer,
  onCollapsePlaceDrawer,
  onExpandFestivalDrawer,
  onCollapseFestivalDrawer,
  onRequestLogin,
  onClaimStamp,
  onCreateReview,
  onToggleReviewLike,
  onCreateComment,
  onLocateCurrentPosition,
}: MapTabStageProps) {
  return (
    <div className="map-stage">
      <header className="map-stage__header">
        <div className="map-stage__brand">
          <p className="eyebrow">DAEJEON JAM ISSUE</p>
          <p className="map-stage__headline">꽃 마커로 장소와 축제를 가볍게 골라보세요.</p>
        </div>
        <div className="map-stage__guide">
          <strong>아래 시트에서 확인</strong>
          <span>마커를 누르면 장소 정보와 스탬프가 바로 열려요.</span>
        </div>
      </header>

      <div className="map-filter-strip">
        <div className="chip-row compact-gap">
          {categoryItems.map((item) => {
            const isActive = item.key === activeCategory;
            const info = item.key === 'all' ? null : categoryInfo[item.key];

            return (
              <button
                key={item.key}
                type="button"
                className={isActive ? 'chip is-active map-filter-chip' : 'chip map-filter-chip'}
                onClick={() => setActiveCategory(item.key)}
                style={
                  info
                    ? {
                        background: isActive ? info.color : 'rgba(255,255,255,0.94)',
                        borderColor: info.jamColor,
                        color: '#4a3140',
                      }
                    : undefined
                }
              >
                {info ? `${info.icon} ${item.label}` : item.label}
              </button>
            );
          })}
        </div>
      </div>

      {notice && <div className="floating-notice">{notice}</div>}
      {bootstrapStatus === 'loading' && <section className="floating-status">대전 장소와 축제를 불러오고 있어요.</section>}
      {bootstrapStatus === 'error' && <section className="floating-status floating-status--error">{bootstrapError}</section>}

      <NaverMap
        places={filteredPlaces}
        festivals={festivals}
        selectedPlaceId={selectedPlace?.id ?? null}
        selectedFestivalId={selectedFestival?.id ?? null}
        onSelectPlace={onOpenPlace}
        onSelectFestival={onOpenFestival}
        currentPosition={currentPosition}
        currentLocationStatus={mapLocationStatus}
        currentLocationMessage={drawerState === 'closed' ? mapLocationMessage : null}
        focusCurrentLocationKey={mapLocationFocusKey}
        onLocateCurrentPosition={onLocateCurrentPosition}
        height="100%"
      />

      {!selectedPlace && !selectedFestival && (
        <section className="map-drawer-teaser">
          <span className="map-drawer-teaser__handle" aria-hidden="true" />
          <div>
            <strong>아래 시트에서 상세를 확인해요</strong>
            <p>지도 마커를 누르면 장소 정보, 현장 스탬프, 축제 안내가 아래에서 바로 열립니다.</p>
          </div>
        </section>
      )}

      <PlaceDetailSheet
        place={selectedPlace}
        reviews={selectedPlaceReviews}
        isOpen={Boolean(selectedPlace) && drawerState !== 'closed'}
        drawerState={drawerState}
        loggedIn={Boolean(sessionUser)}
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
        onClose={onCloseDrawer}
        onExpand={onExpandPlaceDrawer}
        onCollapse={onCollapsePlaceDrawer}
        onRequestLogin={onRequestLogin}
        onClaimStamp={onClaimStamp}
        onCreateReview={onCreateReview}
        onToggleReviewLike={onToggleReviewLike}
        onCreateComment={onCreateComment}
      />

      <FestivalDetailSheet
        festival={selectedFestival}
        isOpen={Boolean(selectedFestival) && drawerState !== 'closed'}
        drawerState={drawerState}
        onClose={onCloseDrawer}
        onExpand={onExpandFestivalDrawer}
        onCollapse={onCollapseFestivalDrawer}
      />
    </div>
  );
}
