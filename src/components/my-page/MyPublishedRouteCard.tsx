import { HeartIcon } from '../review/ReviewActionIcons';
import type { UserRoute } from './myRoutesTabTypes';

interface MyPublishedRouteCardProps {
  route: UserRoute;
  onOpenPlace: (placeId: string) => void;
  onOpenRoute: (routeId: string) => Promise<void>;
}

export function MyPublishedRouteCard({ route, onOpenPlace, onOpenRoute }: MyPublishedRouteCardProps) {
  return (
    <article className="community-route-card community-route-card--my">
      <div className="community-route-card__header community-route-card__header--feedlike">
        <div className="community-route-card__title-block">
          <div className="community-route-card__tag-row">
            <span className="soft-tag">발행 완료</span>
          </div>
          <h4>{route.title}</h4>
          <p className="community-route-meta community-route-meta--inline">{route.createdAt}</p>
        </div>
        <span className="review-action-button review-action-button--static community-like-button" aria-hidden="true">
          <span className="review-action-button__icon"><HeartIcon filled={true} /></span>
          <span className="review-action-button__label">{route.likeCount}</span>
        </span>
      </div>
      <p>{route.description}</p>
      <div className="course-card__places community-route-places">
        {route.placeIds.map((placeId, index) => (
          <button key={`${route.id}-${placeId}`} type="button" className="soft-tag soft-tag--button course-card__place" onClick={() => onOpenPlace(placeId)}>
            {index + 1}. {route.placeNames[index] ?? placeId}
          </button>
        ))}
      </div>
      <div className="review-card__actions review-card__actions--course">
        <button type="button" className="review-link-button" onClick={() => void onOpenRoute(route.id)}>
          코스 탭에서 보기
        </button>
      </div>
    </article>
  );
}
