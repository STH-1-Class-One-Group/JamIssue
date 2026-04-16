import { MyPublishedRouteCard } from './MyPublishedRouteCard';
import { MyRouteDraftCard } from './MyRouteDraftCard';
import { useMyRouteDraftState } from './useMyRouteDraftState';
import type { MyRoutesTabSectionProps } from './myRoutesTabTypes';

export function MyRoutesTabSection({
  travelSessions,
  routes,
  routeSubmitting,
  routeError,
  onOpenPlace,
  onOpenRoute,
  onPublishRoute,
}: MyRoutesTabSectionProps) {
  const { unpublishedSessions, readDraft, updateDraft } = useMyRouteDraftState(travelSessions);

  return (
    <div className="stack-gap">
      <div className="review-stack">
        {unpublishedSessions.map((session) => {
          const draft = readDraft(session);
          return (
            <MyRouteDraftCard
              key={session.id}
              session={session}
              draft={draft}
              routeSubmitting={routeSubmitting}
              onOpenPlace={onOpenPlace}
              onUpdateDraft={updateDraft}
              onPublishRoute={onPublishRoute}
            />
          );
        })}
        {unpublishedSessions.length === 0 && <p className="empty-copy">아직 코스로 묶을 수 있는 여행 세션이 없어요.</p>}
      </div>

      {routeError ? <p className="form-error-copy">{routeError}</p> : null}

      <div className="review-stack">
        {routes.map((route) => (
          <MyPublishedRouteCard key={route.id} route={route} onOpenPlace={onOpenPlace} onOpenRoute={onOpenRoute} />
        ))}
        {routes.length === 0 && <p className="empty-copy">아직 발행한 코스가 없어요.</p>}
      </div>
    </div>
  );
}
