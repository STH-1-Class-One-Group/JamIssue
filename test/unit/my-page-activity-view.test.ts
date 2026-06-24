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

function createRenderedEntry(id: string, dateKey: string | null, text: string): ActivityEntry {
  return {
    id,
    kind: 'stamp',
    dateKey,
    title: id,
    renderListItem: () => createElement('article', null, text),
  };
}

describe('My Page activity view date helpers', () => {
  it('normalizes API date, ISO datetime, and display date strings to date keys', () => {
    expect(normalizeActivityDateKey('2026-03-27')).toBe('2026-03-27');
    expect(normalizeActivityDateKey('2026-03-27T18:00:00.000Z')).toBe('2026-03-27');
    expect(normalizeActivityDateKey('03. 28. 18:42', 2026)).toBe('2026-03-28');
  });

  it('uses the current year when normalizing display dates without an explicit fallback year', () => {
    const currentYear = new Date().getFullYear();

    expect(normalizeActivityDateKey('03. 28. 18:42')).toBe(`${currentYear}-03-28`);
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

function ActivityShellHarness({
  entries,
  emptyState = createElement('p', null, 'empty'),
  loadMoreSlot,
}: {
  entries: ActivityEntry[];
  emptyState?: ReturnType<typeof createElement>;
  loadMoreSlot?: ReturnType<typeof createElement>;
}) {
  const [mode, setMode] = useState<ActivityViewMode>('list');
  return createElement(ActivityCollectionShell, {
    entries,
    emptyState,
    loadMoreSlot,
    mode,
    onModeChange: setMode,
  });
}

describe('My Page activity collection shell', () => {
  it('switches between list and calendar views without dropping activity entries', () => {
    const { container } = render(createElement(ActivityShellHarness, {
      entries: [createRenderedEntry('stamp-1', '2026-03-27', 'stamp list item')],
    }));

    expect(screen.getByText('stamp list item')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('switch'));

    expect(screen.getByRole('grid')).toBeInTheDocument();
    expect(container.querySelector('[data-activity-view="calendar"]')).not.toBeNull();
    expect(screen.getByText('stamp list item')).toBeInTheDocument();
  });

  it('renders the provided empty state when no entries exist', () => {
    render(createElement(ActivityShellHarness, {
      entries: [],
      emptyState: createElement('p', null, 'no activity'),
    }));

    expect(screen.getByText('no activity')).toBeInTheDocument();
  });

  it('renders loadMoreSlot in list and calendar modes', () => {
    render(createElement(ActivityShellHarness, {
      entries: [createRenderedEntry('stamp-1', '2026-03-27', 'stamp list item')],
      loadMoreSlot: createElement('button', { type: 'button' }, 'load more'),
    }));

    expect(screen.getByRole('button', { name: 'load more' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('switch'));

    expect(screen.getByRole('button', { name: 'load more' })).toBeInTheDocument();
  });

  it('keeps undated entries visible in calendar mode', () => {
    render(createElement(ActivityShellHarness, {
      entries: [createRenderedEntry('stamp-undated', null, 'undated activity')],
    }));

    fireEvent.click(screen.getByRole('switch'));

    expect(screen.getByText('undated activity')).toBeInTheDocument();
  });
});
