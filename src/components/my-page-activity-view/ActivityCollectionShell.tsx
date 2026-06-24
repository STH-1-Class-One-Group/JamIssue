import type { ReactNode } from 'react';
import { ActivityCalendarView } from './ActivityCalendarView';
import { ActivityListView } from './ActivityListView';
import { ActivityViewToggle } from './ActivityViewToggle';
import type { ActivityEntry, ActivityViewMode } from './activityViewTypes';

interface ActivityCollectionShellProps {
  entries: ActivityEntry[];
  emptyState: ReactNode;
  loadMoreSlot?: ReactNode;
  mode: ActivityViewMode;
  onModeChange: (mode: ActivityViewMode) => void;
}

export function ActivityCollectionShell({
  entries,
  emptyState,
  loadMoreSlot,
  mode,
  onModeChange,
}: ActivityCollectionShellProps) {
  return (
    <section className="activity-collection-shell" data-activity-view-mode={mode}>
      <div className="activity-collection-shell__toolbar">
        <div>
          <p className="eyebrow">ACTIVITY VIEW</p>
          <h3>활동 보기</h3>
        </div>
        <ActivityViewToggle mode={mode} onChange={onModeChange} />
      </div>

      {mode === 'calendar' ? (
        <ActivityCalendarView entries={entries} emptyState={emptyState} loadMoreSlot={loadMoreSlot} />
      ) : (
        <ActivityListView entries={entries} emptyState={emptyState} loadMoreSlot={loadMoreSlot} />
      )}
    </section>
  );
}
