import type { ReactNode } from 'react';

export type ActivityViewMode = 'list' | 'calendar';

export type ActivityKind = 'stamp' | 'feed' | 'comment' | 'route';

export interface ActivityEntry {
  id: string;
  kind: ActivityKind;
  dateKey: string | null;
  title: string;
  subtitle?: string;
  meta?: string;
  renderListItem: () => ReactNode;
  renderCalendarItem?: () => ReactNode;
}

