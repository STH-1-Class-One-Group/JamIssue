import { useRef } from 'react';
import { categoryInfo } from '../lib/categories';
import { ReviewComposer } from './ReviewComposer';
import { ReviewList } from './ReviewList';
import type { ApiStatus, DrawerState, Place, Review, ReviewMood, StampLog } from '../types';

interface PlaceDetailSheetProps {
  // 선택된 장소 정보
  place: Place | null; // null이면 시트 닫혀있음
  reviews: Review[]; // 선택 장소의 모든 후기 (여행 리포트)
  
  // 시트 상태
  isOpen: boolean; // 장소 선택했는지 (place !== null과 동일해야함)
  drawerState: DrawerState; // 'closed' | 'partial' | 'full' (높이)
  
  // 사용자 및 스탐프 상태
  loggedIn: boolean; // sessionUser !== null
  visitCount: number; // 현재 사용자의 이 장소 누적 방문 횟수
  latestStamp: StampLog | null; // 가장 최근 스탐프 정보 (시간 표시용: "1시간 전")
  todayStamp: StampLog | null; // 오늘 이 장소에서 받은 스탐프 (중복 획득 방지)
  
  // 스탐프 획득 상태
  stampActionStatus: ApiStatus; // 스탐프 요청 로딩/에러
  stampActionMessage: string; // "반경 120m 안에서만 받을 수 있어요" 등
  reviewProofMessage: string; // "스탐프를 먼저 획득해주세요"
  
  // 후기 작성 상태
  reviewError: string | null;
  reviewSubmitting: boolean; // 이미지 업로드 또는 API 호출 중
  reviewLikeUpdatingId: string | null; // 좋아요 토글 중인 리뷰 ID
  commentSubmittingReviewId: string | null; // 댓글 제출 중인 리뷰 ID
  canCreateReview: boolean; // loggedIn && (todayStamp !== null || latestStamp?.placeId === place.id)
  
  // 콜백
  onClose: () => void; // 시트 닫기 (place = null)
  onExpand: () => void; // 시트 최대화
  onCollapse: () => void; // 시트 최소화 (부분 전개)
  onRequestLogin: () => void; // "로그인" 버튼
  onClaimStamp: (place: Place) => Promise<void>; // "스탐프 받기" (거리 재검증 후 toggle_stamp 호출)
  onCreateReview: (payload: { stampId: string; body: string; mood: ReviewMood; file: File | null }) => Promise<void>; // 후기 제출
  onToggleReviewLike: (reviewId: string) => Promise<void>; // 좋아요 토글
  onCreateComment: (reviewId: string, body: string, parentId?: string) => Promise<void>; // 댓글/답글 추가
}

export function PlaceDetailSheet({
  place,
  reviews,
  isOpen,
  drawerState,
  loggedIn,
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
  onClose,
  onExpand,
  onCollapse,
  onRequestLogin,
  onClaimStamp,
  onCreateReview,
  onToggleReviewLike,
  onCreateComment,
}: PlaceDetailSheetProps) {
  const dragStartYRef = useRef<number | null>(null);

  if (!place || !isOpen) {
    return null;
  }

  function handlePointerDown(event: React.PointerEvent<HTMLButtonElement>) {
    dragStartYRef.current = event.clientY;
  }

  function handlePointerUp(event: React.PointerEvent<HTMLButtonElement>) {
    if (dragStartYRef.current === null) {
      return;
    }
    const delta = event.clientY - dragStartYRef.current;
    dragStartYRef.current = null;
    if (delta > 72) {
      if (drawerState === 'full') {
        onCollapse();
        return;
      }
      onClose();
      return;
    }
    if (delta < -48) {
      onExpand();
    }
  }

  const sheetClassName = `place-drawer place-drawer--${drawerState}`;
  const visitLabel = latestStamp ? latestStamp.visitLabel : '첫 방문 대기';
  const canClaimStamp = loggedIn && !todayStamp;
  const categoryMeta = categoryInfo[place.category];

  return (
    <section className={sheetClassName} aria-label="장소 상세 드로워">
      <button
        type="button"
        className="place-drawer__handle"
        aria-label="드로워 높이 조절"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onClick={drawerState === 'partial' ? onExpand : onCollapse}
      >
        <span />
      </button>

      <div className="place-drawer__content">
        <div className="place-drawer__header">
          <div>
            <p className="eyebrow">PLACE</p>
            <h2>{place.name}</h2>
            <p className="place-drawer__summary">{place.summary}</p>
          </div>
          <button type="button" className="place-drawer__close" onClick={onClose} aria-label="닫기">
            ×
          </button>
        </div>

        <div className="place-drawer__badges">
          <span className="counter-pill" style={{ background: categoryMeta.color, color: '#4a3140' }}>
            {categoryMeta.icon} {categoryMeta.name}
          </span>
          <span className="counter-pill">{place.district}</span>
          <span className="counter-pill">{visitLabel}</span>
          <span className="counter-pill">누적 방문 {visitCount}회</span>
        </div>

        <div className="sheet-card place-drawer__proof-card">
          <div className="place-drawer__proof-copy">
            <strong>현장 스탬프</strong>
            <p>{stampActionMessage}</p>
          </div>
          <div className="place-drawer__proof-action">
            {!loggedIn ? (
              <>
                <span className="place-drawer__proof-kicker">피드와 코스 시작</span>
                <button type="button" className="primary-button place-drawer__proof-button" onClick={onRequestLogin}>
                  로그인하고 시작
                </button>
              </>
            ) : (
              <button
                type="button"
                className={todayStamp ? 'secondary-button is-complete place-drawer__proof-button' : 'primary-button place-drawer__proof-button'}
                onClick={() => void onClaimStamp(place)}
                disabled={!canClaimStamp || stampActionStatus === 'loading'}
              >
                {todayStamp
                  ? `${todayStamp.visitLabel} 완료`
                  : stampActionStatus === 'loading'
                    ? '확인 중'
                    : '오늘 스탬프 찍기'}
              </button>
            )}
          </div>
        </div>

        <div className="sheet-card route-hint-box">
          <strong>이동 힌트</strong>
          <p>{place.routeHint}</p>
        </div>

        <ReviewComposer
          placeName={place.name}
          loggedIn={loggedIn}
          canSubmit={canCreateReview}
          submitting={reviewSubmitting}
          errorMessage={reviewError}
          proofMessage={reviewProofMessage}
          onSubmit={({ body, mood, file }) => {
            if (!todayStamp) {
              return Promise.resolve();
            }
            return onCreateReview({
              stampId: todayStamp.id,
              body,
              mood,
              file,
            });
          }}
          onRequestLogin={onRequestLogin}
          onRequestProof={() => {
            if (!loggedIn) {
              onRequestLogin();
              return;
            }
            if (!todayStamp) {
              void onClaimStamp(place);
            }
          }}
        />

        <div className="section-title-row section-title-row--tight">
          <div>
            <p className="eyebrow">PLACE FEED</p>
            <h3>이 장소의 피드</h3>
          </div>
          <span className="counter-pill">{reviews.length}개</span>
        </div>
        <ReviewList
          reviews={reviews}
          canWriteComment={loggedIn}
          canToggleLike={loggedIn}
          likingReviewId={reviewLikeUpdatingId}
          submittingReviewId={commentSubmittingReviewId}
          onToggleLike={onToggleReviewLike}
          onSubmitComment={onCreateComment}
          onRequestLogin={onRequestLogin}
          emptyTitle="이 장소는 아직 첫 피드를 기다리고 있어요"
          emptyBody="현장 스탬프를 찍은 다음, 지금 분위기를 짧게 남겨 보세요."
        />
      </div>
    </section>
  );
}


