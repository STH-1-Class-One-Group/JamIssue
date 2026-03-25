import { useScrollRestoration } from '../hooks/useScrollRestoration';
import type { FestivalItem } from '../types';

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
    .replace(/\[([^\]]+)\]/g, '$1')
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
    <section ref={scrollRef} className="page-panel page-panel--scrollable">
      <header className="panel-header">
        <p className="eyebrow">EVENT</p>
        <h2>행사</h2>
        <p>대전에서 진행 중이거나 곧 열릴 행사를 한눈에 보고 확인할 수 있어요.</p>
      </header>

      <section className="sheet-card stack-gap">
        <div className="section-title-row section-title-row--tight">
          <div>
            <p className="eyebrow">DAEJEON FESTIVALS</p>
            <h3>지금 확인할 행사</h3>
          </div>
          <span className="counter-pill">{festivals.length}개</span>
        </div>

        {festivals.length === 0 ? (
          <p className="empty-copy">현재 진행 중이거나 30일 이내 예정된 대전 행사가 없어요.</p>
        ) : (
          <div className="community-route-list">
            {festivals.map((festival) => (
              <article key={festival.id} className="community-route-card community-route-card--curated festival-card">
                <div className="community-route-card__header community-route-card__header--feedlike">
                  <div className="community-route-card__title-block">
                    {festival.isOngoing ? (
                      <div className="community-route-card__tag-row">
                        <span className="soft-tag">진행 중</span>
                      </div>
                    ) : null}
                    <h4>{formatFestivalTitle(festival.title)}</h4>
                    <p className="community-route-meta community-route-meta--inline festival-card__period">{formatFestivalPeriod(festival)}</p>
                  </div>
                </div>

                <div className="festival-card__location">
                  {getFestivalLocationLines(festival).map((line, index) => (
                    <p key={`${festival.id}-${index}`} className={index === 0 ? 'festival-card__location-primary' : 'festival-card__location-secondary'}>
                      {line}
                    </p>
                  ))}
                </div>

                {festival.homepageUrl ? (
                  <div className="review-card__actions review-card__actions--course festival-card__actions">
                    <a className="review-link-button" href={festival.homepageUrl} target="_blank" rel="noreferrer">
                      홈페이지 열기
                    </a>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
