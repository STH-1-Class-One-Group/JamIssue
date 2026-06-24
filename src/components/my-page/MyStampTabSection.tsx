import type { MyPageResponse } from '../../types/my-page';
import { ActivityCollectionShell } from '../my-page-activity-view/ActivityCollectionShell';
import { normalizeActivityDateKey } from '../my-page-activity-view/activityDate';
import type { ActivityEntry, ActivityViewMode } from '../my-page-activity-view/activityViewTypes';

type StampLog = NonNullable<MyPageResponse>['stampLogs'][number];
type TravelSession = NonNullable<MyPageResponse>['travelSessions'][number];

interface MyStampTabSectionProps {
  stampLogs: StampLog[];
  travelSessions: TravelSession[];
  viewMode: ActivityViewMode;
  onOpenPlace: (placeId: string) => void;
  onOpenRoutes: () => void;
  onViewModeChange: (mode: ActivityViewMode) => void;
}

export function MyStampTabSection({
  stampLogs,
  travelSessions,
  viewMode,
  onOpenPlace,
  onOpenRoutes,
  onViewModeChange,
}: MyStampTabSectionProps) {
  const unpublishedSessions = travelSessions.filter((session) => session.canPublish && !session.publishedRouteId);
  const entries: ActivityEntry[] = stampLogs.map((stampLog) => ({
    id: stampLog.id,
    kind: 'stamp',
    dateKey: normalizeActivityDateKey(stampLog.stampedDate ?? stampLog.stampedAt),
    title: stampLog.placeName,
    meta: stampLog.stampedAt,
    renderListItem: () => (
      <article className="review-card review-card--stamp-log">
        <div className="review-card__top review-card__top--feed review-card__top--stamp-log">
          <div className="review-card__title-block review-card__title-block--feed">
            <p className="eyebrow">STAMP LOG</p>
            <strong className="review-card__title">{stampLog.placeName}</strong>
            <p className="review-card__author-line">획득 / {stampLog.stampedAt}</p>
          </div>
          <button type="button" className="review-link-button review-link-button--inline" onClick={() => onOpenPlace(stampLog.placeId)}>
            이 장소 보기
          </button>
        </div>
        <div className="review-card__tag-row">
          <span className="review-card__visit-pill">{stampLog.visitLabel}</span>
          {stampLog.isToday ? <span className="soft-tag is-complete">오늘</span> : null}
          {stampLog.travelSessionId && stampLog.travelSessionStampCount >= 2 ? <span className="soft-tag">여행 세션 연결</span> : null}
        </div>
      </article>
    ),
  }));

  return (
    <div className="stack-gap">
      {unpublishedSessions.length > 0 && (
        <article className="sheet-card stack-gap">
          <div className="section-title-row section-title-row--tight">
            <div>
              <p className="eyebrow">READY TO PUBLISH</p>
              <h3>코스로 발행할 수 있는 여정이 있어요</h3>
            </div>
            <span className="counter-pill">{unpublishedSessions.length}개</span>
          </div>
          <p className="section-copy">24시간 안에 이어진 스탬프 기록을 공개 코스로 발행해 보세요.</p>
          <button type="button" className="primary-button route-submit-button" onClick={onOpenRoutes}>
            코스 발행하러 가기
          </button>
        </article>
      )}

      <ActivityCollectionShell
        entries={entries}
        emptyState={<p className="empty-copy">아직 찍은 스탬프가 없어요.</p>}
        mode={viewMode}
        onModeChange={onViewModeChange}
      />
    </div>
  );
}
