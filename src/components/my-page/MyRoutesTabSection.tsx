import { ActivityCollectionShell } from '../my-page-activity-view/ActivityCollectionShell';
import { normalizeActivityDateKey } from '../my-page-activity-view/activityDate';
import type { ActivityEntry } from '../my-page-activity-view/activityViewTypes';
import { MyPublishedRouteCard } from './MyPublishedRouteCard';
import { MyRouteDraftCard } from './MyRouteDraftCard';
import { useMyRouteDraftState } from './useMyRouteDraftState';
import type { MyRoutesTabSectionProps } from './myRoutesTabTypes';

export function MyRoutesTabSection({
  travelSessions,
  routes,
  routeSubmitting,
  routeError,
  viewMode,
  onOpenPlace,
  onOpenRoute,
  onPublishRoute,
  onViewModeChange,
}: MyRoutesTabSectionProps) {
  const { unpublishedSessions, readDraft, updateDraft } = useMyRouteDraftState(travelSessions);
  const draftEntries: ActivityEntry[] = unpublishedSessions.map((session) => {
    const draft = readDraft(session);
    return {
      id: `draft-${session.id}`,
      kind: 'route',
      dateKey: normalizeActivityDateKey(session.startedAt),
      title: draft.title,
      meta: session.durationLabel,
      renderListItem: () => (
        <MyRouteDraftCard
          session={session}
          draft={draft}
          routeSubmitting={routeSubmitting}
          onOpenPlace={onOpenPlace}
          onUpdateDraft={updateDraft}
          onPublishRoute={onPublishRoute}
        />
      ),
    };
  });
  const publishedEntries: ActivityEntry[] = routes.map((route) => ({
    id: route.id,
    kind: 'route',
    dateKey: normalizeActivityDateKey(route.createdAt),
    title: route.title,
    meta: route.createdAt,
    renderListItem: () => (
      <MyPublishedRouteCard route={route} onOpenPlace={onOpenPlace} onOpenRoute={onOpenRoute} />
    ),
  }));
  const entries = [...draftEntries, ...publishedEntries];

  return (
    <div className="stack-gap">
      {routeError ? <p className="form-error-copy">{routeError}</p> : null}
      <ActivityCollectionShell
        entries={entries}
        emptyState={<p className="empty-copy">아직 코스로 묶을 수 있는 여행 세션이나 발행한 코스가 없어요.</p>}
        mode={viewMode}
        onModeChange={onViewModeChange}
      />
    </div>
  );
}
