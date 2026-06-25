import { useScrollRestoration } from '../hooks/useScrollRestoration';
import type { FestivalItem } from '../types/core';
import { AppSurface, ContentCard, EmptyState, FilterChip, SectionHeader } from './ui-kit';

interface EventTabProps {
  festivals: FestivalItem[];
}

function formatFestivalPeriod(festival: FestivalItem) {
  if (!festival.startDate && !festival.endDate) {
    return '일정 정보가 아직 없어요.';
  }
  if (festival.startDate === festival.endDate) {
    return festival.startDate;
  }
  return `${festival.startDate} - ${festival.endDate}`;
}

function formatFestivalTitle(title: string) {
  return title
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[&_·•/|]+/g, ' ')
    .replace(/\s+-\s+/g, ' ')
    .replace(/\s+[A-Z][A-Z0-9-]{2,}$/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function getFestivalLocationLines(festival: FestivalItem) {
  const venueName = festival.venueName?.trim() || null;
  const roadAddress = festival.roadAddress?.trim() || null;

  if (!venueName && !roadAddress) {
    return ['개최 장소 정보가 아직 없어요.'];
  }

  if (venueName && roadAddress && venueName === roadAddress) {
    return [venueName];
  }

  return [venueName, roadAddress].filter((value): value is string => Boolean(value));
}

export function EventTab({ festivals }: EventTabProps) {
  const scrollRef = useScrollRestoration<HTMLElement>('event');

  return (
    <section ref={scrollRef} className="page-panel page-panel--scrollable" data-page-surface="event">
      <SectionHeader
        className="panel-header"
        eyebrow="EVENT"
        title="행사"
        description={
          <>
            대전에서 진행 중이거나 곧 열릴 행사를
            <br />
            한 번에 보고 빠르게 훑어볼 수 있어요.
          </>
        }
      />

      <AppSurface variant="section" className="event-list-surface sheet-card stack-gap">
        <SectionHeader
          className="section-title-row section-title-row--tight"
          eyebrow="DAEJEON FESTIVALS"
          title="지금 확인할 행사"
          actions={
            <FilterChip selected count={`${festivals.length}개`}>
              행사
            </FilterChip>
          }
        />

        {festivals.length === 0 ? (
          <EmptyState className="event-empty-state" title="현재 진행 중이거나 30일 이내 예정된 대전 행사가 없어요." />
        ) : (
          <div className="community-route-list festival-card-list">
            {festivals.map((festival) => {
              const locationLines = getFestivalLocationLines(festival);
              return (
                <ContentCard key={festival.id} className="festival-card" interactive>
                  <div className="festival-card__content">
                    <div className="festival-card__meta-row">
                      <span className="festival-card__date">{formatFestivalPeriod(festival)}</span>
                      {festival.isOngoing ? (
                        <FilterChip selected className="festival-card__status-chip">
                          진행 중
                        </FilterChip>
                      ) : null}
                    </div>

                    <h4 className="festival-card__title">{formatFestivalTitle(festival.title)}</h4>

                    <div className="festival-card__location">
                      {locationLines.map((line, index) => (
                        <p key={`${festival.id}-${index}`} className={index === 0 ? 'festival-card__location-primary' : 'festival-card__location-secondary'}>
                          {line}
                        </p>
                      ))}
                    </div>
                  </div>

                  {festival.homepageUrl ? (
                    <div className="festival-card__footer">
                      <a className="festival-card__link ui-action-button ui-action-button--secondary ui-action-button--sm" href={festival.homepageUrl} target="_blank" rel="noreferrer">
                        홈페이지 열기
                      </a>
                    </div>
                  ) : null}
                </ContentCard>
              );
            })}
          </div>
        )}
      </AppSurface>
    </section>
  );
}
