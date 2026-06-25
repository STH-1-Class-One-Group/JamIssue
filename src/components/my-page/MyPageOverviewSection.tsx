import type { Place } from '../../types/core';
import type { TravelSession } from '../../types/review';
import { ActionButton, AppSurface, FilterChip, MetricTile, SectionHeader } from '../ui-kit';

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
    <AppSurface className="my-page-overview" variant="section">
      <div className="my-stats-grid">
        <MetricTile value={`${uniquePlaceCount}/${totalPlaceCount}`} label="방문한 고유 명소" />
        <MetricTile value={stampCount} label="누적 스탬프 수" />
        <MetricTile value={travelSessions.length} label="여행 세션 수" />
      </div>
      {totalPlaceCount > 0 && (
        <div className="my-visit-progress">
          <div className="my-visit-progress__bar">
            <div className="my-visit-progress__fill" style={{ width: `${visitPct}%` }} />
          </div>
          <span className="my-visit-progress__label">{visitPct}% 달성</span>
        </div>
      )}
      <ActionButton variant="secondary" onClick={onToggleVisitedDetail}>
        {showVisitedDetail ? '방문 상세 닫기' : '방문 상세 보기'}
      </ActionButton>
      {showVisitedDetail && (
        <div className="my-visited-grid">
          <div>
            <SectionHeader
              eyebrow="VISITED"
              title="가본 곳"
              actions={
                <FilterChip selected count={`${visitedPlaces.length}곳`}>
                  방문
                </FilterChip>
              }
            />
            <div className="chip-row compact-gap">
              {visitedPlaces.map((place) => (
                <FilterChip key={place.id} onClick={() => onOpenPlace(place.id)}>
                  {place.name}
                </FilterChip>
              ))}
              {visitedPlaces.length === 0 && <p className="empty-copy">아직 방문한 곳이 없어요.</p>}
            </div>
          </div>
          <div>
            <SectionHeader
              eyebrow="UNVISITED"
              title="아직 못 가본 곳"
              actions={<FilterChip count={`${unvisitedPlaces.length}곳`}>남음</FilterChip>}
            />
            <div className="chip-row compact-gap">
              {unvisitedPlaces.map((place) => (
                <FilterChip key={place.id} onClick={() => onOpenPlace(place.id)}>
                  {place.name}
                </FilterChip>
              ))}
            </div>
          </div>
        </div>
      )}
    </AppSurface>
  );
}
