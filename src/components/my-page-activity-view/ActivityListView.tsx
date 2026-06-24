import type { ReactNode } from 'react';
import type { ActivityEntry } from './activityViewTypes';

interface ActivityListViewProps {
  entries: ActivityEntry[];
  emptyState: ReactNode;
  loadMoreSlot?: ReactNode;
}

export function ActivityListView({ entries, emptyState, loadMoreSlot }: ActivityListViewProps) {
  return (
    <div className="review-stack activity-list-view" data-activity-view="list">
      {entries.map((entry) => (
        <div key={entry.id} className="activity-list-view__item" data-activity-kind={entry.kind}>
          {entry.renderListItem()}
        </div>
      ))}
      {entries.length === 0 ? emptyState : null}
      {loadMoreSlot}
    </div>
  );
}

