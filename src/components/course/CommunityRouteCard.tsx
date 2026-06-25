import { memo, type MutableRefObject } from 'react';
import type { SessionUser } from '../../types/auth';
import type { UserRoute } from '../../types/review';
import { ActionButton, ContentCard, FilterChip } from '../ui-kit';
import { HeartIcon } from '../review/ReviewActionIcons';
import type { RoutePreviewPayload } from './courseTabTypes';

interface CommunityRouteCardProps {
  route: UserRoute;
  highlightedRouteId: string | null;
  routeLikeUpdatingId: string | null;
  sessionUser: SessionUser | null;
  placeNameById: Record<string, string>;
  routeRefs: MutableRefObject<Record<string, HTMLElement | null>>;
  onToggleLike: (routeId: string) => Promise<void>;
  onOpenPlace: (placeId: string) => void;
  onOpenRoutePreview: (route: RoutePreviewPayload) => void;
  onRequestLogin: () => void;
}

export const CommunityRouteCard = memo(function CommunityRouteCard({
  route,
  highlightedRouteId,
  routeLikeUpdatingId,
  sessionUser,
  placeNameById,
  routeRefs,
  onToggleLike,
  onOpenPlace,
  onOpenRoutePreview,
  onRequestLogin,
}: CommunityRouteCardProps) {
  return (
    <ContentCard
      as="article"
      ref={(node) => {
        routeRefs.current[route.id] = node;
      }}
      className={route.id === highlightedRouteId ? 'community-route-card community-route-card--highlighted' : 'community-route-card'}
      interactive
    >
      <div className="community-route-card__header community-route-card__header--feedlike">
        <div className="community-route-card__title-block">
          <div className="community-route-card__tag-row">
            <FilterChip selected={route.isUserGenerated}>{route.isUserGenerated ? '사용자 경로' : '큐레이션'}</FilterChip>
          </div>
          <h4>{route.title}</h4>
          <p className="community-route-meta community-route-meta--inline">{route.author} / {route.createdAt}</p>
        </div>
        <ActionButton
          type="button"
          size="sm"
          variant={route.likedByMe ? 'primary' : 'secondary'}
          className={route.likedByMe ? 'community-like-button is-active' : 'community-like-button'}
          disabled={routeLikeUpdatingId === route.id}
          onClick={() => (sessionUser ? onToggleLike(route.id) : onRequestLogin())}
          aria-pressed={route.likedByMe}
        >
          <span className="review-action-button__icon" aria-hidden="true"><HeartIcon filled={route.likedByMe} /></span>
          <span className="review-action-button__label">{route.likeCount}</span>
        </ActionButton>
      </div>
      <p>{route.description}</p>
      <div className="course-card__places community-route-places">
        {route.placeIds.map((placeId, index) => (
          <FilterChip key={route.id + '-' + placeId} className="course-card__place" onClick={() => onOpenPlace(placeId)}>
            {index + 1}. {route.placeNames[index] ?? placeNameById[placeId] ?? placeId}
          </FilterChip>
        ))}
      </div>
      <div className="review-card__actions review-card__actions--course">
        <ActionButton
          type="button"
          size="sm"
          variant="secondary"
          className="review-link-button"
          onClick={() => onOpenRoutePreview({
            id: route.id,
            title: route.title,
            subtitle: route.author + ' / ' + route.createdAt,
            mood: route.mood,
            placeIds: route.placeIds,
            placeNames: route.placeNames,
          })}
        >
          지도에서 보기
        </ActionButton>
      </div>
    </ContentCard>
  );
});
