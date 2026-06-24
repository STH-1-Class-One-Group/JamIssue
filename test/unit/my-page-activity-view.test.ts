import { fireEvent, render, screen } from '@testing-library/react';
import { createElement, useState } from 'react';
import { describe, expect, it } from 'vitest';
import { ActivityCollectionShell } from '../../src/components/my-page-activity-view/ActivityCollectionShell';
import {
  UNDATED_ACTIVITY_KEY,
  getActivityMonthKey,
  groupActivitiesByDate,
  normalizeActivityDateKey,
} from '../../src/components/my-page-activity-view/activityDate';
import type { ActivityViewMode } from '../../src/components/my-page-activity-view/activityViewTypes';
import type { ActivityEntry } from '../../src/components/my-page-activity-view/activityViewTypes';

function createEntry(id: string, dateKey: string | null): ActivityEntry {
  return {
    id,
    kind: 'stamp',
    dateKey,
    title: id,
    renderListItem: () => id,
  };
}

describe('My Page activity view date helpers', () => {
  it('normalizes API date, ISO datetime, and display date strings to date keys', () => {
    expect(normalizeActivityDateKey('2026-03-27')).toBe('2026-03-27');
    expect(normalizeActivityDateKey('2026-03-27T18:00:00.000Z')).toBe('2026-03-27');
    expect(normalizeActivityDateKey('03. 28. 18:42', 2026)).toBe('2026-03-28');
  });

  it('keeps invalid dates grouped instead of dropping activities', () => {
    const grouped = groupActivitiesByDate([
      createEntry('valid-1', '2026-03-27'),
      createEntry('valid-2', '2026-03-27'),
      createEntry('invalid-1', null),
    ]);

    expect(grouped['2026-03-27']).toHaveLength(2);
    expect(grouped[UNDATED_ACTIVITY_KEY]).toHaveLength(1);
  });

  it('derives month keys only from normalized dates', () => {
    expect(getActivityMonthKey('2026-03-27')).toBe('2026-03');
    expect(getActivityMonthKey(null)).toBeNull();
  });
});

function ActivityShellHarness({ entries }: { entries: ActivityEntry[] }) {
  const [mode, setMode] = useState<ActivityViewMode>('list');
  return (
    createElement(ActivityCollectionShell, {
      entries,
      emptyState: createElement('p', null, 'empty'),
      mode,
      onModeChange: setMode,
    })
  );
}

describe('My Page activity collection shell', () => {
  it('switches between list and calendar views without dropping activity entries', () => {
    render(createElement(ActivityShellHarness, { entries: [
      {
        id: 'stamp-1',
        kind: 'stamp',
        dateKey: '2026-03-27',
        title: 'stamp',
        renderListItem: () => createElement('article', null, 'stamp list item'),
      },
    ] }));

    expect(screen.getByText('stamp list item')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('switch', { name: '달력 보기' }));

    expect(screen.getByRole('grid', { name: '활동 달력' })).toBeInTheDocument();
    expect(screen.getByText('2026-03-27 활동')).toBeInTheDocument();
    expect(screen.getByText('stamp list item')).toBeInTheDocument();
  });
});

