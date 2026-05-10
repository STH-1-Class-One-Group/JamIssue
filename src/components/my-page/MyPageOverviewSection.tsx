import type { Place } from '../../types/core';
import type { TravelSession } from '../../types/review';

type MyPageOverviewSectionProps = {
  uniquePlaceCount: number;
  totalPlaceCount: number;
  stampCount: number;
  visitPct: number;
  visitedPlaces: Place[];
  unvisitedPlaces: Place[];
  showVisitedDetail: boolean;
  onToggleVisitedDetail: () => void;
  onOpenPlace: (placeId: string) => void;
  travelSessions: TravelSession[];
};

export function MyPageOverviewSection({
  uniquePlaceCount,
  totalPlaceCount,
  stampCount,
  visitPct,
  visitedPlaces,
  unvisitedPlaces,
  showVisitedDetail,
  onToggleVisitedDetail,
  onOpenPlace,
  travelSessions,
}: MyPageOverviewSectionProps) {
  return (
    <section className="sheet-card stack-gap">
      <div className="my-stats-grid">
        <article>
          <strong>{uniquePlaceCount}/{totalPlaceCount}</strong>
          <span>방문한 고유 명소</span>
        </article>
        <article>
          <strong>{stampCount}</strong>
          <span>누적 스탬프 수</span>
        </article>
        <article>
          <strong>{travelSessions.length}</strong>
          <span>여행 세션 수</span>
        </article>
      </div>
      {totalPlaceCount > 0 && (
        <div className="my-visit-progress">
          <div className="my-visit-progress__bar">
            <div className="my-visit-progress__fill" style={{ width: `${visitPct}%` }} />
          </div>
          <span className="my-visit-progress__label">{visitPct}% 달성</span>
        </div>
      )}
      <button type="button" className="secondary-button" onClick={onToggleVisitedDetail}>
        {showVisitedDetail ? '방문 상세 닫기' : '방문 상세 보기'}
      </button>
      {showVisitedDetail && (
        <div className="my-visited-grid">
          <div>
            <div className="my-visited-section-header">
              <strong>가본 곳</strong>
              <span className="counter-pill">{visitedPlaces.length}곳</span>
            </div>
            <div className="chip-row compact-gap">
              {visitedPlaces.map((place) => (
                <button key={place.id} type="button" className="soft-tag soft-tag--button" onClick={() => onOpenPlace(place.id)}>
                  {place.name}
                </button>
              ))}
              {visitedPlaces.length === 0 && <p className="empty-copy">아직 방문한 곳이 없어요.</p>}
            </div>
          </div>
          <div>
            <div className="my-visited-section-header">
              <strong>아직 못 가본 곳</strong>
              <span className="counter-pill counter-pill--muted">{unvisitedPlaces.length}곳</span>
            </div>
            <div className="chip-row compact-gap">
              {unvisitedPlaces.map((place) => (
                <button key={place.id} type="button" className="soft-tag soft-tag--button is-muted" onClick={() => onOpenPlace(place.id)}>
                  {place.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

